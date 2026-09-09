package com.pypecrm.app.services

import android.content.Context
import android.util.Log
import androidx.work.*
import com.pypecrm.app.data.AppDatabase
import com.pypecrm.app.data.CallBufferEntity
import com.pypecrm.app.data.SyncQueueEntry
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit

class UnifiedSyncWorker(context: Context, workerParams: WorkerParameters) : CoroutineWorker(context, workerParams) {

    private var hasAuthFailure = false

    override suspend fun doWork(): Result {
        Log.d("UnifiedSync", "Starting sync cycle...")
        val db = AppDatabase.getDatabase(applicationContext)
        val pendingItems = db.syncQueueDao().getAllPending()
        
        Log.d("UnifiedSync", "Found ${pendingItems.size} pending items in queue")
        
        var allSuccess = true
        for (item in pendingItems) {
            if (hasAuthFailure) {
                Log.w("UnifiedSync", "Pre-empting sync item due to auth failure.")
                allSuccess = false
                break
            }
            val success = processSyncItem(item)
            if (success) {
                db.syncQueueDao().delete(item)
                Log.d("UnifiedSync", "Synced and deleted item: ${item.id} (${item.type})")
            } else {
                db.syncQueueDao().incrementAttempts(item.id)
                allSuccess = false
                Log.w("UnifiedSync", "Sync failed for item: ${item.id}. Will retry later.")
            }
        }

        // Perform "Consolidated Truth" reconciliation for calls (if token valid)
        if (!hasAuthFailure) {
            consolidateCallBuffer()
        }

        // Also perform a "Self-Healing" scan of the system CallLog to catch anything missed (if token valid).
        // A manual "Sync" tap from the web app (see CRMBridge.syncLeads) passes forceDeepScan=true so
        // it re-scans the full lookback window instead of just "since last checkpoint" — this is the
        // user-facing recovery path for calls that were missed by earlier app versions or long Doze gaps.
        if (!hasAuthFailure) {
            val forceDeepScan = inputData.getBoolean("forceDeepScan", false)
            performSelfHealingCallLogSync(forceDeepScan)
        }
        
        // Recover WhatsApp messages from SharedPreferences fallback
        recoverWhatsAppFallbackQueue(db)

        return if (hasAuthFailure) {
            Log.e("UnifiedSync", "Worker finished with JWT auth failure. Halting WorkManager retries.")
            Result.failure()
        } else if (allSuccess) {
            Result.success()
        } else {
            Result.retry()
        }
    }

    private suspend fun processSyncItem(item: SyncQueueEntry): Boolean {
        return try {
            when (item.type) {
                "CALL_LOG" -> uploadMetadata(item.payload)
                "WHATSAPP" -> uploadWhatsApp(item.payload)
                "RECORDING" -> uploadRecording(item.payload, item.filePath)
                else -> true // Unknown type, skip
            }
        } catch (e: Exception) {
            Log.e("UnifiedSync", "Error processing item ${item.id}", e)
            false
        }
    }

    private suspend fun recoverWhatsAppFallbackQueue(db: AppDatabase) {
        try {
            val prefs = applicationContext.getSharedPreferences("crm_whatsapp_fallback", Context.MODE_PRIVATE)
            val existing = prefs.getString("failed_messages", "[]")
            if (existing == "[]") return
            
            val array = org.json.JSONArray(existing)
            for (i in 0 until array.length()) {
                val json = array.getJSONObject(i)
                db.syncQueueDao().insert(
                    SyncQueueEntry(type = "WHATSAPP", payload = json.toString())
                )
            }
            prefs.edit().putString("failed_messages", "[]").apply()
            Log.d("UnifiedSync", "Recovered ${array.length()} WhatsApp messages from fallback")
        } catch (e: Exception) {
            Log.e("UnifiedSync", "Error recovering WhatsApp fallback", e)
        }
    }

    private fun getAuthData(): Pair<String, String>? {
        val prefs = applicationContext.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)
        val apiBase = prefs.getString("api_url", "https://api.dadcrm.com")?.trimEnd('/')
        return if (token != null && apiBase != null) token to apiBase else null
    }

    private fun uploadMetadata(payload: String): Boolean {
        val (token, apiBase) = getAuthData() ?: return false
        val json = JSONObject(payload)
        
        val requestBodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
        json.keys().forEach { key ->
            val value = json.optString(key)
            if (value != "null") requestBodyBuilder.addFormDataPart(key, value)
        }

        val request = Request.Builder()
            .url("$apiBase/api/android/recordings")
            .addHeader("Authorization", "Bearer $token")
            .post(requestBodyBuilder.build())
            .build()

        return executeRequest(request)
    }

    private fun uploadWhatsApp(payload: String): Boolean {
        val (token, apiBase) = getAuthData() ?: return false
        val requestBody = RequestBody.create("application/json".toMediaTypeOrNull(), payload)
        
        val request = Request.Builder()
            .url("$apiBase/api/android/whatsapp/sync")
            .addHeader("Authorization", "Bearer $token")
            .post(requestBody)
            .build()
            
        return executeRequest(request)
    }

    private fun uploadRecording(payload: String, filePath: String?): Boolean {
        if (filePath == null) return uploadMetadata(payload)
        val file = File(filePath)
        if (!file.exists()) return true // File gone, nothing to do
        
        val (token, apiBase) = getAuthData() ?: return false
        val json = JSONObject(payload)
        
        val requestBodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
        json.keys().forEach { key ->
            val value = json.optString(key)
            if (value != "null") requestBodyBuilder.addFormDataPart(key, value)
        }
        
        requestBodyBuilder.addFormDataPart(
            "audio",
            file.name,
            file.asRequestBody("audio/mp4".toMediaTypeOrNull())
        )

        val request = Request.Builder()
            .url("$apiBase/api/android/recordings")
            .addHeader("Authorization", "Bearer $token")
            .post(requestBodyBuilder.build())
            .build()
            
        val success = executeRequest(request)
        if (success) file.delete() // Cleanup file on success
        return success
    }

    private fun executeRequest(request: Request): Boolean {
        val client = OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(300, TimeUnit.SECONDS)
            .writeTimeout(300, TimeUnit.SECONDS)
            .build()
        return try {
            client.newCall(request).execute().use { response ->
                if (response.code == 401) {
                    hasAuthFailure = true
                    Log.e("UnifiedSync", "Auth failure (401) during network request")
                }
                response.isSuccessful
            }
        } catch (e: Exception) {
            false
        }
    }

    private suspend fun consolidateCallBuffer() {
        val db = AppDatabase.getDatabase(applicationContext)
        val unconsolidated = db.callBufferDao().getUnconsolidated()
        
        Log.d("UnifiedSync", "Consolidating ${unconsolidated.size} buffered call interactions...")
        
        for (buffer in unconsolidated) {
            // ATOMIC CLAIM: Try to lock this record for processing
            val affectedRows = db.callBufferDao().markAsProcessing(buffer.callSessionId)
            if (affectedRows == 0) {
                Log.d("UnifiedSync", "Session ${buffer.callSessionId} already being processed by another worker. Skipping.")
                continue
            }

            // Wait slightly if call was VERY recent (to let OS write log)
            val age = System.currentTimeMillis() - buffer.createdAt
            if (age < 10000) {
                Log.d("UnifiedSync", "Session ${buffer.callSessionId} is too fresh, resetting to PENDING.")
                buffer.status = 0
                db.callBufferDao().update(buffer)
                continue
            }
            
            val logTruth = getTalkTimeFromCallLog(buffer.phoneNumber, buffer.startTime)
            
            // Reconcile duration from hardware log
            val finalDuration = logTruth?.duration ?: 0
            val finalHwId = logTruth?.hardwareId ?: ""
            
            // TIMESTAMP FIX: Always use buffer.startTime (captured when call began on device)
            // as the authoritative timestamp. The hardware log DATE field reflects when the
            // call entry was written (post-call), which causes timestamp skew in the CRM.
            val finalTimestamp = buffer.startTime
            
            Log.d("UnifiedSync", "Reconciled Truth for ${buffer.phoneNumber}: Dur=${finalDuration}s, HwId=$finalHwId, StartTime=${buffer.startTime}")
            
            val success = uploadConsolidatedReport(buffer, finalDuration, finalTimestamp, finalHwId)
            if (success) {
                buffer.isConsolidated = true
                buffer.status = 2 // COMPLETED
                db.callBufferDao().update(buffer)
                Log.d("UnifiedSync", "Successfully consolidated and uploaded session: ${buffer.callSessionId}")
            } else {
                Log.w("UnifiedSync", "Upload failed for session: ${buffer.callSessionId}. Resetting to PENDING for retry.")
                buffer.status = 0 // PENDING
                db.callBufferDao().update(buffer)
            }
        }
        
        db.callBufferDao().cleanup(System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000L))
    }

    private fun getTalkTimeFromCallLog(phoneNumber: String, startTime: Long): LogResult? {
        val suffix = phoneNumber.replace(Regex("[^0-9]"), "").takeLast(10)
        if (suffix.length < 10) return null
        
        try {
            // Search window: Starts 1 minute before buffer.startTime, ends now.
            val searchStart = startTime - 60_000
            val selection = "${android.provider.CallLog.Calls.NUMBER} LIKE ? AND ${android.provider.CallLog.Calls.DATE} >= ?"
            val selectionArgs = arrayOf("%$suffix", searchStart.toString())

            val cursor = applicationContext.contentResolver.query(
                android.provider.CallLog.Calls.CONTENT_URI,
                arrayOf(
                    android.provider.CallLog.Calls.DURATION, 
                    android.provider.CallLog.Calls.DATE, 
                    android.provider.CallLog.Calls._ID,
                    android.provider.CallLog.Calls.TYPE
                ),
                selection, 
                selectionArgs,
                android.provider.CallLog.Calls.DATE + " DESC LIMIT 1"
            )
            cursor?.use {
                if (it.moveToFirst()) {
                    val duration = it.getInt(0)
                    val timestamp = it.getLong(1)
                    val hardwareId = it.getLong(2).toString()
                    return LogResult(duration, timestamp, hardwareId)
                }
            }
        } catch (e: Exception) {
            Log.e("UnifiedSync", "Error reading CallLog truth", e)
        }
        return null
    }

    private data class LogResult(val duration: Int, val timestamp: Long, val hardwareId: String)

    private fun uploadConsolidatedReport(buffer: CallBufferEntity, duration: Int, timestamp: Long, hwId: String): Boolean {
        val (token, apiBase) = getAuthData() ?: return false
        
        val requestBodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
            .addFormDataPart("phoneNumber", buffer.phoneNumber)
            .addFormDataPart("duration", duration.toString())
            .addFormDataPart("hardwareDuration", duration.toString()) // Carrier truth
            .addFormDataPart("callType", buffer.type)
            .addFormDataPart("timestamp", timestamp.toString())
            .addFormDataPart("hardwareId", hwId)
            .addFormDataPart("callSessionId", buffer.callSessionId)
            
        val path = buffer.recordingPath
        if (path != null) {
            val file = File(path)
            if (file.exists()) {
                requestBodyBuilder.addFormDataPart(
                    "audio",
                    file.name,
                    file.asRequestBody("audio/mp4".toMediaTypeOrNull())
                )
            }
        }

        val request = Request.Builder()
            .url("$apiBase/api/android/recordings")
            .addHeader("Authorization", "Bearer $token")
            .post(requestBodyBuilder.build())
            .build()

        val success = executeRequest(request)
        if (success) {
            val path = buffer.recordingPath
            if (path != null) {
                File(path).delete()
            }
        }
        return success
    }

    private fun performSelfHealingCallLogSync(forceDeepScan: Boolean = false) {
        // Self-Healing scan: catches anything the real-time CallTrackerService missed.
        // The hardwareId from each log entry ensures the server's fuzzy-match or race-check
        // can merge it into an existing interaction rather than creating a ghost.
        // Calls that were already uploaded by CallTrackerService via /recordings will be
        // matched by hardwareId on the server and healed, not duplicated.
        //
        // Window logic: this used to be a fixed rolling "last 2 hours", which silently
        // dropped calls forever whenever two successful syncs were more than 2h apart
        // (server-side rate limiting or Doze-delayed WorkManager runs both do this in
        // practice). Instead we persist the timestamp of the last successful sync and
        // always scan from there — a gap just means the next successful sync covers a
        // wider window, nothing ages out. On first run (no checkpoint yet — fresh install,
        // or the app/helper was installed or updated partway through the day) we bootstrap
        // to the start of the current calendar day, since the device's CallLog holds the
        // full day's history regardless of when the app itself was installed.
        //
        // forceDeepScan (manual "Sync" button only — see CRMBridge.syncLeads): ignores the
        // checkpoint entirely and re-scans the full 7-day safety-cap window. This is the
        // recovery path for calls an *older* app version dropped (e.g. the old fixed
        // "last 2 hours" bug) — those calls are still sitting in the device's CallLog, just
        // never uploaded. Re-sending already-synced calls is harmless: the server matches
        // them by hardwareId and heals the existing record instead of duplicating it.
        try {
            val (token, apiBase) = getAuthData() ?: return
            val prefs = applicationContext.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
            val lastSyncTs = if (forceDeepScan) -1L else prefs.getLong(KEY_LAST_CALL_SYNC_TS, -1L)

            val startOfToday = java.util.Calendar.getInstance().apply {
                set(java.util.Calendar.HOUR_OF_DAY, 0)
                set(java.util.Calendar.MINUTE, 0)
                set(java.util.Calendar.SECOND, 0)
                set(java.util.Calendar.MILLISECOND, 0)
            }.timeInMillis

            // Safety cap: never scan back further than 7 days even if the checkpoint is very
            // stale (e.g. the device was offline/unused for a long time), to bound query size.
            val maxLookback = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)

            val windowStart = when {
                forceDeepScan -> maxLookback
                lastSyncTs < 0 -> startOfToday
                lastSyncTs < maxLookback -> maxLookback
                else -> lastSyncTs
            }

            val cursor = applicationContext.contentResolver.query(
                android.provider.CallLog.Calls.CONTENT_URI,
                arrayOf(
                    android.provider.CallLog.Calls.NUMBER,
                    android.provider.CallLog.Calls.DURATION,
                    android.provider.CallLog.Calls.TYPE,
                    android.provider.CallLog.Calls.DATE,
                    android.provider.CallLog.Calls._ID
                ),
                android.provider.CallLog.Calls.DATE + " > ?",
                arrayOf(windowStart.toString()),
                android.provider.CallLog.Calls.DATE + " DESC"
            )

            val callsJson = org.json.JSONArray()
            cursor?.use {
                while (it.moveToNext()) {
                    val hwId = it.getLong(4).toString()
                    val carrierDuration = it.getString(1)
                    // Use the hardware log DATE as timestamp for self-healed entries
                    // (these are historical calls, no capturedStartTime is available)
                    val call = JSONObject().apply {
                        put("phoneNumber", it.getString(0))
                        put("duration", carrierDuration)
                        put("hardwareDuration", carrierDuration)
                        put("callType", it.getInt(2).toString())
                        put("timestamp", it.getString(3))
                        put("hardwareId", hwId)
                        // No callSessionId: server will match by hardwareId to avoid duplicates
                    }
                    callsJson.put(call)
                }
            }

            // Capture "now" before the network call so the next window can't miss a call
            // that lands in the CallLog while this request is in flight.
            val syncedThrough = System.currentTimeMillis()

            if (callsJson.length() == 0) {
                // Nothing to send, but the window itself was clear — advance the
                // checkpoint anyway so we don't keep re-querying the same empty range.
                prefs.edit().putLong(KEY_LAST_CALL_SYNC_TS, syncedThrough).apply()
                return
            }

            val payload = JSONObject().apply { put("calls", callsJson) }
            val requestBody = RequestBody.create("application/json".toMediaTypeOrNull(), payload.toString())

            val request = Request.Builder()
                .url("$apiBase/api/android/bulk-sync")
                .addHeader("Authorization", "Bearer $token")
                .post(requestBody)
                .build()

            val success = executeRequest(request)
            if (success) {
                // Only advance the checkpoint on confirmed success (2xx). A rate-limit
                // (429), network error, or server failure leaves it untouched so the next
                // attempt naturally re-covers this same window plus whatever's new since.
                prefs.edit().putLong(KEY_LAST_CALL_SYNC_TS, syncedThrough).apply()
            }
            Log.d("UnifiedSync", "Self-healing bulk sync: ${callsJson.length()} logs since ${java.util.Date(windowStart)}, success=$success")
        } catch (e: Exception) {
            Log.e("UnifiedSync", "Self-healing sync failed", e)
        }
    }

    companion object {
        private const val KEY_LAST_CALL_SYNC_TS = "last_call_sync_ts"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<UnifiedSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.LINEAR, 1, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "UnifiedSyncWork",
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
            
            // Also trigger an immediate run
            val oneTimeRequest = OneTimeWorkRequestBuilder<UnifiedSyncWorker>()
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueue(oneTimeRequest)
            
            Log.d("UnifiedSync", "Sync worker scheduled")
        }
    }
}

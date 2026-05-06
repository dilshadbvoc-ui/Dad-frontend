package com.pypecrm.app.services

import android.accessibilityservice.AccessibilityService
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.app.NotificationCompat
import com.pypecrm.app.data.AppDatabase
import com.pypecrm.app.data.CallBufferEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit
import android.database.ContentObserver
import android.net.Uri
import android.provider.CallLog
import android.os.Handler
import android.os.Looper

class CallAccessibilityService : AccessibilityService() {

    private var isCallActive = false
    private var currentLeadId: String? = null
    private var currentPhoneNum: String? = null
    private var callStartTime: Long = 0
    private var currentCallFile: File? = null
    private lateinit var recorderService: AudioRecorderService
    private var currentSessionId: String? = null
    private var isOutgoing = false
    private var callHistoryObserver: ContentObserver? = null

    private val callStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action
            val number = intent.getStringExtra("number")
            val outgoing = intent.getBooleanExtra("is_outgoing", false)

            when (action) {
                "ACTION_CALL_STARTED" -> {
                    if (number != null && !isCallActive) {
                        currentPhoneNum = number
                        isOutgoing = outgoing
                        currentSessionId = intent.getStringExtra("session_id")
                        startRecordingSync(number)
                    }
                }
                "ACTION_CALL_ENDED" -> {
                    if (isCallActive) {
                        stopRecordingSync()
                    }
                    // Reset inbound lock for future calls
                    lastInboundSignalTime = 0
                }
            }
        }
    }

    private var lastInboundSignalTime: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        recorderService = AudioRecorderService(this)
        
        val filter = IntentFilter().apply {
            addAction("ACTION_CALL_STARTED")
            addAction("ACTION_CALL_ENDED")
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(callStateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(callStateReceiver, filter)
        }
        
        setupCallLogObserver()
        Log.d("CallExtService", "CRM Accessibility Service Connected & Listening for System Changes")
    }

    private fun setupCallLogObserver() {
        callHistoryObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean, uri: Uri?) {
                super.onChange(selfChange, uri)
                Log.d("CallExtService", "CallLog change detected, verifying official duration...")
                
                // When the log changes, we wake up the sync worker to perform consolidation
                com.pypecrm.app.services.UnifiedSyncWorker.schedule(applicationContext)
            }
        }
        
        contentResolver.registerContentObserver(
            CallLog.Calls.CONTENT_URI,
            true,
            callHistoryObserver!!
        )
    }

    override fun onDestroy() {
        callHistoryObserver?.let {
            contentResolver.unregisterContentObserver(it)
        }
        super.onDestroy()
    }

    private fun startRecordingSync(number: String) {
        CoroutineScope(Dispatchers.IO).launch {
            val cleanPhone = number.replace(Regex("[^0-9+]"), "")
            val lead = AppDatabase.getDatabase(applicationContext).leadDao().findLeadByPhone(cleanPhone)
            
            if (lead != null) {
                currentLeadId = lead.id
                currentPhoneNum = cleanPhone
                isCallActive = true
                callStartTime = System.currentTimeMillis()
                
                if (!isOutgoing) {
                    lastInboundSignalTime = System.currentTimeMillis()
                }

                Log.d("CallExtService", "Recording matched lead: ${lead.firstName}. Starting recorder.")
                currentCallFile = recorderService.startRecording(lead.id, cleanPhone)
            }
        }
    }

    private fun stopRecordingSync() {
        Log.d("CallExtService", "Stopping recording due to Tracker event")
        isCallActive = false
        recorderService.stopRecording()
        
        val sessId = currentSessionId
        val recordedFile = currentCallFile

        if (sessId != null && recordedFile != null && recordedFile.exists()) {
            CoroutineScope(Dispatchers.IO).launch {
                val db = AppDatabase.getDatabase(applicationContext)
                val buffer = db.callBufferDao().getBySessionId(sessId)
                if (buffer != null) {
                    buffer.recordingPath = recordedFile.absolutePath
                    db.callBufferDao().update(buffer)
                    Log.d("CallExtService", "Attached recording to buffer for session: $sessId")
                } else {
                    Log.e("CallExtService", "Failed to find buffer entry for session: $sessId")
                }
                
                // Wake up the worker to check for consolidation
                com.pypecrm.app.services.UnifiedSyncWorker.schedule(applicationContext)
            }
        }
        
        // Cleanup state immediately
        currentLeadId = null
        currentPhoneNum = null
        currentCallFile = null
        currentSessionId = null
    }

    data class LogResult(val duration: Int, val timestamp: Long, val hardwareId: String)

    private fun getTalkTimeFromCallLog(phoneNumber: String?): LogResult? {
        var duration = 0
        var timestamp = 0L
        val cleanQuery = phoneNumber?.replace(Regex("[^0-9]"), "") ?: ""
        val suffix = if (cleanQuery.length >= 10) cleanQuery.takeLast(10) else cleanQuery

        // Retry logic: System log may take time to update
        for (i in 1..10) {
            try {
                // Selection: Match by last 10 digits AND within last 2 minutes
                val twoMinsAgo = System.currentTimeMillis() - 120_000
                val selection = "${CallLog.Calls.NUMBER} LIKE ? AND ${CallLog.Calls.DATE} >= ?"
                val selectionArgs = arrayOf("%$suffix", twoMinsAgo.toString())

                val cursor = contentResolver.query(
                    CallLog.Calls.CONTENT_URI,
                    arrayOf(CallLog.Calls.DURATION, CallLog.Calls.NUMBER, CallLog.Calls.DATE, CallLog.Calls._ID),
                    selection, 
                    selectionArgs,
                    CallLog.Calls.DATE + " DESC LIMIT 1"
                )
                cursor?.use {
                    if (it.moveToFirst()) {
                        duration = it.getInt(0)
                        val logNumber = it.getString(1)
                        timestamp = it.getLong(2)
                        val hardwareId = it.getLong(3).toString()
                        
                        if (duration > 0 || timestamp > 0) {
                            Log.d("CallExtService", "Found Official Log Record: dur=$duration, time=$timestamp, hwId=$hardwareId (Num: $logNumber)")
                            return LogResult(duration, timestamp, hardwareId)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("CallExtService", "Error reading TalkTime from Log (Attempt $i)", e)
            }
            
            // Wait and retry if duration was 0 or query failed
            if (i < 10) {
                Thread.sleep(3000L)
            }
        }
        return null
    }

    private var lastWhatsAppMessage: String? = null
    private var lastWhatsAppContact: String? = null

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString() ?: return
        
        // 1. WhatsApp Monitoring
        if (packageName == "com.whatsapp" || packageName == "com.whatsapp.w4b") {
            val rootNode = rootInActiveWindow ?: return
            scanWhatsAppUI(rootNode, packageName)
            return
        }

        // 2. Dialer Monitoring (Existing)
        if (packageName == "com.google.android.dialer" || packageName == "com.android.incallui" || packageName == "com.samsung.android.incallui") {
            val rootNode = rootInActiveWindow ?: return
            scanForPhoneNumberAndState(rootNode)
        }
    }

    private fun scanWhatsAppUI(node: AccessibilityNodeInfo?, pkg: String) {
        if (node == null) return

        // 1. Identify Chat Contact (Header)
        // IDs: com.whatsapp:id/conversation_contact_name OR com.whatsapp.w4b:id/conversation_contact_name
        var contactNameNode = node.findAccessibilityNodeInfosByViewId("$pkg:id/conversation_contact_name")
        if (contactNameNode.isEmpty()) {
            // Fallback for some versions or Business app variants
            contactNameNode = node.findAccessibilityNodeInfosByViewId("$pkg:id/chat_name")
        }
        
        val currentContact = if (contactNameNode.isNotEmpty()) contactNameNode[0].text?.toString() else null
        
        // 2. Scan for Messages
        // IDs: com.whatsapp:id/message_text OR com.whatsapp.w4b:id/message_text
        var messageNodes = node.findAccessibilityNodeInfosByViewId("$pkg:id/message_text")
        if (messageNodes.isEmpty()) {
            // Check for list-based message IDs
            messageNodes = node.findAccessibilityNodeInfosByViewId("$pkg:id/conversation_row_text")
        }
        if (messageNodes.isEmpty()) {
             messageNodes = node.findAccessibilityNodeInfosByViewId("$pkg:id/entry")
        }
        if (messageNodes.isEmpty()) {
            messageNodes = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/message_text")
        }
        
        if (messageNodes.isNotEmpty() && currentContact != null) {
            val latestMessageNode = messageNodes.last()
            val messageText = latestMessageNode.text?.toString() ?: ""
            
            // Simple duplicate check: Only sync if contact or message changed
            if (messageText != lastWhatsAppMessage || currentContact != lastWhatsAppContact) {
                lastWhatsAppMessage = messageText
                lastWhatsAppContact = currentContact
                Log.d("WhatsAppSync", "New message detected for $currentContact: $messageText")
                
                // Determine direction (heuristic: sent messages usually have a different container ID or gravity)
                // For now, we'll label it "Sync" and let the user see it's from the phone
                syncWhatsAppToCrm(currentContact, messageText)
            }
        }

        // Note: Recurse if needed, but findAccessibilityNodeInfosByViewId is more efficient
    }

    private fun syncWhatsAppToCrm(contact: String, message: String) {
        val prefs = getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)
        val apiBase = prefs.getString("api_url", "https://www.pypecrm.com")?.trimEnd('/')

        if (token == null || apiBase == null) return

        CoroutineScope(Dispatchers.IO).launch {
            val client = OkHttpClient.Builder().build()
            
            val json = org.json.JSONObject().apply {
                put("phoneNumber", contact) // Scraped name/number
                put("messageText", message)
                put("direction", "sync") // Generic sync direction
                put("timestamp", System.currentTimeMillis().toString())
            }

            val requestBody = okhttp3.RequestBody.create(
                "application/json".toMediaTypeOrNull(),
                json.toString()
            )

            val request = Request.Builder()
                .url("$apiBase/api/android/whatsapp/sync")
                .addHeader("Authorization", "Bearer $token")
                .post(requestBody)
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.e("WhatsAppSync", "Sync failed: ${response.code}, queuing")
                        queueWhatsAppForSync(contact, message)
                    } else {
                        Log.d("WhatsAppSync", "Successfully synced message for $contact")
                    }
                }
            } catch (e: Exception) {
                Log.e("WhatsAppSync", "Network error, queuing for offline sync", e)
                queueWhatsAppForSync(contact, message)
            }
        }
    }

    private fun queueWhatsAppForSync(contact: String, message: String) {
        val json = org.json.JSONObject().apply {
            put("phoneNumber", contact)
            put("messageText", message)
            put("direction", "sync")
            put("timestamp", System.currentTimeMillis().toString())
        }
        CoroutineScope(Dispatchers.IO).launch {
            AppDatabase.getDatabase(applicationContext).syncQueueDao().insert(
                com.pypecrm.app.data.SyncQueueEntry(type = "WHATSAPP", payload = json.toString())
            )
        }
    }

    private fun scanForPhoneNumberAndState(node: AccessibilityNodeInfo?) {
        if (node == null) return

        val text = node.text?.toString()?.trim() ?: ""

        // Regex to find phone numbers, e.g., +1234567890 or 123-456-7890
        val phoneRegex = Regex("^\\+?[0-9\\- ]{7,15}$")
        if (phoneRegex.matches(text) && currentPhoneNum != text) {
            Log.d("CallExtService", "Detected Phone Number in Dialer UI: $text")
            
            // Check if this number is a lead in our SQLite Database
            CoroutineScope(Dispatchers.IO).launch {
                val cleanPhone = text.replace(Regex("[^0-9+]"), "")
                val lead = AppDatabase.getDatabase(applicationContext).leadDao().findLeadByPhone(cleanPhone)
                
                if (lead != null && !isCallActive) {
                    currentPhoneNum = cleanPhone
                    currentLeadId = lead.id
                    Log.d("CallExtService", "Lead MATCHED: ${lead.firstName} ${lead.lastName}")
                }
            }
        }

        // Check if the call has moved to an active state, e.g., looking for a timer like "00:01"
        // Also checks content descriptions for "End call" buttons to imply active connection
        val contentDesc = node.contentDescription?.toString()?.lowercase() ?: ""
        val isTimer = Regex("^[0-9]{1,2}:[0-9]{2}$").matches(text)
        
        if ((isTimer || contentDesc.contains("end") || contentDesc.contains("hang up")) && currentLeadId != null && !isCallActive) {
            // IRON VEIL (v1.9): If we have a recent INBOUND system signal (last 60s),
            // strictly prohibit Accessibility from inventing an "Outbound" session.
            val timeSinceInbound = System.currentTimeMillis() - lastInboundSignalTime
            if (timeSinceInbound < 60_000) {
                Log.d("CallExtService", "Iron Veil: Suppressing Outbound UI trigger because an Inbound call was active recently ($timeSinceInbound ms).")
                return
            }

            if (!isOutgoing && isCallActive) {
                Log.d("CallExtService", "Ignoring Outbound UI trigger because an INBOUND call is already active.")
                return
            }

            isCallActive = true
            callStartTime = System.currentTimeMillis()
            Log.d("CallExtService", "Call is now ACTIVE. Starting recording.")
            currentCallFile = recorderService.startRecording(currentLeadId!!, currentPhoneNum!!)
        }

        // Check if the call has ended. If the UI says "Call ended" or if the dialer closes.
        if ((text.lowercase() == "call ended" || contentDesc.contains("call ended")) && isCallActive) {
            Log.d("CallExtService", "Call ENDED UI trigger. Finalizing.")
            stopRecordingSync()
        }

        // Recurse heavily nested views
        for (i in 0 until node.childCount) {
            scanForPhoneNumberAndState(node.getChild(i))
        }
    }

    // CLEANUP: Removed direct upload functions. Data is now handled via Consolidated Buffer.

    private fun showNotification(title: String, message: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("crm_channel", "CRM Notifications", NotificationManager.IMPORTANCE_DEFAULT)
            manager.createNotificationChannel(channel)
        }
        val notification = NotificationCompat.Builder(this, "crm_channel")
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    override fun onInterrupt() {
        Log.d("CallExtService", "Accessibility Interrupted")
    }

    private fun getAuthData(): Pair<String, String>? {
        val prefs = getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null) ?: return null
        val apiBase = prefs.getString("api_url", "https://www.pypecrm.com")?.trimEnd('/') ?: return null
        return Pair(token, apiBase)
    }
}

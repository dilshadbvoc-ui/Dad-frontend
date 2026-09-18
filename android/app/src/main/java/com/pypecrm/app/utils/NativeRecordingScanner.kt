package com.pypecrm.app.utils

import android.content.ContentUris
import android.content.Context
import android.provider.MediaStore
import android.util.Log
import java.io.File

object NativeRecordingScanner {

    fun scanForCallFile(context: Context, phoneNumber: String, callTime: Long): File? {
        val cleanNumber = phoneNumber.replace(Regex("[^0-9]"), "")
        if (cleanNumber.length < 10) return null
        val suffix = cleanNumber.takeLast(10)

        val resolver = context.contentResolver
        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.DISPLAY_NAME,
            MediaStore.Audio.Media.DATE_MODIFIED,
            MediaStore.Audio.Media.SIZE
        )

        // Find files containing the phone number suffix
        val selection = "${MediaStore.Audio.Media.DISPLAY_NAME} LIKE ?"
        val selectionArgs = arrayOf("%$suffix%")
        val sortOrder = "${MediaStore.Audio.Media.DATE_MODIFIED} DESC"

        try {
            val cursor = resolver.query(uri, projection, selection, selectionArgs, sortOrder)
            cursor?.use {
                val idCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val nameCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
                val dateCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_MODIFIED)

                val windowMs = 5 * 60 * 1000 // 5 minute window

                while (it.moveToNext()) {
                    val id = it.getLong(idCol)
                    val name = it.getString(nameCol)
                    val dateSecs = it.getLong(dateCol)
                    val lastModified = dateSecs * 1000

                    val diff = Math.abs(lastModified - callTime)
                    if (diff < windowMs) {
                        Log.d("NativeScanner", "Found MediaStore match: $name, modified date = $lastModified")
                        val contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id)

                        val cacheFile = File(context.cacheDir, "CRM_Native_Call_$id.mp3")
                        resolver.openInputStream(contentUri)?.use { input ->
                            cacheFile.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                        if (cacheFile.exists() && cacheFile.length() > 0) {
                            Log.d("NativeScanner", "Copied matched recording from MediaStore: ${cacheFile.absolutePath}")
                            return cacheFile
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("NativeScanner", "Failed to query MediaStore for call recordings", e)
        }

        Log.d("NativeScanner", "No filename match for suffix $suffix — falling back to timestamp-only match")
        return scanByTimestampOnly(context, callTime)
    }

    // Fallback for recorders that don't embed the phone number in the filename at all —
    // e.g. stock Android's own Phone app recorder names files by the SAVED CONTACT NAME
    // (if the number is in the phone's contacts) or a plain timestamp otherwise, so the
    // number-suffix match above can find nothing even though the recording exists. A call
    // recording created within a couple minutes of the call ending is overwhelmingly likely
    // to BE that call's recording, so pick the single closest audio file by modified time.
    private fun scanByTimestampOnly(context: Context, callTime: Long): File? {
        val resolver = context.contentResolver
        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.DISPLAY_NAME,
            MediaStore.Audio.Media.DATE_MODIFIED
        )
        val windowMs = 2 * 60 * 1000 // tighter window than the filename match, since there's no other signal

        try {
            val cursor = resolver.query(uri, projection, null, null, "${MediaStore.Audio.Media.DATE_MODIFIED} DESC")
            cursor?.use {
                val idCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val nameCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
                val dateCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_MODIFIED)

                var bestId: Long? = null
                var bestName: String? = null
                var bestDiff = Long.MAX_VALUE

                while (it.moveToNext()) {
                    val lastModified = it.getLong(dateCol) * 1000
                    val diff = Math.abs(lastModified - callTime)
                    if (diff < windowMs && diff < bestDiff) {
                        bestDiff = diff
                        bestId = it.getLong(idCol)
                        bestName = it.getString(nameCol)
                    }
                }

                if (bestId != null) {
                    Log.d("NativeScanner", "Found closest-timestamp match: $bestName (${bestDiff}ms from call time)")
                    val contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, bestId!!)
                    val cacheFile = File(context.cacheDir, "CRM_Native_Call_$bestId.mp3")
                    resolver.openInputStream(contentUri)?.use { input ->
                        cacheFile.outputStream().use { output -> input.copyTo(output) }
                    }
                    if (cacheFile.exists() && cacheFile.length() > 0) {
                        return cacheFile
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("NativeScanner", "Failed timestamp-only MediaStore fallback scan", e)
        }

        Log.d("NativeScanner", "No native call recording found by any method near timestamp $callTime")
        return null
    }
}

package com.pypecrm.app.utils

import android.content.Context
import android.os.Environment
import android.util.Log
import java.io.File

object NativeRecordingScanner {
    private val NATIVE_PATHS = arrayOf(
        "/Recordings/Call",                       // Samsung
        "/Recordings",                            // Generic Recordings
        "/MIUI/sound_recorder/call_rec",          // Xiaomi / MIUI
        "/Record/Call",                           // OnePlus / Oppo / ColorOS
        "/Music/Recordings/Call Recordings",       // Realme / Oppo
        "/Internal shared storage/Recordings/Call"// Emulated path variations
    )

    fun scanForCallFile(context: Context, phoneNumber: String, callTime: Long): File? {
        val cleanNumber = phoneNumber.replace(Regex("[^0-9]"), "")
        if (cleanNumber.length < 10) return null
        val suffix = cleanNumber.takeLast(10)

        // Try public external storage roots
        val storageRoot = Environment.getExternalStorageDirectory()
        for (relativePath in NATIVE_PATHS) {
            val dir = File(storageRoot, relativePath)
            if (dir.exists() && dir.isDirectory) {
                val matchedFile = findMatchInDir(dir, suffix, callTime)
                if (matchedFile != null) {
                    Log.d("NativeScanner", "Found native recording match: ${matchedFile.absolutePath}")
                    return matchedFile
                }
            }
        }

        // Try standard emulated storage roots directly (fallback)
        val fallbackDirs = arrayOf(
            File("/sdcard"),
            File("/storage/emulated/0")
        )
        for (root in fallbackDirs) {
            for (relativePath in NATIVE_PATHS) {
                val dir = File(root, relativePath)
                if (dir.exists() && dir.isDirectory) {
                    val matchedFile = findMatchInDir(dir, suffix, callTime)
                    if (matchedFile != null) {
                        return matchedFile
                    }
                }
            }
        }
        
        Log.d("NativeScanner", "No native call recording found for suffix $suffix near timestamp $callTime")
        return null
    }

    private fun findMatchInDir(dir: File, suffix: String, callTime: Long): File? {
        val files = dir.listFiles() ?: return null
        // 5 minute matching window
        val windowMs = 5 * 60 * 1000

        for (file in files) {
            if (file.isFile) {
                val name = file.name
                if (name.contains(suffix)) {
                    val lastModified = file.lastModified()
                    val diff = Math.abs(lastModified - callTime)
                    if (diff < windowMs) {
                        return file
                    }
                }
            }
        }
        return null
    }
}

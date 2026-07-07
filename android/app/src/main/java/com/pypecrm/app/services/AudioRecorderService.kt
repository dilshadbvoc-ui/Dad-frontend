package com.pypecrm.app.services

import android.content.Context
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class AudioRecorderService(private val context: Context) {
    private var recorder: MediaRecorder? = null
    private var isRecording = false
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var currentRecordingFile: File? = null

    private fun isDefaultAssistant(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val roleManager = context.getSystemService(Context.ROLE_SERVICE) as android.app.role.RoleManager
                return roleManager.isRoleHeld(android.app.role.RoleManager.ROLE_ASSISTANT)
            } catch (e: Exception) {
                Log.e("AudioRecorder", "RoleManager error", e)
            }
        }
        try {
            val assistant = android.provider.Settings.Secure.getString(context.contentResolver, "assistant")
            val voiceInteraction = android.provider.Settings.Secure.getString(context.contentResolver, "voice_interaction_service")
            return (assistant != null && assistant.contains(context.packageName)) ||
                   (voiceInteraction != null && voiceInteraction.contains(context.packageName))
        } catch (e: Exception) {
            return false
        }
    }

    fun startRecording(leadId: String, currentPhoneNum: String): File? {
        if (isRecording) {
            Log.w("AudioRecorder", "Already recording.")
            return null
        }

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val fileName = "CRM_Call_${leadId}_${currentPhoneNum}_${timestamp}.mp4"
        currentRecordingFile = File(context.cacheDir, fileName)

        // Reset audio state to normal
        audioManager.mode = AudioManager.MODE_NORMAL

        // Ordered audio sources to attempt capturing
        val sources = intArrayOf(
            MediaRecorder.AudioSource.VOICE_CALL,
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            MediaRecorder.AudioSource.MIC
        )

        for (source in sources) {
            try {
                val mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    MediaRecorder(context)
                } else {
                    @Suppress("DEPRECATION")
                    MediaRecorder()
                }

                recorder = mediaRecorder.apply {
                    setAudioSource(source)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioSamplingRate(44100)
                    setAudioEncodingBitRate(96000)
                    setOutputFile(currentRecordingFile!!.absolutePath)
                    
                    prepare()
                    start()
                }
                
                isRecording = true
                Log.d("AudioRecorder", "Successfully started recording with AudioSource ID: $source")
                return currentRecordingFile
            } catch (e: Exception) {
                Log.e("AudioRecorder", "Failed to start recording with AudioSource ID $source: ${e.message}")
                try {
                    recorder?.reset()
                    recorder?.release()
                } catch (ex: Exception) {}
                recorder = null
            }
        }

        Log.e("AudioRecorder", "All recording attempts failed.")
        return null
    }

    fun stopRecording() {
        if (!isRecording) return

        try {
            recorder?.apply {
                stop()
                release()
            }
        } catch (e: Exception) {
            Log.e("AudioRecorder", "Failed to stop recording cleanly", e)
        } finally {
            recorder = null
            isRecording = false
            Log.d("AudioRecorder", "Stopped recording call.")
        }
    }
}

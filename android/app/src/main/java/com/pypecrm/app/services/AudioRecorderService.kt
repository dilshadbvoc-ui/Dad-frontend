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

        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val fileName = "CRM_Call_${leadId}_${currentPhoneNum}_${timestamp}.mp4"
            currentRecordingFile = File(context.cacheDir, fileName)

            // Revert to standard hardware-friendly mode
            audioManager.mode = AudioManager.MODE_NORMAL
            
            // Check if app has voice assistant privileges to record call streams.
            // If not, we must force speakerphone ON so the physical MIC can record earpiece audio.
            val useVoiceRec = isDefaultAssistant()
            if (!useVoiceRec) {
                try {
                    audioManager.isSpeakerphoneOn = true
                } catch (ex: Exception) {
                    Log.e("AudioRecorder", "Failed to set speakerphone on for MIC path", ex)
                }
            }

            val mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            try {
                recorder = mediaRecorder.apply {
                    if (useVoiceRec) {
                        // Use VOICE_RECOGNITION - captures both sides without speakerphone when authorized as Assistant
                        setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                    } else {
                        // Fallback to MIC with speakerphone enabled
                        setAudioSource(MediaRecorder.AudioSource.MIC)
                    }
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioSamplingRate(44100)
                    setAudioEncodingBitRate(96000)
                    setOutputFile(currentRecordingFile!!.absolutePath)
                    
                    prepare()
                    start()
                }
                
                isRecording = true
                Log.d("AudioRecorder", "Started recording using ${if (useVoiceRec) "VOICE_RECOGNITION" else "MIC"}: ${currentRecordingFile!!.absolutePath}")
                return currentRecordingFile
            } catch (e: Exception) {
                Log.e("AudioRecorder", "Failed primary recording setup, falling back to MIC with speakerphone", e)
                try {
                    try {
                        audioManager.isSpeakerphoneOn = true
                    } catch (ex: Exception) {
                        Log.e("AudioRecorder", "Failed to set speakerphone on for fallback", ex)
                    }

                    mediaRecorder.reset()
                    mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
                    mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    mediaRecorder.setOutputFile(currentRecordingFile!!.absolutePath)
                    mediaRecorder.prepare()
                    mediaRecorder.start()
                    isRecording = true
                    Log.d("AudioRecorder", "Started fallback MIC recording: ${currentRecordingFile!!.absolutePath}")
                    return currentRecordingFile
                } catch (e2: Exception) {
                    Log.e("AudioRecorder", "All recording attempts failed", e2)
                    return null
                }
            }
        } catch (e: Exception) {
            Log.e("AudioRecorder", "General failure", e)
            return null
        }
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

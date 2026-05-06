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

    fun startRecording(leadId: String, currentPhoneNum: String): File? {
        if (isRecording) {
            Log.w("AudioRecorder", "Already recording.")
            return null
        }

        try {
            // Android 15 Restriction Bypass: Force speakerphone to grab both sides of the call 
            // since VOICE_CALL source is restricted without system permissions.
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager.isSpeakerphoneOn = true

            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val fileName = "CRM_Call_${leadId}_${currentPhoneNum}_${timestamp}.mp4"
            
            // Store temporarily in app cache
            currentRecordingFile = File(context.cacheDir, fileName)
            
            val mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            try {
                recorder = mediaRecorder.apply {
                    setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioSamplingRate(44100)
                    setAudioEncodingBitRate(96000)
                    setOutputFile(currentRecordingFile!!.absolutePath)
                    
                    prepare()
                    start()
                }
                isRecording = true
                Log.d("AudioRecorder", "Started recording call to ${currentRecordingFile!!.absolutePath}")
                return currentRecordingFile
            } catch (e: Exception) {
                Log.e("AudioRecorder", "MediaRecorder start failed (mic might be in use)", e)
                mediaRecorder.release()
                recorder = null
                isRecording = false
                audioManager.isSpeakerphoneOn = false
                audioManager.mode = AudioManager.MODE_NORMAL
                return null
            }

        } catch (e: Exception) {
            Log.e("AudioRecorder", "General failure in startRecording", e)
            audioManager.isSpeakerphoneOn = false
            audioManager.mode = AudioManager.MODE_NORMAL
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
            
            // Turn off speakerphone
            audioManager.isSpeakerphoneOn = false
            audioManager.mode = AudioManager.MODE_NORMAL
            
            Log.d("AudioRecorder", "Stopped recording call.")
        }
    }
}

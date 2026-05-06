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
    private var speakerphoneTimer: Timer? = null

    fun startRecording(leadId: String, currentPhoneNum: String): File? {
        if (isRecording) {
            Log.w("AudioRecorder", "Already recording.")
            return null
        }

        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val fileName = "CRM_Call_${leadId}_${currentPhoneNum}_${timestamp}.amr"
            currentRecordingFile = File(context.cacheDir, fileName)

            val sources = listOf(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                MediaRecorder.AudioSource.MIC,
                MediaRecorder.AudioSource.VOICE_RECOGNITION
            )

            var lastError: Exception? = null

            for (source in sources) {
                try {
                    // Aggressive Audio Setup
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                    audioManager.isSpeakerphoneOn = true
                    // Boost volume to help MIC pick up the speaker
                    audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, 
                        audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL), 0)
                    
                    val mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        MediaRecorder(context)
                    } else {
                        @Suppress("DEPRECATION")
                        MediaRecorder()
                    }

                    recorder = mediaRecorder.apply {
                        setAudioSource(source)
                        setOutputFormat(MediaRecorder.OutputFormat.AMR_NB)
                        setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
                        setOutputFile(currentRecordingFile!!.absolutePath)
                        prepare()
                        start()
                    }
                    
                    isRecording = true
                    
                    // START THE "IRON GRIP" MONITOR
                    // Re-force speakerphone every 2 seconds because the dialer app might try to turn it off
                    speakerphoneTimer = Timer()
                    speakerphoneTimer?.scheduleAtFixedRate(object : TimerTask() {
                        override fun run() {
                            if (isRecording) {
                                audioManager.isSpeakerphoneOn = true
                            }
                        }
                    }, 1000, 2000)

                    Log.d("AudioRecorder", "Success with source $source and Iron Grip active")
                    return currentRecordingFile
                } catch (e: Exception) {
                    Log.w("AudioRecorder", "Source $source failed", e)
                    lastError = e
                    recorder?.release()
                    recorder = null
                }
            }
            return null
        } catch (e: Exception) {
            return null
        }
    }

    fun stopRecording() {
        if (!isRecording) return

        try {
            speakerphoneTimer?.cancel()
            speakerphoneTimer = null
            
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

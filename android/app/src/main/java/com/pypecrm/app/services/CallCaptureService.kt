package com.pypecrm.app.services

import android.annotation.TargetApi
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.*
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread

@TargetApi(Build.VERSION_CODES.Q)
class CallCaptureService : Service() {

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_RESULT_DATA = "EXTRA_RESULT_DATA"
        const val EXTRA_LEAD_ID = "EXTRA_LEAD_ID"
        const val EXTRA_PHONE_NUM = "EXTRA_PHONE_NUM"

        private const val NOTIFICATION_ID = 8878
        private const val CHANNEL_ID = "crm_call_capture_channel"

        var isServiceRunning = false
            private set
            
        var currentFile: File? = null
            private set
    }

    private var mediaProjection: MediaProjection? = null
    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private var recordThread: Thread? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_NOT_STICKY

        when (intent.action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                val leadId = intent.getStringExtra(EXTRA_LEAD_ID) ?: "unknown"
                val phone = intent.getStringExtra(EXTRA_PHONE_NUM) ?: "unknown"

                if (resultCode == Activity.RESULT_OK && resultData != null) {
                    startForeground(NOTIFICATION_ID, createNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
                    isServiceRunning = true
                    startCapturing(resultCode, resultData, leadId, phone)
                } else {
                    Log.e("CallCaptureService", "Failed to start: Invalid result code or data")
                    stopSelf()
                }
            }
            ACTION_STOP -> {
                stopCapturing()
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun startCapturing(resultCode: Int, resultData: Intent, leadId: String, phone: String) {
        if (isRecording) return

        try {
            val mpManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = mpManager.getMediaProjection(resultCode, resultData)

            if (mediaProjection == null) {
                Log.e("CallCaptureService", "MediaProjection is null")
                stopSelf()
                return
            }

            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val fileName = "CRM_Call_${leadId}_${phone}_${timestamp}.wav"
            val file = File(cacheDir, fileName)
            currentFile = file

            val config = AudioPlaybackCaptureConfiguration.Builder(mediaProjection!!)
                .addMatchingUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                .build()

            val sampleRate = 16000
            val channelConfig = AudioFormat.CHANNEL_IN_MONO
            val audioEncoding = AudioFormat.ENCODING_PCM_16BIT
            val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioEncoding)

            audioRecord = AudioRecord.Builder()
                .setAudioFormat(AudioFormat.Builder()
                    .setEncoding(audioEncoding)
                    .setSampleRate(sampleRate)
                    .setChannelMask(channelConfig)
                    .build())
                .setAudioPlaybackCaptureConfig(config)
                .setBufferSizeInBytes(minBufferSize * 2)
                .build()

            audioRecord?.startRecording()
            isRecording = true

            recordThread = thread(start = true) {
                writeAudioDataToFile(file, minBufferSize)
            }
            
            Log.d("CallCaptureService", "Started call audio capture: ${file.absolutePath}")

        } catch (e: Exception) {
            Log.e("CallCaptureService", "Error starting capture session", e)
            stopSelf()
        }
    }

    private fun writeAudioDataToFile(file: File, bufferSize: Int) {
        val data = ByteArray(bufferSize)
        val out = FileOutputStream(file)
        
        // Write standard 44-byte WAV header placeholder
        out.write(ByteArray(44))

        try {
            while (isRecording) {
                val read = audioRecord?.read(data, 0, bufferSize) ?: 0
                if (read > 0) {
                    out.write(data, 0, read)
                }
            }
        } catch (e: Exception) {
            Log.e("CallCaptureService", "Error writing audio to file", e)
        } finally {
            out.close()
            // Fix WAV header with final size
            if (file.exists() && file.length() > 44) {
                writeWavHeader(file)
            }
        }
    }

    private fun writeWavHeader(file: File) {
        val randomAccessFile = RandomAccessFile(file, "rw")
        val totalAudioLen = file.length() - 44
        val totalDataLen = totalAudioLen + 36
        val longSampleRate = 16000L
        val channels = 1
        val byteRate = longSampleRate * channels * 2 // 16-bit = 2 bytes

        val header = ByteArray(44)
        header[0] = 'R'.code.toByte() // RIFF
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        header[4] = (totalDataLen and 0xff).toByte()
        header[5] = ((totalDataLen shr 8) and 0xff).toByte()
        header[6] = ((totalDataLen shr 16) and 0xff).toByte()
        header[7] = ((totalDataLen shr 24) and 0xff).toByte()
        header[8] = 'W'.code.toByte() // WAVE
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        header[12] = 'f'.code.toByte() // fmt
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16 // Size of fmt chunk
        header[17] = 0
        header[18] = 0
        header[19] = 0
        header[20] = 1 // Format: 1 = PCM
        header[21] = 0
        header[22] = channels.toByte() // Channels
        header[23] = 0
        header[24] = (longSampleRate and 0xff).toByte() // Sample rate
        header[25] = ((longSampleRate shr 8) and 0xff).toByte()
        header[26] = ((longSampleRate shr 16) and 0xff).toByte()
        header[27] = ((longSampleRate shr 24) and 0xff).toByte()
        header[28] = (byteRate and 0xff).toByte() // Byte rate
        header[29] = ((byteRate shr 8) and 0xff).toByte()
        header[30] = ((byteRate shr 16) and 0xff).toByte()
        header[31] = ((byteRate shr 24) and 0xff).toByte()
        header[32] = (channels * 2).toByte() // Block align
        header[33] = 0
        header[34] = 16 // Bits per sample
        header[35] = 0
        header[36] = 'd'.code.toByte() // data
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        header[40] = (totalAudioLen and 0xff).toByte()
        header[41] = ((totalAudioLen shr 8) and 0xff).toByte()
        header[42] = ((totalAudioLen shr 16) and 0xff).toByte()
        header[43] = ((totalAudioLen shr 24) and 0xff).toByte()

        randomAccessFile.seek(0)
        randomAccessFile.write(header)
        randomAccessFile.close()
        Log.d("CallCaptureService", "Successfully updated WAV header size tags")
    }

    private fun stopCapturing() {
        if (!isRecording) return
        isRecording = false

        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            Log.e("CallCaptureService", "Error stopping AudioRecord", e)
        } finally {
            audioRecord = null
        }

        try {
            mediaProjection?.stop()
        } catch (e: Exception) {
            Log.e("CallCaptureService", "Error stopping MediaProjection", e)
        } finally {
            mediaProjection = null
        }

        isServiceRunning = false
        Log.d("CallCaptureService", "Stopped capturing and released projection tokens")
    }

    override fun onDestroy() {
        stopCapturing()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Call Audio Capture",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Call Recording Active")
            .setContentText("Capturing call audio stream...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}

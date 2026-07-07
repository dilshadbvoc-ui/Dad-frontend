package com.pypecrm.app.services

import android.speech.RecognitionService
import android.speech.SpeechRecognizer

class CrmRecognitionService : RecognitionService() {
    override fun onStartListening(recognizerIntent: android.content.Intent?, listener: Callback?) {
        // Dummy implementation to satisfy speech recognition service requirements
    }

    override fun onCancel(listener: Callback?) {
        // Dummy
    }

    override fun onStopListening(listener: Callback?) {
        // Dummy
    }
}

package com.pypecrm.app.services

import android.content.Context
import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.service.voice.VoiceInteractionSessionService
import android.util.Log

class CrmVoiceInteractionSessionService : VoiceInteractionSessionService() {
    override fun onNewSession(args: Bundle?): VoiceInteractionSession {
        return CrmAssistantSession(this)
    }

    class CrmAssistantSession(context: Context) : VoiceInteractionSession(context) {
        override fun onCreate() {
            super.onCreate()
            Log.d("CrmAssistantSession", "Voice interaction assistant session created")
        }

        override fun onHandleAssist(state: AssistState) {
            super.onHandleAssist(state)
            // Empty hook, session manages audio capture stream access
        }
    }
}

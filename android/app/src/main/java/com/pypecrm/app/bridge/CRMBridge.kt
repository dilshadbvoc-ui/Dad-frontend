package com.pypecrm.app.bridge

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.os.Build
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.app.ActivityCompat
import com.pypecrm.app.MainActivity
import androidx.core.app.NotificationCompat
import com.pypecrm.app.data.AppDatabase
import com.pypecrm.app.data.LeadEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class CRMBridge(val context: Context) {

    @JavascriptInterface
    fun syncLeads(token: String) {
        Log.d("CRMBridge", "Received sync trigger from React app")
        
        val prefs = context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("jwt_token", token).apply()

        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .build()
        
        val apiBase = prefs.getString("api_url", "https://www.pypecrm.com")?.trimEnd('/')
        Log.d("CRMBridge", "Syncing leads from $apiBase")
        
        val request = Request.Builder()
            .url("$apiBase/api/android/leads") 
            .addHeader("Authorization", "Bearer $token")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("CRMBridge", "Failed to sync leads", e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    Log.e("CRMBridge", "Leads sync failed with code: ${response.code}")
                    return
                }
                
                response.body?.let { body ->
                    try {
                        val jsonResponse = JSONObject(body.string())
                        val leadsArray = jsonResponse.optJSONArray("leads") ?: return
                        
                        val db = AppDatabase.getDatabase(context)
                        val leadEntities = mutableListOf<LeadEntity>()

                        for (i in 0 until leadsArray.length()) {
                            val obj = leadsArray.getJSONObject(i)
                            leadEntities.add(
                                LeadEntity(
                                    id = obj.getString("id"),
                                    firstName = obj.optString("firstName", ""),
                                    lastName = obj.optString("lastName", ""),
                                    phone = obj.getString("phone")
                                )
                            )
                        }

                        // Save to SQLite
                        CoroutineScope(Dispatchers.IO).launch {
                            db.leadDao().deleteAll()
                            db.leadDao().insertAll(*leadEntities.toTypedArray())
                            Log.d("CRMBridge", "Successfully synced ${leadEntities.size} leads to SQLite")
                        }
                    } catch (e: Exception) {
                        Log.e("CRMBridge", "Error parsing leads JSON", e)
                    }
                }
            }
        })
    }

    @JavascriptInterface
    fun getRecordingStatus(): String {
        return "{\"isRecording\": false, \"duration\": 0}" // Placeholder for UI sync
    }

    @JavascriptInterface
    fun saveToken(token: String) {
        Log.d("CRMBridge", "Saving token to SharedPreferences")
        val prefs = context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("jwt_token", token).apply()
    }

    @JavascriptInterface
    fun saveApiUrl(url: String) {
        Log.d("CRMBridge", "Saving API URL to SharedPreferences: $url")
        val prefs = context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("api_url", url).apply()
    }

    @JavascriptInterface
    fun getToken(): String? {
        val prefs = context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        return prefs.getString("jwt_token", null)
    }

    @JavascriptInterface
    fun clearToken() {
        Log.d("CRMBridge", "Clearing token from SharedPreferences")
        val prefs = context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        prefs.edit().remove("jwt_token").apply()
    }

    @JavascriptInterface
    fun requestLocationPermission() {
        Log.d("CRMBridge", "JavaScript requested location permission")
        (context as? MainActivity)?.runOnUiThread {
            (context as? MainActivity)?.requestLocationPermission()
        }
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel("crm_alerts_high", "CRM High Priority Alerts", android.app.NotificationManager.IMPORTANCE_HIGH)
            manager.createNotificationChannel(channel)
        }
        val notification = NotificationCompat.Builder(context, "crm_alerts_high")
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .build()
        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    @JavascriptInterface
    fun initiateCall(phone: String, sessionId: String) {
        Log.d("CRMBridge", "Initiating call to $phone with session: $sessionId")
        
        // Store the session ID for the CallTrackerService to pick up
        val prefs = context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("pending_session_id", sessionId).apply()

        // Clean and format the phone number to prevent any URI parsing errors
        var cleanPhone = phone.replace(Regex("[^0-9+]"), "")
        if (cleanPhone.startsWith("91") && cleanPhone.length == 12) {
            cleanPhone = "+$cleanPhone"
        } else if (cleanPhone.startsWith("1") && cleanPhone.length == 11) {
            cleanPhone = "+$cleanPhone"
        }

        // Dial the number
        try {
            val intent = Intent(Intent.ACTION_CALL)
            intent.data = Uri.parse("tel:$cleanPhone")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.CALL_PHONE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                context.startActivity(intent)
            } else {
                Log.w("CRMBridge", "CALL_PHONE permission not granted, requesting dynamically and falling back to DIAL")
                if (context is MainActivity) {
                    context.runOnUiThread {
                        ActivityCompat.requestPermissions(context, arrayOf(android.Manifest.permission.CALL_PHONE), 200)
                    }
                }
                val dialIntent = Intent(Intent.ACTION_DIAL)
                dialIntent.data = Uri.parse("tel:$cleanPhone")
                dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(dialIntent)
            }
        } catch (e: Exception) {
            Log.e("CRMBridge", "Failed to initiate call to $cleanPhone", e)
            Toast.makeText(context, "Failed to initiate call", Toast.LENGTH_SHORT).show()
        }
    }

}

package com.vigilantpath.locationbasedalarm.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.vigilantpath.locationbasedalarm.data.AppDatabase
import kotlinx.coroutines.*

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device booted, checking for active alarms")

            // Check if there are active alarms and restart monitoring
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val db = AppDatabase.getDatabase(context)
                    val activeAlarms = db.alarmDao().getActiveAlarms()
                    if (activeAlarms.isNotEmpty()) {
                        Log.d("BootReceiver", "Found ${activeAlarms.size} active alarms, restarting monitoring")
                        GeofenceService.start(context)
                    }
                } catch (e: Exception) {
                    Log.e("BootReceiver", "Error checking alarms on boot: ${e.message}")
                }
            }
        }
    }
}

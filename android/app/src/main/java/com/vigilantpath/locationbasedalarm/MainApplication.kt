package com.vigilantpath.locationbasedalarm

import android.app.Application
import com.vigilantpath.locationbasedalarm.data.AppDatabase
import com.vigilantpath.locationbasedalarm.service.GeofenceService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class MainApplication : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()

        // Auto-start background monitoring if there are active alarms
        applicationScope.launch {
            try {
                val db = AppDatabase.getDatabase(this@MainApplication)
                val activeAlarms = db.alarmDao().getActiveAlarms()
                if (activeAlarms.isNotEmpty()) {
                    GeofenceService.start(this@MainApplication)
                }
            } catch (_: Exception) {}
        }
    }
}

package com.vigilantpath.locationbasedalarm

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*

class AlarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AlarmModule"

    @ReactMethod
    fun startAlarm(soundEnabled: Boolean, vibrateEnabled: Boolean, alarmLabel: String) {
        val intent = Intent(reactApplicationContext, AlarmService::class.java).apply {
            putExtra("soundEnabled", soundEnabled)
            putExtra("vibrateEnabled", vibrateEnabled)
            putExtra("alarmLabel", alarmLabel)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopAlarm() {
        val intent = Intent(reactApplicationContext, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP
        }
        reactApplicationContext.startService(intent)
    }

    @ReactMethod
    fun snoozeAlarm() {
        val intent = Intent(reactApplicationContext, AlarmService::class.java).apply {
            action = AlarmService.ACTION_SNOOZE
        }
        reactApplicationContext.startService(intent)
    }
}

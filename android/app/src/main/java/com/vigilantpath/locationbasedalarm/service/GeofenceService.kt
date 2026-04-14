package com.vigilantpath.locationbasedalarm.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.vigilantpath.locationbasedalarm.R
import com.vigilantpath.locationbasedalarm.data.Alarm
import com.vigilantpath.locationbasedalarm.data.AppDatabase
import com.vigilantpath.locationbasedalarm.data.PreferencesManager
import kotlinx.coroutines.*
import kotlin.math.*

class GeofenceService : Service() {

    companion object {
        const val CHANNEL_ID = "vigilant_monitoring_channel"
        const val NOTIFICATION_ID = 1001
        private const val TAG = "GeofenceService"

        const val ACTION_START = "com.vigilantpath.ACTION_START_MONITORING"
        const val ACTION_STOP = "com.vigilantpath.ACTION_STOP_MONITORING"

        fun start(context: Context) {
            val intent = Intent(context, GeofenceService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, GeofenceService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun getDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
            val R = 6371000.0
            val dLat = Math.toRadians(lat2 - lat1)
            val dLon = Math.toRadians(lon2 - lon1)
            val a = sin(dLat / 2).pow(2) +
                    cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                    sin(dLon / 2).pow(2)
            return R * 2 * atan2(sqrt(a), sqrt(1 - a))
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var db: AppDatabase
    private lateinit var prefs: PreferencesManager
    private var currentZone: String = "medium"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        db = AppDatabase.getDatabase(this)
        prefs = PreferencesManager(this)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    serviceScope.launch {
                        checkGeofences(location.latitude, location.longitude)
                    }
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopLocationUpdates()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                startForeground(NOTIFICATION_ID, buildMonitoringNotification(0))
                startLocationUpdates()
                return START_STICKY
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startLocationUpdates() {
        try {
            val request = LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 30000L)
                .setMinUpdateDistanceMeters(200f)
                .setWaitForAccurateLocation(false)
                .build()

            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
            Log.d(TAG, "Location updates started (balanced mode)")
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted: ${e.message}")
            stopSelf()
        }
    }

    private fun restartWithZone(zone: String, alarmCount: Int) {
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        } catch (_: Exception) {}

        val (priority, interval, distance) = when (zone) {
            "far" -> Triple(Priority.PRIORITY_LOW_POWER, 60000L, 500f)
            "medium" -> Triple(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 30000L, 200f)
            "near" -> Triple(Priority.PRIORITY_HIGH_ACCURACY, 10000L, 50f)
            "very_near" -> Triple(Priority.PRIORITY_HIGH_ACCURACY, 5000L, 20f)
            else -> Triple(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 30000L, 200f)
        }

        try {
            val request = LocationRequest.Builder(priority, interval)
                .setMinUpdateDistanceMeters(distance)
                .setWaitForAccurateLocation(false)
                .build()

            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
            currentZone = zone

            // Update notification
            val nm = getSystemService(NotificationManager::class.java)
            nm.notify(NOTIFICATION_ID, buildMonitoringNotification(alarmCount))

            Log.d(TAG, "Monitoring restarted in $zone zone (interval: ${interval/1000}s, distance: ${distance}m)")
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission error: ${e.message}")
        }
    }

    private fun stopLocationUpdates() {
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            Log.d(TAG, "Location updates stopped")
        } catch (_: Exception) {}
    }

    private var zoneCheckCounter = 0

    private suspend fun checkGeofences(lat: Double, lon: Double) {
        try {
            val activeAlarms = db.alarmDao().getActiveAlarms()
            if (activeAlarms.isEmpty()) {
                withContext(Dispatchers.Main) {
                    stopLocationUpdates()
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
                return
            }

            val triggered = prefs.getTriggeredAlarmIds().toMutableSet()
            val snoozed = prefs.getSnoozedAlarmIds().toMutableSet()
            var snoozedChanged = false
            var closestDistance = Double.MAX_VALUE

            for (alarm in activeAlarms) {
                val dist = getDistanceMeters(lat, lon, alarm.latitude, alarm.longitude)
                val radius = alarm.radius
                val isInsideGeofence = dist <= radius
                val isOutsideGeofence = dist > radius * 1.5

                if (dist < closestDistance) closestDistance = dist

                // Check if snoozed and user left geofence
                if (snoozed.contains(alarm.id) && isOutsideGeofence) {
                    snoozed.remove(alarm.id)
                    snoozedChanged = true
                    if (triggered.contains(alarm.id)) {
                        triggered.remove(alarm.id)
                        prefs.removeTriggeredAlarm(alarm.id)
                    }
                    Log.d(TAG, "Alarm \"${alarm.label}\" re-armed after user left geofence")
                }

                // Trigger alarm if inside geofence
                if (isInsideGeofence && !triggered.contains(alarm.id) && !snoozed.contains(alarm.id)) {
                    triggered.add(alarm.id)
                    prefs.addTriggeredAlarm(alarm.id)
                    prefs.setCurrentTrigger(alarm.id)

                    // Start the AlarmService for sound + vibration
                    startAlarmService(alarm)

                    // Send notification
                    sendAlarmNotification(alarm, dist)

                    Log.d(TAG, "Alarm triggered: ${alarm.label} (distance: ${dist.toInt()}m, radius: ${radius}m)")
                }
            }

            if (snoozedChanged) {
                // Re-save snoozed set
                // Already handled individually above
            }

            // Adaptive zone switching
            zoneCheckCounter++
            if (zoneCheckCounter >= 5) {
                zoneCheckCounter = 0
                val newZone = when {
                    closestDistance > 5000 -> "far"
                    closestDistance > 1000 -> "medium"
                    closestDistance > 300 -> "near"
                    else -> "very_near"
                }
                if (newZone != currentZone) {
                    Log.d(TAG, "Zone change: $currentZone → $newZone (closest: ${closestDistance.toInt()}m)")
                    restartWithZone(newZone, activeAlarms.size)
                }
            }

            // Update notification with alarm count
            val nm = getSystemService(NotificationManager::class.java)
            nm.notify(NOTIFICATION_ID, buildMonitoringNotification(activeAlarms.size))

        } catch (e: Exception) {
            Log.e(TAG, "Geofence check error: ${e.message}")
        }
    }

    private fun startAlarmService(alarm: Alarm) {
        val intent = Intent(this, AlarmService::class.java).apply {
            putExtra("soundEnabled", alarm.sound)
            putExtra("vibrateEnabled", alarm.vibrate)
            putExtra("alarmLabel", alarm.label)
            putExtra("alarmId", alarm.id)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun sendAlarmNotification(alarm: Alarm, distance: Double) {
        val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("navigate_to", "active_alarm")
            putExtra("alarm_id", alarm.id)
        }
        val pendingIntent = PendingIntent.getActivity(
            this, alarm.id.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, AlarmService.CHANNEL_ID)
            .setContentTitle("📍 Arrived at ${alarm.label}!")
            .setContentText("You are within ${alarm.radius}m of your destination")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setFullScreenIntent(pendingIntent, true)
            .build()

        val nm = getSystemService(NotificationManager::class.java)
        nm.notify(alarm.id.hashCode(), notification)
    }

    private fun createNotificationChannel() {
        val monitoringChannel = NotificationChannel(
            CHANNEL_ID,
            "Location Monitoring",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Ongoing notification for background location monitoring"
            setShowBadge(false)
        }

        val alarmChannel = NotificationChannel(
            AlarmService.CHANNEL_ID,
            "Location Alarm",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Alerts when you arrive at your destination"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 800, 400, 800)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setBypassDnd(true)
        }

        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(monitoringChannel)
        nm.createNotificationChannel(alarmChannel)
    }

    private fun buildMonitoringNotification(alarmCount: Int): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val zoneLabels = mapOf(
            "far" to "🟢 Power saving",
            "medium" to "🟡 Balanced",
            "near" to "🟠 High accuracy",
            "very_near" to "🔴 Maximum accuracy"
        )

        val body = if (alarmCount > 0) {
            "$alarmCount alarm${if (alarmCount > 1) "s" else ""} • ${zoneLabels[currentZone] ?: "Monitoring"}"
        } else {
            "Monitoring your locations"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("📍 Vigilant Path Active")
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    override fun onDestroy() {
        stopLocationUpdates()
        serviceScope.cancel()
        super.onDestroy()
    }
}

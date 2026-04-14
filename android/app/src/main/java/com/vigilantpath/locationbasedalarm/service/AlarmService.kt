package com.vigilantpath.locationbasedalarm.service

import android.app.*
import android.content.*
import android.media.*
import android.net.Uri
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import com.vigilantpath.locationbasedalarm.R

class AlarmService : Service() {
    companion object {
        const val CHANNEL_ID = "vigilant_alarm_channel"
        const val NOTIFICATION_ID = 9999
        const val ACTION_STOP = "com.vigilantpath.STOP_ALARM"
        const val ACTION_SNOOZE = "com.vigilantpath.SNOOZE_ALARM"
        private const val TAG = "AlarmService"
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var isPlaying = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopAlarm()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_SNOOZE -> {
                stopAlarm()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
        }

        val soundEnabled = intent?.getBooleanExtra("soundEnabled", true) ?: true
        val vibrateEnabled = intent?.getBooleanExtra("vibrateEnabled", true) ?: true
        val alarmLabel = intent?.getStringExtra("alarmLabel") ?: "Alarm"

        // Start as foreground service with notification
        val notification = buildAlarmNotification(alarmLabel)
        startForeground(NOTIFICATION_ID, notification)

        // Start alarm
        if (soundEnabled) startSound()
        if (vibrateEnabled) startVibration()
        isPlaying = true

        // Wake the screen
        wakeScreen()

        Log.d(TAG, "Alarm started: sound=$soundEnabled, vibrate=$vibrateEnabled")
        return START_STICKY
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Location Alarm",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Alerts when you arrive at your destination"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 800, 400, 800)
            setSound(
                Uri.parse("android.resource://${packageName}/raw/alarm_sound"),
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setBypassDnd(true)
        }
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(channel)
    }

    private fun buildAlarmNotification(label: String): Notification {
        // Intent to open the app
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPending = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Stop action
        val stopIntent = Intent(this, AlarmService::class.java).apply { action = ACTION_STOP }
        val stopPending = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Snooze action
        val snoozeIntent = Intent(this, AlarmService::class.java).apply { action = ACTION_SNOOZE }
        val snoozePending = PendingIntent.getService(
            this, 2, snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("📍 Arrived at $label!")
            .setContentText("Tap to open alarm • Swipe actions below")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(openPending, true)
            .setContentIntent(openPending)
            .addAction(android.R.drawable.ic_delete, "Dismiss", stopPending)
            .addAction(android.R.drawable.ic_popup_reminder, "Snooze", snoozePending)
            .build()
    }

    private fun startSound() {
        try {
            mediaPlayer = MediaPlayer.create(this, R.raw.alarm_sound)?.apply {
                isLooping = true
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                start()
            }
            Log.d(TAG, "Alarm sound started")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting sound: ${e.message}")
        }
    }

    private fun startVibration() {
        vibrator = (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator

        val pattern = longArrayOf(0, 800, 400, 800, 400, 800, 1000)
        vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        Log.d(TAG, "Vibration started")
    }

    private fun wakeScreen() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        @Suppress("DEPRECATION")
        val wakeLock = pm.newWakeLock(
            PowerManager.FULL_WAKE_LOCK or
                    PowerManager.ACQUIRE_CAUSES_WAKEUP or
                    PowerManager.ON_AFTER_RELEASE,
            "vigilantpath:alarm_wake"
        )
        wakeLock.acquire(30000) // 30 seconds
    }

    fun stopAlarm() {
        mediaPlayer?.apply {
            if (isPlaying) stop()
            release()
        }
        mediaPlayer = null
        vibrator?.cancel()
        vibrator = null
        isPlaying = false
        Log.d(TAG, "Alarm stopped")
    }

    override fun onDestroy() {
        stopAlarm()
        super.onDestroy()
    }
}

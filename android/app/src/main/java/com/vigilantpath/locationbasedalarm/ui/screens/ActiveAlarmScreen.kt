package com.vigilantpath.locationbasedalarm.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import com.vigilantpath.locationbasedalarm.data.Alarm
import com.vigilantpath.locationbasedalarm.data.AppDatabase
import com.vigilantpath.locationbasedalarm.data.PreferencesManager
import com.vigilantpath.locationbasedalarm.service.AlarmService
import com.vigilantpath.locationbasedalarm.service.GeofenceService
import com.vigilantpath.locationbasedalarm.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ActiveAlarmScreen(
    alarmId: String,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { AppDatabase.getDatabase(context) }
    val prefs = remember { PreferencesManager(context) }

    var alarm by remember { mutableStateOf<Alarm?>(null) }
    var distance by remember { mutableStateOf<Int?>(null) }
    var arrived by remember { mutableStateOf(false) }
    var triggeredTime by remember { mutableStateOf<String?>(null) }

    // Load alarm
    LaunchedEffect(alarmId) {
        alarm = db.alarmDao().getAlarmById(alarmId)
    }

    // Track location
    DisposableEffect(alarm) {
        val currentAlarm = alarm ?: return@DisposableEffect onDispose {}

        val fusedClient = LocationServices.getFusedLocationProviderClient(context)
        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { loc ->
                    val dist = GeofenceService.getDistanceMeters(
                        loc.latitude, loc.longitude,
                        currentAlarm.latitude, currentAlarm.longitude
                    ).toInt()
                    distance = dist

                    if (dist <= currentAlarm.radius && !arrived) {
                        arrived = true
                        triggeredTime = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())

                        // Start the native AlarmService for sound + vibration
                        val alarmIntent = Intent(context, AlarmService::class.java).apply {
                            putExtra("soundEnabled", currentAlarm.sound)
                            putExtra("vibrateEnabled", currentAlarm.vibrate)
                            putExtra("alarmLabel", currentAlarm.label)
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(alarmIntent)
                        } else {
                            context.startService(alarmIntent)
                        }
                    }
                }
            }
        }

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000L)
            .setMinUpdateDistanceMeters(10f)
            .build()

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
        }

        onDispose {
            fusedClient.removeLocationUpdates(locationCallback)
            try {
                val vibrator = (context.getSystemService(android.content.Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
                vibrator.cancel()
            } catch (_: Exception) {}
        }
    }

    val currentAlarm = alarm ?: return

    val gradientColors = if (arrived) {
        listOf(Secondary, SecondaryContainer)
    } else {
        listOf(Primary, PrimaryContainer)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.linearGradient(gradientColors))
    ) {
        // Decorative elements
        Box(
            modifier = Modifier
                .size(180.dp)
                .offset(x = (-60).dp, y = 600.dp)
                .clip(CircleShape)
                .background(Color(0x4DA43C12))
        )
        Box(
            modifier = Modifier
                .size(240.dp)
                .offset(x = 250.dp, y = (-60).dp)
                .clip(CircleShape)
                .background(Color(0x330040A1))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Brand
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 32.dp)
            ) {
                Icon(Icons.Default.Notifications, null, tint = Color.White, modifier = Modifier.size(24.dp))
                Text("Vigilant Path", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            }

            // Main Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(32.dp),
                color = Color.White.copy(alpha = 0.15f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Pulse icon
                    Box(
                        modifier = Modifier.size(80.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        // Ring border
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .border(
                                    width = 2.dp,
                                    color = if (arrived) Color(0x80FE7E4F) else Color(0x660040A1),
                                    shape = CircleShape
                                )
                        )
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .shadow(6.dp, CircleShape)
                                .clip(CircleShape)
                                .background(Color.White),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (arrived) Icons.Default.Notifications else Icons.Default.LocationOn,
                                null,
                                tint = if (arrived) Secondary else Primary,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                    }

                    Spacer(Modifier.height(24.dp))

                    // Status
                    Text(
                        if (arrived) "🔔 ALARM TRIGGERED" else "APPROACHING DESTINATION",
                        fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.8f),
                        letterSpacing = 2.sp
                    )
                    Text(
                        currentAlarm.label,
                        fontSize = 26.sp, fontWeight = FontWeight.Black,
                        color = Color.White, letterSpacing = (-0.5).sp,
                        textAlign = TextAlign.Center
                    )
                    if (currentAlarm.address.isNotBlank()) {
                        Text(
                            currentAlarm.address,
                            fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f),
                            modifier = Modifier.padding(top = 2.dp),
                            maxLines = 1
                        )
                    }
                    triggeredTime?.let { time ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Icon(Icons.Outlined.Schedule, null, tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(14.dp))
                            Text("Triggered at $time", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Color.White.copy(alpha = 0.7f))
                        }
                    }

                    // Alarm active indicator
                    if (arrived) {
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.VolumeUp, null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Text(
                                when {
                                    currentAlarm.vibrate && currentAlarm.sound -> "Vibrating & Playing Sound"
                                    currentAlarm.vibrate -> "Vibrating"
                                    currentAlarm.sound -> "Playing Sound"
                                    else -> "Alarm Active"
                                },
                                fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White
                            )
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFFF4444))
                            )
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    // Distance bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (distance == null) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(Icons.Default.Navigation, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                            Text(
                                when {
                                    distance == null -> "Calculating..."
                                    distance!! < 1000 -> "${distance}m away"
                                    else -> "${"%.1f".format(distance!! / 1000.0)}km away"
                                },
                                fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White
                            )
                        }
                        val radiusText = if (currentAlarm.radius >= 1000) {
                            "${(currentAlarm.radius / 1000.0).let { if (it == it.toLong().toDouble()) it.toLong().toString() else "%.1f".format(it) }}km"
                        } else "${currentAlarm.radius}m"
                        Text(
                            "Radius: $radiusText",
                            fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                }
            }

            Spacer(Modifier.weight(1f))

            // Actions
            // Dismiss Button
            Button(
                onClick = {
                    scope.launch {
                        val stopIntent = Intent(context, AlarmService::class.java).apply {
                            action = AlarmService.ACTION_STOP
                        }
                        context.startService(stopIntent)
                        prefs.clearAlarmState(alarmId)
                        db.alarmDao().setAlarmActive(alarmId, false)
                        onNavigateBack()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .shadow(4.dp, CircleShape),
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(containerColor = Color.White)
            ) {
                Icon(
                    Icons.Default.Close, null,
                    tint = if (arrived) Secondary else Primary,
                    modifier = Modifier.size(26.dp)
                )
                Spacer(Modifier.width(12.dp))
                Text(
                    if (arrived) "Stop & Dismiss Alarm" else "Dismiss Alarm",
                    fontSize = 18.sp, fontWeight = FontWeight.ExtraBold,
                    color = if (arrived) Secondary else Primary
                )
            }

            // Snooze Button (only when arrived)
            if (arrived) {
                Spacer(Modifier.height(12.dp))
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            val snoozeIntent = Intent(context, AlarmService::class.java).apply {
                                action = AlarmService.ACTION_SNOOZE
                            }
                            context.startService(snoozeIntent)
                            prefs.addSnoozedAlarm(alarmId)
                            prefs.setCurrentTrigger(null)
                            onNavigateBack()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = CircleShape,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
                ) {
                    Icon(Icons.Outlined.DarkMode, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Snooze", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Re-alerts when you leave & come back", fontSize = 10.sp, fontWeight = FontWeight.Medium, color = Color.White.copy(alpha = 0.7f))
                    }
                }
            }

            // Open in Maps
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = {
                    val url = "https://www.google.com/maps/dir/?api=1&destination=${currentAlarm.latitude},${currentAlarm.longitude}"
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = CircleShape,
                border = androidx.compose.foundation.BorderStroke(2.dp, Color.White.copy(alpha = 0.3f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
            ) {
                Icon(Icons.Outlined.Map, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Open in Google Maps", fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }

            // Status
            Spacer(Modifier.height(20.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(Icons.Outlined.FavoriteBorder, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                Text(
                    if (arrived) "Alarm will continue until dismissed" else "Monitoring location...",
                    fontSize = 12.sp, color = Color.White.copy(alpha = 0.6f)
                )
            }
        }
    }
}

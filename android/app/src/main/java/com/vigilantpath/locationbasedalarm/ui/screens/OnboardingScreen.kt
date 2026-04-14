package com.vigilantpath.locationbasedalarm.ui.screens

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vigilantpath.locationbasedalarm.data.PreferencesManager
import com.vigilantpath.locationbasedalarm.ui.theme.*
import kotlinx.coroutines.launch

data class OnboardingStep(
    val key: String,
    val icon: ImageVector,
    val iconBg: Color,
    val iconColor: Color,
    val title: String,
    val subtitle: String,
    val description: String,
    val features: List<Pair<ImageVector, String>>? = null,
    val details: List<Triple<ImageVector, String, Boolean>>? = null,
    val warningText: String? = null,
    val buttonText: String,
)

private val steps = listOf(
    OnboardingStep(
        key = "welcome",
        icon = Icons.Default.Notifications,
        iconBg = SecondaryFixed,
        iconColor = Secondary,
        title = "Vigilant Path",
        subtitle = "Never miss your stop again.",
        description = "Set location-based alarms that automatically alert you with sound and vibration when you arrive at your destination.",
        features = listOf(
            Icons.Default.LocationOn to "GPS Geofencing",
            Icons.Default.VolumeUp to "Alarm Sound",
            Icons.Default.PhoneAndroid to "Vibration",
            Icons.Default.DarkMode to "Snooze & Re-trigger",
        ),
        buttonText = "Get Started",
    ),
    OnboardingStep(
        key = "location",
        icon = Icons.Default.LocationOn,
        iconBg = PrimaryFixed,
        iconColor = Primary,
        title = "Location Access",
        subtitle = "Required for alarms to work",
        description = "We need your location to detect when you're approaching your destination and trigger the alarm automatically.",
        details = listOf(
            Triple(Icons.Default.Shield, "Your location data stays on your device only", false),
            Triple(Icons.Default.CloudOff, "No location data is sent to any server", false),
            Triple(Icons.Default.BatteryChargingFull, "Smart battery optimization", false),
        ),
        buttonText = "Allow Location Access",
    ),
    OnboardingStep(
        key = "background",
        icon = Icons.Default.Explore,
        iconBg = WarningBg,
        iconColor = WarningAccent,
        title = "\"Allow All The Time\"",
        subtitle = "Essential for background monitoring",
        description = "For alarms to work in the background, you MUST select \"Allow all the time\" in the next prompt.",
        details = listOf(
            Triple(Icons.Default.Warning, "Choose \"Allow all the time\" — NOT \"While using the app\"", true),
            Triple(Icons.Default.Alarm, "Without this, alarms won't trigger when screen is off", false),
            Triple(Icons.Default.Info, "You can change this later in Settings → Apps", false),
        ),
        warningText = "⚠️ Select \"Allow all the time\" on the next screen",
        buttonText = "Grant Background Access",
    ),
    OnboardingStep(
        key = "notifications",
        icon = Icons.Default.NotificationsActive,
        iconBg = TertiaryFixed,
        iconColor = Tertiary,
        title = "Notifications",
        subtitle = "Get alerted when you arrive",
        description = "We'll send you a notification when you enter your alarm's geofence, even if the app is in the background.",
        details = listOf(
            Triple(Icons.Default.Campaign, "Alarm trigger notifications", false),
            Triple(Icons.Default.FavoriteBorder, "Background monitoring status", false),
        ),
        buttonText = "Allow Notifications",
    ),
)

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun OnboardingScreen(onComplete: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefs = remember { PreferencesManager(context) }
    var currentStep by remember { mutableIntStateOf(0) }
    val step = steps[currentStep]

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
            currentStep = 2
        }
    }

    val backgroundPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> currentStep = 3 }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        scope.launch {
            prefs.setOnboardingDone(true)
            onComplete()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceContainerLow)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp)
            .padding(top = 12.dp, bottom = 16.dp)
    ) {
        // Progress dots
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            steps.forEachIndexed { i, _ ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .size(
                            width = if (i == currentStep) 28.dp else 8.dp,
                            height = 8.dp
                        )
                        .clip(CircleShape)
                        .background(
                            when {
                                i == currentStep -> Primary
                                i < currentStep -> PrimaryFixedDim
                                else -> SurfaceContainerHighest
                            }
                        )
                )
            }
        }

        // Scrollable content area
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(16.dp))

            // Icon - smaller to save space
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .shadow(4.dp, CircleShape)
                    .clip(CircleShape)
                    .background(step.iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = step.icon,
                    contentDescription = null,
                    tint = step.iconColor,
                    modifier = Modifier.size(36.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            // Title
            Text(
                text = step.title,
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = OnSurface,
                textAlign = TextAlign.Center,
            )

            Text(
                text = step.subtitle,
                style = MaterialTheme.typography.labelLarge,
                color = Primary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 2.dp)
            )

            Text(
                text = step.description,
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp,
                modifier = Modifier.padding(top = 10.dp, start = 8.dp, end = 8.dp)
            )

            Spacer(Modifier.height(16.dp))

            // Features (welcome screen)
            step.features?.let { features ->
                FlowRow(
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    features.forEach { (icon, text) ->
                        Row(
                            modifier = Modifier
                                .padding(4.dp)
                                .background(PrimaryFixed, CircleShape)
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(icon, null, tint = Primary, modifier = Modifier.size(16.dp))
                            Text(text, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Primary)
                        }
                    }
                }
            }

            // Details (permission screens) - compact
            step.details?.let { details ->
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    details.forEach { (icon, text, bold) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(SurfaceContainerHigh, RoundedCornerShape(16.dp))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                icon, null,
                                tint = if (bold) WarningAccent else Primary,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = text,
                                fontSize = 13.sp,
                                lineHeight = 17.sp,
                                color = if (bold) WarningText else OnSurfaceVariant,
                                fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // Warning - compact
            step.warningText?.let { warning ->
                Spacer(Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(WarningBg, RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = warning,
                        fontSize = 13.sp,
                        color = WarningText,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
        }

        // CTA Button - always visible at bottom
        Button(
            onClick = {
                when (step.key) {
                    "welcome" -> currentStep = 1
                    "location" -> {
                        locationPermissionLauncher.launch(
                            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
                        )
                    }
                    "background" -> {
                        backgroundPermissionLauncher.launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                    }
                    "notifications" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        } else {
                            scope.launch { prefs.setOnboardingDone(true); onComplete() }
                        }
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = CircleShape,
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
            contentPadding = PaddingValues(0.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brush.linearGradient(listOf(Primary, PrimaryContainer)), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(step.buttonText, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
        }

        if (step.key == "notifications") {
            TextButton(
                onClick = { scope.launch { prefs.setOnboardingDone(true); onComplete() } },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Skip for now", color = Outline, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
        }
    }
}

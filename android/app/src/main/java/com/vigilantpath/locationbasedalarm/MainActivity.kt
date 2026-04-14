package com.vigilantpath.locationbasedalarm

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.navigation.compose.rememberNavController
import com.vigilantpath.locationbasedalarm.data.PreferencesManager
import com.vigilantpath.locationbasedalarm.service.UpdateService
import com.vigilantpath.locationbasedalarm.ui.navigation.AppNavigation
import com.vigilantpath.locationbasedalarm.ui.navigation.Screen
import com.vigilantpath.locationbasedalarm.ui.theme.VigilantPathTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            VigilantPathTheme {
                val navController = rememberNavController()
                val prefs = remember { PreferencesManager(this@MainActivity) }
                var startDestination by remember { mutableStateOf<String?>(null) }
                val scope = rememberCoroutineScope()

                // Determine start destination based on onboarding state
                LaunchedEffect(Unit) {
                    val onboardingDone = prefs.onboardingDone.first()
                    startDestination = if (onboardingDone) {
                        Screen.AlarmList.route
                    } else {
                        Screen.Onboarding.route
                    }

                    // Check for updates
                    scope.launch {
                        val result = UpdateService.checkForUpdates(this@MainActivity)
                        if (result != null) {
                            if (result.needsForceUpdate) {
                                // Show force update dialog
                                showUpdateDialog(result.config.updateMessage, true, result.config.playStoreUrl)
                            } else if (result.isUpdateAvailable) {
                                showUpdateDialog(result.config.updateMessage, false, result.config.playStoreUrl)
                            }
                        }
                    }
                }

                // Handle intent navigation (from notification tap)
                LaunchedEffect(intent) {
                    handleIntent(intent, navController)
                }

                startDestination?.let { dest ->
                    AppNavigation(
                        navController = navController,
                        startDestination = dest
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    private fun handleIntent(intent: Intent?, navController: androidx.navigation.NavHostController) {
        val navigateTo = intent?.getStringExtra("navigate_to")
        val alarmId = intent?.getStringExtra("alarm_id")
        if (navigateTo == "active_alarm" && alarmId != null) {
            navController.navigate(Screen.ActiveAlarm.createRoute(alarmId))
        }
    }

    private fun showUpdateDialog(message: String?, isForce: Boolean, playStoreUrl: String?) {
        val alertMessage = message ?: if (isForce) {
            "A critical update is required. Please update to continue using the app."
        } else {
            "A new version is available with improvements and bug fixes."
        }

        val url = playStoreUrl?.ifBlank { null } ?: UpdateService.PLAY_STORE_URL

        val builder = android.app.AlertDialog.Builder(this)
            .setTitle(if (isForce) "⚠️ Update Required" else "🆕 Update Available")
            .setMessage(alertMessage)
            .setPositiveButton(if (isForce) "Update Now" else "Update") { _, _ ->
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)))
                } catch (_: Exception) {}
                if (isForce) {
                    finishAffinity()
                }
            }

        if (!isForce) {
            builder.setNegativeButton("Later") { dialog, _ -> dialog.dismiss() }
        }

        builder.setCancelable(!isForce)
        builder.show()
    }
}

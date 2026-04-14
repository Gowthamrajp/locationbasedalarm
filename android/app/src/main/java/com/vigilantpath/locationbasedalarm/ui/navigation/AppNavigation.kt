package com.vigilantpath.locationbasedalarm.ui.navigation

import androidx.compose.animation.*
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.vigilantpath.locationbasedalarm.ui.screens.*

sealed class Screen(val route: String) {
    data object Onboarding : Screen("onboarding")
    data object AlarmList : Screen("alarm_list")
    data object CreateAlarm : Screen("create_alarm?alarmId={alarmId}") {
        fun createRoute(alarmId: String? = null): String {
            return if (alarmId != null) "create_alarm?alarmId=$alarmId" else "create_alarm"
        }
    }
    data object ActiveAlarm : Screen("active_alarm/{alarmId}") {
        fun createRoute(alarmId: String): String = "active_alarm/$alarmId"
    }
}

@Composable
fun AppNavigation(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onComplete = {
                    navController.navigate(Screen.AlarmList.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.AlarmList.route) {
            AlarmListScreen(
                onNavigateToCreate = {
                    navController.navigate(Screen.CreateAlarm.createRoute())
                },
                onNavigateToEdit = { alarmId ->
                    navController.navigate(Screen.CreateAlarm.createRoute(alarmId))
                },
                onNavigateToActive = { alarmId ->
                    navController.navigate(Screen.ActiveAlarm.createRoute(alarmId))
                }
            )
        }

        composable(
            route = Screen.CreateAlarm.route,
            arguments = listOf(
                navArgument("alarmId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val alarmId = backStackEntry.arguments?.getString("alarmId")
            CreateAlarmScreen(
                alarmId = alarmId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.ActiveAlarm.route,
            arguments = listOf(
                navArgument("alarmId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val alarmId = backStackEntry.arguments?.getString("alarmId") ?: return@composable
            ActiveAlarmScreen(
                alarmId = alarmId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

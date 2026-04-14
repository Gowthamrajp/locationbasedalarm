package com.vigilantpath.locationbasedalarm.service

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

data class VersionConfig(
    val latestVersion: String = "",
    val minimumVersion: String = "",
    val latestVersionCode: Int = 0,
    val forceUpdate: Boolean = false,
    val updateMessage: String = "",
    val playStoreUrl: String = ""
)

data class UpdateCheckResult(
    val config: VersionConfig,
    val currentVersion: String,
    val isUpdateAvailable: Boolean,
    val needsForceUpdate: Boolean
)

object UpdateService {
    private const val TAG = "UpdateService"
    private const val VERSION_CONFIG_URL =
        "https://raw.githubusercontent.com/Gowthamrajp/locationbasedalarm/main/version.json"
    const val PLAY_STORE_URL =
        "https://play.google.com/store/apps/details?id=com.vigilantpath.locationbasedalarm"

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    suspend fun checkForUpdates(context: Context): UpdateCheckResult? {
        return withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url(VERSION_CONFIG_URL)
                    .header("Cache-Control", "no-cache")
                    .build()

                val response = client.newCall(request).execute()
                if (!response.isSuccessful) return@withContext null

                val body = response.body?.string() ?: return@withContext null
                val config = Gson().fromJson(body, VersionConfig::class.java)
                val currentVersion = getCurrentVersion(context)

                val isBelowMinimum = compareVersions(currentVersion, config.minimumVersion) < 0
                val isUpdateAvailable = compareVersions(currentVersion, config.latestVersion) < 0

                UpdateCheckResult(
                    config = config,
                    currentVersion = currentVersion,
                    isUpdateAvailable = isUpdateAvailable,
                    needsForceUpdate = isBelowMinimum || config.forceUpdate
                )
            } catch (e: Exception) {
                Log.d(TAG, "Update check failed: ${e.message}")
                null
            }
        }
    }

    fun getCurrentVersion(context: Context): String {
        return try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "1.0.0"
        } catch (e: PackageManager.NameNotFoundException) {
            "1.0.0"
        }
    }

    fun compareVersions(a: String, b: String): Int {
        val partsA = a.split(".").map { it.toIntOrNull() ?: 0 }
        val partsB = b.split(".").map { it.toIntOrNull() ?: 0 }
        val maxLen = maxOf(partsA.size, partsB.size)

        for (i in 0 until maxLen) {
            val numA = partsA.getOrElse(i) { 0 }
            val numB = partsB.getOrElse(i) { 0 }
            if (numA < numB) return -1
            if (numA > numB) return 1
        }
        return 0
    }
}

package com.vigilantpath.locationbasedalarm.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "alarms")
data class Alarm(
    @PrimaryKey
    val id: String = System.currentTimeMillis().toString(),
    val label: String = "",
    val address: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val radius: Int = 500,
    val vibrate: Boolean = true,
    val sound: Boolean = true,
    val ringtone: String = "default",
    val active: Boolean = true,
    val createdAt: String = java.time.Instant.now().toString()
)

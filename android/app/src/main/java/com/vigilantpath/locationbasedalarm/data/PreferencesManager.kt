package com.vigilantpath.locationbasedalarm.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "vigilant_prefs")

class PreferencesManager(private val context: Context) {

    companion object {
        val ONBOARDING_DONE = booleanPreferencesKey("onboarding_done")
        val TRIGGERED_ALARMS = stringPreferencesKey("triggered_alarms") // comma-separated IDs
        val SNOOZED_ALARMS = stringPreferencesKey("snoozed_alarms")   // comma-separated IDs
        val CURRENT_TRIGGER_ALARM_ID = stringPreferencesKey("current_trigger_alarm_id")
    }

    val onboardingDone: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[ONBOARDING_DONE] ?: false
    }

    suspend fun setOnboardingDone(done: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[ONBOARDING_DONE] = done
        }
    }

    suspend fun getTriggeredAlarmIds(): Set<String> {
        var result = emptySet<String>()
        context.dataStore.edit { prefs ->
            val str = prefs[TRIGGERED_ALARMS] ?: ""
            result = if (str.isBlank()) emptySet() else str.split(",").toSet()
        }
        return result
    }

    suspend fun addTriggeredAlarm(alarmId: String) {
        context.dataStore.edit { prefs ->
            val current = (prefs[TRIGGERED_ALARMS] ?: "").split(",").filter { it.isNotBlank() }.toMutableSet()
            current.add(alarmId)
            prefs[TRIGGERED_ALARMS] = current.joinToString(",")
        }
    }

    suspend fun removeTriggeredAlarm(alarmId: String) {
        context.dataStore.edit { prefs ->
            val current = (prefs[TRIGGERED_ALARMS] ?: "").split(",").filter { it.isNotBlank() }.toMutableSet()
            current.remove(alarmId)
            prefs[TRIGGERED_ALARMS] = current.joinToString(",")
            if (prefs[CURRENT_TRIGGER_ALARM_ID] == alarmId) {
                prefs.remove(CURRENT_TRIGGER_ALARM_ID)
            }
        }
    }

    suspend fun getSnoozedAlarmIds(): Set<String> {
        var result = emptySet<String>()
        context.dataStore.edit { prefs ->
            val str = prefs[SNOOZED_ALARMS] ?: ""
            result = if (str.isBlank()) emptySet() else str.split(",").toSet()
        }
        return result
    }

    suspend fun addSnoozedAlarm(alarmId: String) {
        context.dataStore.edit { prefs ->
            val current = (prefs[SNOOZED_ALARMS] ?: "").split(",").filter { it.isNotBlank() }.toMutableSet()
            current.add(alarmId)
            prefs[SNOOZED_ALARMS] = current.joinToString(",")
        }
    }

    suspend fun removeSnoozedAlarm(alarmId: String) {
        context.dataStore.edit { prefs ->
            val current = (prefs[SNOOZED_ALARMS] ?: "").split(",").filter { it.isNotBlank() }.toMutableSet()
            current.remove(alarmId)
            prefs[SNOOZED_ALARMS] = current.joinToString(",")
        }
    }

    suspend fun setCurrentTrigger(alarmId: String?) {
        context.dataStore.edit { prefs ->
            if (alarmId != null) {
                prefs[CURRENT_TRIGGER_ALARM_ID] = alarmId
            } else {
                prefs.remove(CURRENT_TRIGGER_ALARM_ID)
            }
        }
    }

    suspend fun getCurrentTriggerAlarmId(): String? {
        var result: String? = null
        context.dataStore.edit { prefs ->
            result = prefs[CURRENT_TRIGGER_ALARM_ID]
        }
        return result
    }

    suspend fun clearAlarmState(alarmId: String) {
        removeTriggeredAlarm(alarmId)
        removeSnoozedAlarm(alarmId)
    }
}

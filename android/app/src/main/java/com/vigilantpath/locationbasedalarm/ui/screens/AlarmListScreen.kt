package com.vigilantpath.locationbasedalarm.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vigilantpath.locationbasedalarm.data.Alarm
import com.vigilantpath.locationbasedalarm.data.AppDatabase
import com.vigilantpath.locationbasedalarm.data.PreferencesManager
import com.vigilantpath.locationbasedalarm.service.GeofenceService
import com.vigilantpath.locationbasedalarm.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun AlarmListScreen(
    onNavigateToCreate: () -> Unit,
    onNavigateToEdit: (String) -> Unit,
    onNavigateToActive: (String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { AppDatabase.getDatabase(context) }
    val alarms by db.alarmDao().getAllAlarms().collectAsState(initial = emptyList())
    var showDeleteDialog by remember { mutableStateOf<Alarm?>(null) }
    val monitoring = alarms.any { it.active }
    val activeCount = alarms.count { it.active }

    // Start/stop monitoring based on active alarms
    LaunchedEffect(alarms) {
        if (alarms.any { it.active }) {
            GeofenceService.start(context)
        } else if (alarms.isNotEmpty()) {
            GeofenceService.stop(context)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top App Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 24.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Vigilant Path",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Primary,
                    letterSpacing = (-0.3).sp
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (monitoring && activeCount > 0) {
                        Row(
                            modifier = Modifier
                                .background(GreenActiveLight, CircleShape)
                                .padding(horizontal = 10.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Box(
                                Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(GreenActive)
                            )
                            Text("Monitoring", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = GreenActiveText)
                        }
                    }
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(PrimaryFixed),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, null, tint = Primary, modifier = Modifier.size(20.dp))
                    }
                }
            }

            // Content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp)
            ) {
                Spacer(Modifier.height(16.dp))

                // Header
                Text(
                    "Active Monitor",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Primary,
                    letterSpacing = 1.5.sp
                )
                Text(
                    "Your Alarms",
                    fontSize = 34.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = OnBackground,
                    letterSpacing = (-0.5).sp
                )

                if (alarms.isEmpty()) {
                    Text(
                        "Tap + to create your first location alarm.",
                        fontSize = 15.sp,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                } else {
                    Row(
                        modifier = Modifier.padding(top = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        StatChip(Icons.Default.Alarm, "${alarms.size} Alarm${if (alarms.size > 1) "s" else ""}", SurfaceContainerHigh, OnSurfaceVariant)
                        StatChip(null, "$activeCount Active", GreenActiveLight, GreenActiveText, dotColor = GreenActive)
                    }
                }

                Spacer(Modifier.height(24.dp))

                // Empty state
                if (alarms.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 60.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Outlined.LocationOn, null,
                            tint = OutlineVariant,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Text("No alarms yet", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        Text(
                            "Create an alarm to get notified when you reach a destination",
                            fontSize = 14.sp, color = Outline,
                            modifier = Modifier.padding(start = 40.dp, end = 40.dp, top = 4.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }

                // Alarm Cards
                alarms.forEach { alarm ->
                    AlarmCard(
                        alarm = alarm,
                        onToggle = {
                            scope.launch {
                                db.alarmDao().setAlarmActive(alarm.id, !alarm.active)
                                if (!alarm.active) {
                                    // Re-enabling: clear triggered state
                                    PreferencesManager(context).clearAlarmState(alarm.id)
                                }
                            }
                        },
                        onEdit = { onNavigateToEdit(alarm.id) },
                        onDelete = { showDeleteDialog = alarm },
                        onPress = { if (alarm.active) onNavigateToActive(alarm.id) }
                    )
                    Spacer(Modifier.height(12.dp))
                }

                Spacer(Modifier.height(120.dp))
            }
        }

        // FAB
        FloatingActionButton(
            onClick = onNavigateToCreate,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .navigationBarsPadding()
                .padding(end = 24.dp, bottom = 24.dp)
                .size(64.dp)
                .shadow(8.dp, CircleShape),
            shape = CircleShape,
            containerColor = Color.Transparent,
            contentColor = Color.White,
            elevation = FloatingActionButtonDefaults.elevation(0.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brush.linearGradient(listOf(Primary, PrimaryContainer)), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Add, "Add alarm", modifier = Modifier.size(28.dp))
            }
        }

        // Delete dialog
        showDeleteDialog?.let { alarm ->
            AlertDialog(
                onDismissRequest = { showDeleteDialog = null },
                title = { Text("Delete Alarm") },
                text = { Text("Are you sure you want to delete \"${alarm.label}\"?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            scope.launch {
                                db.alarmDao().deleteAlarm(alarm)
                                showDeleteDialog = null
                            }
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = Error)
                    ) { Text("Delete") }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = null }) { Text("Cancel") }
                }
            )
        }
    }
}

@Composable
private fun StatChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector?,
    text: String,
    bgColor: Color,
    textColor: Color,
    dotColor: Color? = null
) {
    Row(
        modifier = Modifier
            .background(bgColor, CircleShape)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        if (dotColor != null) {
            Box(Modifier.size(6.dp).clip(CircleShape).background(dotColor))
        }
        icon?.let {
            Icon(it, null, tint = textColor, modifier = Modifier.size(14.dp))
        }
        Text(text, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = textColor)
    }
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
private fun AlarmCard(
    alarm: Alarm,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onPress: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = onPress,
                onLongClick = onDelete
            ),
        shape = RoundedCornerShape(24.dp),
        color = SurfaceContainerLowest,
        shadowElevation = 2.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceContainerHigh)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Top: icon + label + switch
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (alarm.active) PrimaryFixed else SurfaceContainerHighest),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.LocationOn, null,
                        tint = if (alarm.active) Primary else Outline,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        alarm.label.ifBlank { "Alarm" },
                        fontSize = 16.sp, fontWeight = FontWeight.Bold, color = OnSurface
                    )
                    Text(
                        alarm.address.ifBlank { "Destination" },
                        fontSize = 13.sp, fontWeight = FontWeight.Medium,
                        color = OnSurfaceVariant,
                        maxLines = 1, overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
                Switch(
                    checked = alarm.active,
                    onCheckedChange = { onToggle() },
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = Primary,
                        checkedThumbColor = Color.White,
                        uncheckedTrackColor = SurfaceContainerHighest,
                        uncheckedThumbColor = Color.White
                    )
                )
            }

            Spacer(Modifier.height(16.dp))
            HorizontalDivider(color = SurfaceContainerHigh)
            Spacer(Modifier.height(12.dp))

            // Bottom: tags + edit
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val displayRadius = if (alarm.radius >= 1000) {
                        "${(alarm.radius / 1000.0).let { if (it == it.toLong().toDouble()) it.toLong().toString() else "%.1f".format(it) }} km"
                    } else "${alarm.radius}m"

                    TagChip(Icons.Outlined.Circle, displayRadius, SurfaceContainerHigh, OnSurfaceVariant)
                    if (alarm.vibrate) {
                        TagChip(
                            Icons.Outlined.PhoneAndroid, "Vibrate",
                            if (alarm.active) PrimaryFixed else SurfaceContainerHigh,
                            if (alarm.active) Primary else OnSurfaceVariant
                        )
                    }
                    if (alarm.sound) {
                        TagChip(
                            Icons.Default.VolumeUp, "Sound",
                            if (alarm.active) WarningBg else SurfaceContainerHigh,
                            if (alarm.active) WarningText else OnSurfaceVariant
                        )
                    }
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                    Icon(Icons.Outlined.Edit, "Edit", tint = Primary, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

@Composable
private fun TagChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    bgColor: Color,
    contentColor: Color
) {
    Row(
        modifier = Modifier
            .background(bgColor, CircleShape)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(icon, null, tint = contentColor, modifier = Modifier.size(12.dp))
        Text(text, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = contentColor)
    }
}

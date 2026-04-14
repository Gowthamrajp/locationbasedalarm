package com.vigilantpath.locationbasedalarm.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.location.Geocoder
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.window.Dialog
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
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.vigilantpath.locationbasedalarm.data.Alarm
import com.vigilantpath.locationbasedalarm.data.AppDatabase
import com.vigilantpath.locationbasedalarm.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

@Composable
fun CreateAlarmScreen(
    alarmId: String?,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { AppDatabase.getDatabase(context) }
    val geocoder = remember { Geocoder(context, Locale.getDefault()) }

    var label by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var radius by remember { mutableIntStateOf(500) }
    var vibrateOn by remember { mutableStateOf(true) }
    var soundOn by remember { mutableStateOf(true) }
    var markerPosition by remember { mutableStateOf<LatLng?>(null) }
    var isEditing by remember { mutableStateOf(false) }
    var existingAlarm by remember { mutableStateOf<Alarm?>(null) }

    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<Pair<String, LatLng>>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    var showSearchResults by remember { mutableStateOf(false) }
    var showRadiusDialog by remember { mutableStateOf(false) }
    var radiusInputText by remember { mutableStateOf("") }
    var radiusUnit by remember { mutableStateOf("m") } // "m" or "km"

    val defaultPos = LatLng(12.9716, 77.5946)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(defaultPos, 12f)
    }

    LaunchedEffect(alarmId) {
        if (alarmId != null) {
            val alarm = db.alarmDao().getAlarmById(alarmId)
            if (alarm != null) {
                existingAlarm = alarm; isEditing = true
                label = alarm.label; address = alarm.address; radius = alarm.radius
                vibrateOn = alarm.vibrate; soundOn = alarm.sound
                val pos = LatLng(alarm.latitude, alarm.longitude)
                markerPosition = pos
                cameraPositionState.move(CameraUpdateFactory.newLatLngZoom(pos, 15f))
            }
        } else {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                try {
                    LocationServices.getFusedLocationProviderClient(context).lastLocation.addOnSuccessListener { location ->
                        location?.let {
                            scope.launch { cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(LatLng(it.latitude, it.longitude), 15f), 1000) }
                        }
                    }
                } catch (_: Exception) {}
            }
        }
    }

    suspend fun reverseGeocode(latLng: LatLng): String = withContext(Dispatchers.IO) {
        try {
            @Suppress("DEPRECATION")
            val results = geocoder.getFromLocation(latLng.latitude, latLng.longitude, 1)
            if (!results.isNullOrEmpty()) {
                val r = results[0]
                listOfNotNull(r.featureName, r.thoroughfare, r.locality, r.adminArea).distinct().joinToString(", ")
            } else "%.5f, %.5f".format(latLng.latitude, latLng.longitude)
        } catch (_: Exception) { "%.5f, %.5f".format(latLng.latitude, latLng.longitude) }
    }

    fun searchLocation(query: String) {
        if (query.length < 3) { searchResults = emptyList(); showSearchResults = false; return }
        isSearching = true; showSearchResults = true
        scope.launch(Dispatchers.IO) {
            try {
                @Suppress("DEPRECATION")
                val results = geocoder.getFromLocationName(query, 5)
                val mapped = results?.map { r ->
                    listOfNotNull(r.featureName, r.thoroughfare, r.locality, r.adminArea, r.countryName).distinct().joinToString(", ") to LatLng(r.latitude, r.longitude)
                } ?: emptyList()
                withContext(Dispatchers.Main) { searchResults = mapped; isSearching = false }
            } catch (_: Exception) { withContext(Dispatchers.Main) { searchResults = emptyList(); isSearching = false } }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Map - full screen
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            properties = MapProperties(isMyLocationEnabled = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED),
            uiSettings = MapUiSettings(myLocationButtonEnabled = false, zoomControlsEnabled = false),
            onMapClick = { latLng ->
                markerPosition = latLng; showSearchResults = false
                scope.launch { address = reverseGeocode(latLng) }
            },
            contentPadding = PaddingValues(bottom = 280.dp)
        ) {
            markerPosition?.let { pos ->
                Marker(state = MarkerState(position = pos), title = label.ifBlank { "Alarm Location" })
                Circle(center = pos, radius = radius.toDouble(), fillColor = Color(0x1A0040A1), strokeColor = Color(0x4D0040A1), strokeWidth = 2f)
            }
        }

        // Top Bar
        Column(modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 4.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    IconButton(onClick = onNavigateBack, modifier = Modifier.size(40.dp).shadow(2.dp, CircleShape).background(Color.White.copy(alpha = 0.9f), CircleShape)) {
                        Icon(Icons.Default.Close, "Close", tint = Primary)
                    }
                    Text(if (isEditing) "Edit Alarm" else "New Alarm", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White,
                        style = LocalTextStyle.current.copy(shadow = androidx.compose.ui.graphics.Shadow(color = Color.Black.copy(alpha = 0.6f), blurRadius = 4f)))
                }
                Button(
                    onClick = {
                        if (markerPosition == null || label.isBlank()) return@Button
                        scope.launch {
                            db.alarmDao().insertAlarm(Alarm(
                                id = existingAlarm?.id ?: System.currentTimeMillis().toString(),
                                label = label.trim(), address = address.ifBlank { "Custom Location" },
                                latitude = markerPosition!!.latitude, longitude = markerPosition!!.longitude,
                                radius = radius, vibrate = vibrateOn, sound = soundOn,
                                active = existingAlarm?.active ?: true,
                                createdAt = existingAlarm?.createdAt ?: java.time.Instant.now().toString()
                            ))
                            onNavigateBack()
                        }
                    },
                    shape = CircleShape, colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(0.dp), modifier = Modifier.height(40.dp)
                ) {
                    Box(modifier = Modifier.fillMaxHeight().background(Brush.linearGradient(listOf(Primary, PrimaryContainer)), CircleShape).padding(horizontal = 20.dp), contentAlignment = Alignment.Center) {
                        Text("Save", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            // Search
            OutlinedTextField(
                value = searchQuery, onValueChange = { searchQuery = it; searchLocation(it) },
                placeholder = { Text("Search for a place or address...", fontSize = 14.sp) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Outline, modifier = Modifier.size(18.dp)) },
                trailingIcon = { if (searchQuery.isNotEmpty()) IconButton(onClick = { searchQuery = ""; searchResults = emptyList(); showSearchResults = false }) { Icon(Icons.Default.Cancel, null, tint = Outline, modifier = Modifier.size(18.dp)) } },
                modifier = Modifier.fillMaxWidth().shadow(3.dp, RoundedCornerShape(24.dp)),
                shape = RoundedCornerShape(24.dp), singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White, focusedBorderColor = Color.Transparent, unfocusedBorderColor = Color.Transparent)
            )
            if (showSearchResults) {
                Surface(modifier = Modifier.fillMaxWidth().padding(top = 4.dp), shape = RoundedCornerShape(16.dp), shadowElevation = 5.dp, color = Color.White) {
                    Column {
                        if (isSearching) { Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) { CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp); Text("Searching...", fontSize = 13.sp, color = Outline) } }
                        else if (searchResults.isEmpty()) { Row(modifier = Modifier.padding(16.dp)) { Icon(Icons.Outlined.Info, null, tint = Outline, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text("No results found", fontSize = 13.sp, color = Outline) } }
                        else { searchResults.forEachIndexed { i, (addr, latLng) ->
                            Surface(onClick = { markerPosition = latLng; address = addr; if (label.isBlank()) label = searchQuery.trim(); searchQuery = ""; showSearchResults = false; searchResults = emptyList(); scope.launch { cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(latLng, 15f), 800) } }, color = Color.Transparent) {
                                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.LocationOn, null, tint = Primary, modifier = Modifier.size(18.dp)); Text(addr, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = OnSurface, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f)) }
                            }
                            if (i < searchResults.lastIndex) HorizontalDivider(color = SurfaceContainerHigh, modifier = Modifier.padding(horizontal = 16.dp))
                        } }
                    }
                }
            }
        }

        // My Location FAB
        FloatingActionButton(
            onClick = {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    LocationServices.getFusedLocationProviderClient(context).lastLocation.addOnSuccessListener { location ->
                        location?.let { val pos = LatLng(it.latitude, it.longitude); markerPosition = pos; scope.launch { address = reverseGeocode(pos); cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(pos, 15f), 800) } }
                    }
                }
            },
            modifier = Modifier.align(Alignment.TopEnd).statusBarsPadding().padding(top = 130.dp, end = 16.dp).size(44.dp),
            shape = CircleShape, containerColor = Color.White, elevation = FloatingActionButtonDefaults.elevation(4.dp)
        ) { Icon(Icons.Default.MyLocation, "My location", tint = Primary, modifier = Modifier.size(22.dp)) }

        // Bottom Config Card - ALL settings visible, scrollable
        Surface(
            modifier = Modifier.fillMaxWidth().align(Alignment.BottomCenter),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = SurfaceContainerLowest, shadowElevation = 12.dp
        ) {
            Column(
                modifier = Modifier.navigationBarsPadding().padding(horizontal = 20.dp).padding(top = 8.dp, bottom = 12.dp)
                    .heightIn(max = 300.dp).verticalScroll(rememberScrollState())
            ) {
                // Handle
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Box(Modifier.padding(vertical = 6.dp).size(width = 40.dp, height = 4.dp).clip(CircleShape).background(OutlineVariant))
                }

                // Label
                OutlinedTextField(
                    value = label, onValueChange = { label = it },
                    placeholder = { Text("Alarm name (e.g. Work, Home)", fontSize = 14.sp) },
                    leadingIcon = { Icon(Icons.Outlined.Bookmark, null, tint = Primary, modifier = Modifier.size(20.dp)) },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(16.dp), singleLine = true,
                    textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
                    colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = SurfaceContainerHigh, unfocusedContainerColor = SurfaceContainerHigh, focusedBorderColor = Color.Transparent, unfocusedBorderColor = Color.Transparent)
                )

                Spacer(Modifier.height(6.dp))

                // Address
                if (address.isNotBlank()) {
                    Row(modifier = Modifier.padding(horizontal = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, null, tint = Secondary, modifier = Modifier.size(14.dp))
                        Text(address, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = OnSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                } else {
                    Text("Tap map to select location", fontSize = 12.sp, color = Outline, modifier = Modifier.padding(horizontal = 4.dp))
                }

                Spacer(Modifier.height(8.dp))

                // Radius
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Radius", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = OnSurface)
                    val dr = if (radius >= 1000) "${(radius / 1000.0).let { if (it == it.toLong().toDouble()) it.toLong().toString() else "%.1f".format(it) }}km" else "${radius}m"
                    Row(
                        modifier = Modifier.background(PrimaryFixed, CircleShape).padding(horizontal = 10.dp, vertical = 3.dp)
                            .clickable {
                                radiusInputText = if (radius >= 1000) "%.1f".format(radius / 1000.0).trimEnd('0').trimEnd('.') else radius.toString()
                                radiusUnit = if (radius >= 1000) "km" else "m"
                                showRadiusDialog = true
                            },
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(dr, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = Primary)
                        Icon(Icons.Default.Edit, null, tint = Primary, modifier = Modifier.size(12.dp))
                    }
                }
                Slider(
                    value = radius.toFloat(), onValueChange = { radius = (it / 50).toInt() * 50 },
                    valueRange = 50f..10000f, modifier = Modifier.fillMaxWidth().height(28.dp),
                    colors = SliderDefaults.colors(thumbColor = Primary, activeTrackColor = Primary, inactiveTrackColor = SurfaceContainerHighest)
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("50m", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Outline)
                    Text("5km", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Outline)
                    Text("10km", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Outline)
                }

                Spacer(Modifier.height(6.dp))
                HorizontalDivider(color = SurfaceContainerHigh)
                Spacer(Modifier.height(6.dp))

                // Vibrate & Sound in a row
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Vibrate
                    Row(
                        modifier = Modifier.weight(1f)
                            .background(if (vibrateOn) PrimaryFixed else SurfaceContainerHigh, RoundedCornerShape(14.dp))
                            .clickable { vibrateOn = !vibrateOn }
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Outlined.PhoneAndroid, null, tint = if (vibrateOn) Primary else Outline, modifier = Modifier.size(16.dp))
                        Text("Vibrate", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = if (vibrateOn) Primary else OnSurface, modifier = Modifier.weight(1f))
                        Switch(checked = vibrateOn, onCheckedChange = { vibrateOn = it }, modifier = Modifier.height(20.dp),
                            colors = SwitchDefaults.colors(checkedTrackColor = Primary, checkedThumbColor = Color.White))
                    }
                    // Sound
                    Row(
                        modifier = Modifier.weight(1f)
                            .background(if (soundOn) SecondaryFixed else SurfaceContainerHigh, RoundedCornerShape(14.dp))
                            .clickable { soundOn = !soundOn }
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Outlined.VolumeUp, null, tint = if (soundOn) Secondary else Outline, modifier = Modifier.size(16.dp))
                        Text("Sound", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = if (soundOn) Secondary else OnSurface, modifier = Modifier.weight(1f))
                        Switch(checked = soundOn, onCheckedChange = { soundOn = it }, modifier = Modifier.height(20.dp),
                            colors = SwitchDefaults.colors(checkedTrackColor = Secondary, checkedThumbColor = Color.White))
                    }
                }
            }
        }

        // Radius Input Dialog
        if (showRadiusDialog) {
            Dialog(onDismissRequest = { showRadiusDialog = false }) {
                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = SurfaceContainerLowest,
                    shadowElevation = 12.dp
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Enter Custom Radius", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = OnSurface)
                        Text("Set geofence distance", fontSize = 13.sp, color = Outline, modifier = Modifier.padding(top = 4.dp))

                        Spacer(Modifier.height(20.dp))

                        OutlinedTextField(
                            value = radiusInputText,
                            onValueChange = { radiusInputText = it },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            textStyle = LocalTextStyle.current.copy(fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = SurfaceContainerHigh,
                                unfocusedContainerColor = SurfaceContainerHigh,
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent
                            )
                        )

                        Spacer(Modifier.height(12.dp))

                        // Unit toggle
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("m" to "Meters", "km" to "Kilometers").forEach { (unit, label) ->
                                Surface(
                                    onClick = { radiusUnit = unit },
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (radiusUnit == unit) PrimaryFixed else SurfaceContainerHigh,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(
                                        label, fontSize = 14.sp, fontWeight = FontWeight.Bold,
                                        color = if (radiusUnit == unit) Primary else OnSurfaceVariant,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(vertical = 12.dp)
                                    )
                                }
                            }
                        }

                        Spacer(Modifier.height(20.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showRadiusDialog = false },
                                modifier = Modifier.weight(1f),
                                shape = CircleShape
                            ) { Text("Cancel") }

                            Button(
                                onClick = {
                                    val value = radiusInputText.toDoubleOrNull()
                                    if (value != null && value > 0) {
                                        val meters = if (radiusUnit == "km") (value * 1000).toInt() else value.toInt()
                                        radius = meters.coerceIn(50, 50000)
                                    }
                                    showRadiusDialog = false
                                },
                                modifier = Modifier.weight(1f),
                                shape = CircleShape,
                                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxSize().background(Brush.linearGradient(listOf(Primary, PrimaryContainer)), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) { Text("Apply", fontWeight = FontWeight.Bold, color = Color.White) }
                            }
                        }
                    }
                }
            }
        }
    }
}

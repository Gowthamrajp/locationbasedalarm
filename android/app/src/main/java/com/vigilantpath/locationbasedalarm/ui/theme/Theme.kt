package com.vigilantpath.locationbasedalarm.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Horizon Pulse Design System Colors
val Primary = Color(0xFF0040A1)
val PrimaryContainer = Color(0xFF0056D2)
val OnPrimary = Color(0xFFFFFFFF)
val OnPrimaryContainer = Color(0xFFCCD8FF)
val PrimaryFixed = Color(0xFFDAE2FF)
val PrimaryFixedDim = Color(0xFFB2C5FF)

val Secondary = Color(0xFFA43C12)
val SecondaryContainer = Color(0xFFFE7E4F)
val OnSecondary = Color(0xFFFFFFFF)
val SecondaryFixed = Color(0xFFFFDBCF)

val Tertiary = Color(0xFF5B4300)
val TertiaryContainer = Color(0xFF795900)
val TertiaryFixed = Color(0xFFFFDFA0)
val TertiaryFixedDim = Color(0xFFFBBC00)

val Surface = Color(0xFFFAF8FF)
val SurfaceContainerLowest = Color(0xFFFFFFFF)
val SurfaceContainerLow = Color(0xFFF2F3FE)
val SurfaceContainer = Color(0xFFEDEDF8)
val SurfaceContainerHigh = Color(0xFFE7E7F2)
val SurfaceContainerHighest = Color(0xFFE1E2EC)

val OnSurface = Color(0xFF191B23)
val OnSurfaceVariant = Color(0xFF424654)
val OnBackground = Color(0xFF191B23)
val Background = Color(0xFFFAF8FF)

val Outline = Color(0xFF737785)
val OutlineVariant = Color(0xFFC3C6D6)

val Error = Color(0xFFBA1A1A)
val ErrorContainer = Color(0xFFFFDAD6)

val GreenActive = Color(0xFF22C55E)
val GreenActiveLight = Color(0xFFDCFCE7)
val GreenActiveText = Color(0xFF15803D)

val WarningBg = Color(0xFFFEF3C7)
val WarningBorder = Color(0xFFFBBF24)
val WarningText = Color(0xFF92400E)
val WarningAccent = Color(0xFFD97706)

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = SecondaryContainer,
    tertiary = Tertiary,
    tertiaryContainer = TertiaryContainer,
    surface = Surface,
    onSurface = OnSurface,
    onSurfaceVariant = OnSurfaceVariant,
    background = Background,
    onBackground = OnBackground,
    outline = Outline,
    outlineVariant = OutlineVariant,
    error = Error,
    errorContainer = ErrorContainer,
    surfaceContainerLowest = SurfaceContainerLowest,
    surfaceContainerLow = SurfaceContainerLow,
    surfaceContainer = SurfaceContainer,
    surfaceContainerHigh = SurfaceContainerHigh,
    surfaceContainerHighest = SurfaceContainerHighest,
)

@Composable
fun VigilantPathTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}

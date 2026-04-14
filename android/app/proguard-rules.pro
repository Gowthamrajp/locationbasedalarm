# Add project specific ProGuard rules here.

# Keep Room entities
-keep class com.vigilantpath.locationbasedalarm.data.** { *; }

# Keep Gson models
-keep class com.vigilantpath.locationbasedalarm.service.VersionConfig { *; }
-keep class com.vigilantpath.locationbasedalarm.service.UpdateCheckResult { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Google Maps
-keep class com.google.android.gms.maps.** { *; }

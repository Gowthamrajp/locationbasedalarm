# Design System Strategy: The Vigilant Path

This document defines a premium, editorial approach to location-based utility. While most alarm apps rely on rigid grids and harsh borders, this design system utilizes **Tonal Depth** and **Asymmetric Balance** to create an experience that feels like a high-end travel concierge rather than a simple system tool.

## 1. Overview & Creative North Star
**Creative North Star: "The Atmospheric Guardian"**
This system is built on the concept of *Atmospheric Wayfinding*. We reject the "utility-first" aesthetic of clunky buttons and heavy dividers. Instead, we treat the interface as a living map—fluid, layered, and deeply intentional. By using wide margins and high-contrast typography scales, we transform a functional alarm app into a sophisticated digital companion. 

The design breaks the "template" look by layering soft, rounded surfaces that appear to float over one another, mimicking the natural depth of a physical landscape.

---

## 2. Color & Surface Philosophy
The palette centers on deep, authoritative blues (`primary`) balanced by the warmth of coral (`secondary`) and amber (`tertiary`).

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited.** To define sections, use background shifts rather than lines.
- Use `surface_container_low` for the base page background.
- Use `surface_container_lowest` for cards to create a "lifted" feel.
- Use `surface_container_high` for inset elements like search bars.

### Glass & Gradient Implementation
To move beyond a flat UI, floating elements (like a map-pinned "Arrived" modal) must use **Glassmorphism**:
- **Background:** `surface` at 70% opacity.
- **Effect:** `backdrop-blur: 20px`.
- **Signature Texture:** Primary CTAs should utilize a subtle linear gradient from `primary` to `primary_container` at a 135-degree angle to provide "visual soul."

---

## 3. Typography: The Editorial Voice
We use a dual-font strategy to balance character with high-utility legibility.

*   **Display & Headlines (Manrope):** A modern geometric sans-serif that feels architectural and authoritative. 
    *   *Role:* Used for location names and time displays.
    *   *Usage:* Use `display-lg` for active alarm times to create a bold, "unmissable" focal point.
*   **Body & Titles (Plus Jakarta Sans):** A friendly, highly legible face with open counters.
    *   *Role:* Used for status updates, settings, and navigation.
    *   *Usage:* `title-md` for list headers to provide a clear, soft hierarchy.

---

## 4. Elevation & Tonal Layering
Traditional shadows are often "muddy." In this system, depth is achieved through **Tonal Layering**.

*   **The Layering Principle:** Place a `surface_container_lowest` card on top of a `surface_container` background. The subtle shift in lightness creates a sophisticated "paper-on-table" effect.
*   **Ambient Shadows:** For "Active" states or floating action buttons, use an extra-diffused shadow:
    *   *Color:* `on_surface` at 6% opacity.
    *   *Blur:* `24px`.
    *   *Y-Offset:* `8px`.
*   **The Ghost Border:** If an element (like an inactive input) risks disappearing, use `outline_variant` at **15% opacity**. Never use 100% opacity for structural lines.

---

## 5. Component Guidelines

### Buttons (The "Soft-Tactile" Interaction)
*   **Primary:** Gradient of `primary` to `primary_container`. Shape: `full` (pill-shaped). Typography: `title-sm`.
*   **Secondary:** `secondary_fixed` background with `on_secondary_fixed` text. Used for "Snooze" or non-critical alerts.
*   **Tertiary:** No background. `primary` text. Used for "Cancel" or "Edit."

### Cards & Lists (The "Breathable" Layout)
*   **Rule:** Forbid the use of divider lines.
*   **Spacing:** Separate list items using the `4` (1rem) spacing token.
*   **Logic:** A selected alarm card should transition from `surface_container_lowest` to `primary_fixed` to indicate an active "Set" state.

### Map Elements & Overlays
*   **Markers:** Use a `secondary` (Coral) circle with a `primary` (Blue) pulse animation for the current destination.
*   **Overlays:** Use `xl` (1.5rem) rounded corners for all map-based bottom sheets to emphasize the "friendly" brand personality.

### Input Fields
*   **Default:** `surface_container_highest` background, no border, `md` (0.75rem) corner radius.
*   **Active:** A subtle "Ghost Border" of `primary` at 20% opacity.

---

## 6. Do’s and Don'ts

### Do
*   **DO** use whitespace as a separator. If you feel two elements are too close, increase the spacing token rather than adding a line.
*   **DO** use `secondary` (Coral) for immediate location alerts and `tertiary` (Amber) for "entering proximity" warnings.
*   **DO** ensure `display` typography has enough breathing room (at least `8` or 2rem) from the screen edge.

### Don’t
*   **DON'T** use pure black `#000000` for shadows or text. Always use the `on_surface` or `on_background` tokens.
*   **DON'T** use "Standard" 4px or 8px corners. Stick to the `md` (12px) and `xl` (24px) scale to maintain the premium, friendly feel.
*   **DON'T** clutter the map view. Use the `surface` token with backdrop blurs for map controls to keep the underlying geography visible.
# GEORGIA Alpha 1.10 — Icon Alignment

- The original GEORGIA emblem is kept: dark teal background, gold double ring, Georgian flag, fortress, and GEORGIA title.
- Fortress battlements and backing stone are shifted precisely 27 px to the right in the original 1024 px artwork, matching the flag's horizontal centerline (512 px).
- Android launcher icons (all densities and adaptive foregrounds), splash images, favicon, Play Store 512x512 icon and 1024x500 feature graphic have been regenerated.
- The game code and saved-game system are unchanged.
- Android package com.piraligame.georgia; versionCode 5, versionName 1.0.10; same signature as the 1.09 Release.
- PIRALI Game ownership/support and PIRALI repository are unchanged.
- AAB still needs manual submission to Play Console for store review and closed testing.

## Joystick — restored PIRALI-style control
- Removed the needless left/right-hand selection buttons from the menu and pause.
- Floating joystick now starts at the touch point across the lower 50% of the gameplay canvas, not from a fixed pad.
- Touching the upper half never activates the joystick. UI buttons remain separate from the canvas.
- Direction follows dragging; releasing or canceling the pointer stops the hero immediately.

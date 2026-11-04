# GEORGIA project structure — PIRALI Game approach
GEORGIA is an entirely separate repository from PIRALI. PIRALI files remain unchanged.

The index.html contains the interface only. Generated main.js holds the Player game, while a separate dev-main.js is used for internal browser QA; dev code is never packaged in Android.

Authored sources under src/game:
00-scene-environment.js — scene, rendering, geometry and environment
10-characters-animation.js — complete 3D characters and animation
20-castle-defense.js — castle, walls, towers and defensive structures
30-economy-village.js — workshop, farm, barracks and economy
40-game-state-controls.js — state, one-hand settings and mobile lifecycle
50-chapters-enemies-siege.js — factions, chapters, structure-targeting AI
60-checkpoints-pause.js — autosaving, recovery and pause
70-building-sites.js — build sites and context interaction
80-allied-army-villagers.js — village NPCs and friendly troops
90-battle-rewards-skills.js — rewards and abilities
91-ui-hud.js — main HUD and labels
92-enemy-models-combat.js — enemy generation and damage
93-weapons-construction.js — weapons and construction
94-update-render-loop.js — update, combat simulation and renderer
95-joystick-touch-input.js — dedicated thumb zone, left/right layout, controls
99-developer-only.js — internal testing, excluded from the Player build

Authored styles under src/styles:
00-base-hud.css; 10-language-ui.css; 20-thumb-controls.css; 30-pirali-game-brand.css

Independent audio.js, language resources i18n-en.json/i18n.js and store assets are retained.

Build:
1. npm install
2. python scripts/build_game.py
3. node --check main.js
4. python prepare-android.py
5. npx cap sync android
6. cd android
7. gradlew.bat assembleRelease bundleRelease --no-daemon

The original code is in src/game and src/styles. Both main.js and style.css are generated for deployment. To update the game, edit modules and rerun the builder. Android keys remain private, outside GitHub.

Release 1.09:
- com.piraligame.georgia / versionCode 4 / versionName 1.0.9
- Same upload signing identity as 1.08 Release, which enables in-place upgrades when no other Android restriction applies.
- The older 1.06 Debug APK was signed differently, so a one-time reinstall from that variant is unavoidable.
- The signed AAB still needs to be submitted to Play Console and its Closed Testing setup completed. Do not assert public publication until confirmed.

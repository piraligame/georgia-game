# GEORGIA — სამეფოს დაცვა 🇬🇪

**Alpha 0.3** · original low-poly isometric 3D browser game: an archer defends a Georgian castle, collects coins and builds an upgradable fortress.

🎮 **Player**: https://piraligame.github.io/georgia-game/

🛠️ **Developer**: https://piraligame.github.io/georgia-game/developer.html

The GEORGIA repository is independent from PIRALI; PIRALI files are not modified.

## Alpha 0.3 — changes

- **Dynamic floating joystick**, inspired by PIRALI: touch anywhere on the open lower game area below the construction panel; it appears directly under the finger, moves the hero, and disappears when released
- Construction panel is **raised further** to avoid accidental touches and improve usable thumb space on narrow screens
- Redesigned hero bow with low-poly sculpted bow limbs, **animated string pull and release**, articulated shoulders and hands, animated nocked arrow and visible flying arrows
- Defending archers on towers now animate, aim, and shoot; bow damage and tower reload time improve with upgrades
- **18 predefined construction pads** remain available: 14 walls and 4 archer towers
- **Independent building upgrades, levels 1–4**: tap the structure or build on a pad to select it, see the upgrade cost on a floating world label and in a bottom upgrade panel; upgrades cost coins and add HP, damage/firepower or visible decoration
- **Faster, denser enemy waves** approaching in several lanes; raiders, armored soldiers, and an enemy captain each fourth wave
- **Castle integrity and wave objective HUD**, useful wave bonuses, coin rewards depending on enemy type and gentle coin magnet effect
- Added blue-roofed village houses, flower patches and hero marker while retaining the original low-poly art style
- Player and Developer versions share the same game logic; Developer includes test currencies, invulnerability, skipping waves and quickly constructing all buildings

## Controls

**Phone:** touch the empty area **below** the build panel and drag for movement. Joystick appears only while touching. Tap a highlighted building site then use the wall/tower button. Tap an existing building and use the new **⬆️ გააძლიერე** button with its coin cost. Separate dash and healing actions remain at the bottom right.

**PC:** WASD/arrows to move; Q builds nearest wall, E builds nearest tower; F upgrades the selected structure; R upgrades the hero; Space dashes.

## Local testing

From this directory:

```sh
python -m http.server 8765
```

Player: `http://localhost:8765/`

Developer: `http://localhost:8765/developer.html`

Loads Three.js from a CDN. Internet connection is needed. This is still a browser prototype, not a native Android/Unity project.

## Roadmap

More building types, more strategic wave events, villagers and resource gathering, better 3D animations and an eventual independent Unity Android game.

© GEORGIA prototype.

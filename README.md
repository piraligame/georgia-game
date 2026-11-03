# GEORGIA — სამეფოს დაცვა 🇬🇪

**Alpha 0.2** • Independent, playable low-poly 3D survival and fortress-building game.

🎮 [Play online](https://piraligame.github.io/georgia-game/) • 🛠️ [Developer version](https://piraligame.github.io/georgia-game/developer.html)

GEORGIA is a **separate game project**. It does not modify or depend on PIRALI.

## What's new in Alpha 0.2

- Georgian flag on the start screen and a five-cross Georgian flag flying above the fortress
- The hero now carries a **bow, quiver, and arrows**; the hero and archery towers shoot visible 3D arrows
- **18 predefined building sites** around the castle: 14 wall sections and 4 archer towers
- Approach a glowing site (or tap it) and press the corresponding construction button
- Each finished wall forms part of the castle defense; enemy attacks can destroy structures, freeing the site for rebuilding
- Enemies pursue the hero when nearby, otherwise they assault the fortress
- New **fortress durability** meter, castle defeat condition and wave-survival bonuses
- More effective automatic aiming, archer towers, visible construction effects
- Improved touch UI with build controls moved higher, away from the joystick
- Both Player and Developer versions updated; corrected Georgian text encoding

## Gameplay

One playable hero defends the Georgian fortress from waves of enemies. Fight with a bow, collect dropped coins, place defenses on marked locations, improve the hero, and survive increasingly difficult waves.

**Controls (PC):** WASD / arrows — movement; **Q** — wall; **E** — archer tower; **R** — upgrade; **Space** — dash.

**Controls (Android/mobile):** left joystick, building buttons, dash and healing. Touch a glowing building marker to select the desired spot.

**Developer page:** +1000 coins, immortality, next wave, full health.

## Local preview

Start a server in this folder:

```sh
python -m http.server 8765
```

Open `http://localhost:8765` (Player) or `http://localhost:8765/developer.html` (Developer).

Three.js loads via CDN; an internet connection is required for the first page load. The project is a browser prototype, **not** a native Unity/Android package yet.

## Roadmap

- More detailed bow and combat animations
- Villagers and resource-gathering
- Defense upgrade trees and a gate
- More enemy types, bosses, and long-term progression
- Separate Unity 3D Android build

© GEORGIA prototype.

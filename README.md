# Sky Courier 🛩️📦

A retro-arcade flight delivery browser game built for [start.ng](https://start.ng).

Take flight in your custom steam-glider, collect floating airmail parcels, and swoop into glowing Sky Post hubs across floating skylines while dodging storm clouds and rogue drones!

---

## 🌟 start.ng Integration Features

- **Character Rule**: Dynamically draws the player's start.ng character in the pilot cockpit (rendered from `style`: body, hair, hat, accessories, and colors) with wind-flutter animations.
- **Player Profile Card**: Shows character face thumbnail, pilot name, and `@account` handle with quick sign-in.
- **Global Leaderboard (`startng.json`)**:
  - `distance`: Distance flown in meters
  - `parcels`: Total parcels delivered to hubs
  - `coins`: Gold coins collected
- **Seamless Communication**: Talks to `https://start.ng/connect` via `postMessage` (and falls back to HTTP API / local test mode).
- **Audio Engine**: 100% Web Audio API synthesized retro sound effects and background music (no external `.mp3` files needed).
- **Cover Image**: Crisp 1600 × 1000 (16:10 aspect ratio) `cover.png` ready for start.ng cards.

---

## 🕹️ Controls

- **Desktop**:
  - **Thrust Up**: `Space` / `↑` / `W` / Left Click
  - **Turbo Boost**: `→` / `D` / `Left Shift`
  - **Dive / Descent**: `↓` / `S`
  - **Airbrake**: `←` / `A`
- **Mobile / Touch**:
  - On-screen touch buttons for **Thrust Up** (▲) and **Turbo** (⚡), or tap anywhere to fly.

---

## 🚀 How to Publish to start.ng

1. Push this repository to a **public GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Sky Courier"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sky-courier
   git push -u origin main
   ```

2. Run a pre-publish check via the start.ng API:
   ```bash
   curl -X POST https://api.start.ng/games/check \
     -H "Content-Type: application/json" \
     -d '{"repo_url": "https://github.com/<your-username>/sky-courier", "name": "sky-courier"}'
   ```

3. Publish:
   ```bash
   curl -X POST https://api.start.ng/games/publish \
     -H "Content-Type: application/json" \
     -d '{"repo_url": "https://github.com/<your-username>/sky-courier", "name": "sky-courier"}'
   ```

4. Open the returned `approve_url` once in your browser to sign in to your start.ng account and claim your game at `https://sky-courier.start.ng`!

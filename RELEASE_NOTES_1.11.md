# GEORGIA Alpha 1.11 — Android Audio Stability Candidate

- Keeps the same Android package, keystore and signed release certificate as the Alpha 1.10 Play test.
- Increases versionCode from 5 to 6, versionName 1.0.11, target SDK 36.
- Limits simultaneous procedural Web Audio voices separately for music and sound effects.
- Debounces repeated hit, coin, build, arrow and damage effects during large battles.
- Skips overdue music notes rather than issuing bursts when the render thread stalls.
- Changes audio latency hint to playback to prioritize a stable buffer in Android WebView.
- Retains save progression, player-only packaging, joystick controls, and bilingual UI.
- This addresses the reported foldable phone regression but requires device testing on Samsung Z Fold 7 to confirm.
- GEORGIA files only; PIRALI files are unchanged.

# OFA Engine video playback

The engine uses the complete video supplied as
`C:\Users\jaiva\Downloads\WhatsApp Video 2026-11-23 at 12.22.46.mp4`.
`public/media/ofa-engine-heart-loop.mp4` copies its H.264 video stream without
re-encoding, trimming frames, changing speed, or replacing its motion. Audio
is removed and the MP4 metadata is moved to the start for browser playback.
The video stream lasts approximately three seconds at 30 fps.

`public/media/ofa-engine-heart-loop-poster.webp` is a resting frame from 0.8
seconds in the same clip. It fills the player before activation or while media
loads. The static glowing-frame replacement is no longer used by the engine.

Activation plays the native HTML video at `playbackRate = 1`, with `loop`,
`muted`, and `playsInline`. The complete clip repeats until the user switches
off. There are no CSS contractions, brightness/saturation animation, synthetic
heartbeat frames, or scripted seeks. Native playback also continues across the
initializing-to-active state change without replacing the video element.

Switching off pauses immediately and keeps the last decoded frame fully
visible, including the navigation icon. Reactivation resumes the same player.
The existing controller still owns the timed startup and power-down status,
disabled transition controls, navigation state, and cancellation on reset.
Offscreen or hidden players pause and resume when visible and still enabled.
An explicit activation plays the video even with reduced motion; that setting
continues to disable the surrounding startup screen movement.

The main viewport crops the source's letterboxing without changing its frame
sequence. Navigation media additionally uses an SVG white-background key.
Home and e-brain marks use the same supplied artwork with their paper
backgrounds keyed out and their silhouettes colored to match the theme.
Icon containers, selected links, hover links, and auxiliary navigation controls
have transparent backgrounds. Selection is indicated by a narrow line.

`tests/arc-reactor.spec.ts` checks repeated full-length loops at native speed,
an immediately paused and visible off state, reactivation, navigation, queued
clicks, late media, and reset cancellation. `tests/navigation.spec.ts` checks
icon-only navigation, hover/focus labels, bare artwork in all themes, and the
mobile navigation drawer.

Model/API activation remains a local preview. The `/arc-reactor` route is
retained for compatibility.

# OFA Engine activation and shutdown

The OFA Engine uses the supplied `WhatsApp Video 2026-11-20 at 07.05.47.mp4`
animation. The video is remuxed without audio, preserving its original video
stream and color. Its app assets are:

- `public/media/ofa-engine-heart.mp4`
- `public/media/ofa-engine-heart-poster.webp`

The main visual uses a responsive 4:5 viewport and retains the supplied colors.
The poster matches the new
footage; the previous reactor animation is no longer displayed. Media layers
stay mounted in a fixed footprint and become completely invisible at idle.

The provider owns `idle -> activating -> active -> deactivating -> idle`. The heart,
text action, and sidebar power control share the controller. Controls are
disabled during transitions, and queued clicks cannot overlap or reverse a
sequence. Navigation preserves the state; resetting local demo data cancels it.

| State | Timing | Behavior |
| --- | --- | --- |
| Activating | 3500 ms | The heart gradually appears. Screen shake follows the same heartbeat clock, fades over the final 500 ms, and ends with startup. |
| Active | Until deactivation | The heart keeps pumping at normal playback speed. The screen stays still. |
| Deactivating | 4200 ms | An integrated easing curve slows the heartbeat clock from full speed to zero. The video and CSS pump slow together; visual layers fade during the final 1800 ms. The screen stays still. |
| Idle | Until activation | All heart layers are invisible and the video is paused. |

The supplied introduction plays once from 0 to 7.292 seconds. Playback then repeats
only the glowing heart segment from 5.5 to 7.292 seconds. Measured footage peaks
provide the shared pump clock in `src/lib/reactor-beat.ts`, keeping startup
translations synchronized with the heart. Header, content, sidebar, and mobile
navigation move together during startup only.

Shutdown preserves the current beat phase. Its integrated speed curve spaces
out contractions progressively rather than stopping immediately. Chromium's
minimum supported playback rate is 0.0625; the final fade conceals that playback
floor while the shared clock reaches zero, then idle pauses the video.

Reduced motion uses 180 ms opacity feedback with paused video and no pumping,
shake, or ripple. Preference changes are observed live. Hidden or offscreen
media pauses and rejoins the shared clock when visible. Late decoded frames
have a readiness fade. Frame updates write local style variables without
rendering React every frame; timers, frames, observers, and listeners are
cleaned up.

`tests/arc-reactor.spec.ts` covers naming and media, startup synchronization,
active pumping without screen shake, gradual shutdown, repeated clicks, delayed
media, navigation, reset cancellation, and reduced-motion behavior. Test and
build results should be recorded from the current validation run.

Activation remains a local preview. Model and API connections remain backend
work. The existing document filename and `/arc-reactor` route are retained for
compatibility.

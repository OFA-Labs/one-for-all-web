# Smooth motion and space-black revision

## Requested changes

1. Make the supplied sculpture animation much smoother.
2. Make its motion a little faster.
3. Remove the technology-pattern background and use plain dark space black throughout the website.

## Motion treatment

The original recording is labelled 30 fps but contains repeated images. The earliest section has roughly 7.5 distinct geometry updates per second; a later section has about 15–16. Raising the container frame rate alone would retain those visible holds.

The new preparation pipeline selects the cleaner later section, removes recording duplicates while preserving their timestamps, applies a **1.25× speed increase**, then generates missing motion steps using motion-compensated interpolation to **60 fps**. Processing happens at source resolution before the 4K and 1080p exports. This keeps browser playback at 1× rather than making a 30 fps file drop frames through a playback-rate change.

The loop's duplicated turnaround frames are trimmed. The idle poster matches the first frame of the new motion sequence. A source-resolution intermediate was checked for frame changes: all 186 adjacent forward frames differed, with no near-duplicate holds. The original source is not native 60 fps or native 4K; the added frames are synthetic interpolation.

Both final streams are silent H.264/60 fps with faststart. Desktop keeps the 3840×2160 master. Viewports at or below 900px use the lighter 1920×1080 stream, reducing unnecessary decode work at the displayed animation size. Public video and poster URLs are versioned so browsers do not reuse the old 30 fps media cache.

Tap-to-play, pause/resume, off-screen pausing, hidden-tab pausing and a motion-free idle remain. No microphone or live voice service is opened. `scripts/process-video.py` reproduces the media treatment; `VIDEO_ASSET.md` and the asset manifest describe the exact final filters, durations and files.

## Plain background

The former SVG was deleted. The stylesheet contains no pattern token, background image URL or decorative gradient. Canvas, sidebar, header, footer and mobile navigation use **#030407**. Panels and dialogs use subtle **#090C12** surfaces to retain readable boundaries. The sculpture blends into its surroundings without a black rectangular container.

## Verification

Production build, TypeScript and ESLint are checked. Browser tests cover playback/pause, decoded desktop and mobile dimensions, manifest frame rate/speed, plain backgrounds across routes, responsive layouts, existing journeys and accessibility. `scripts/review-motion.mjs` records local Chromium playback frame statistics; these measurements describe this machine rather than guaranteeing performance on every device.

Current screenshots are in `docs/screenshots`. The website remains a frontend-only local product preview.

### Final results

- Production build, strict TypeScript and ESLint passed. All **26 browser/domain tests passed**.
- Automated accessibility scan found no violations on the initial product routes. Responsive layout checks passed at375/768/1024/1440CSS pixels.
- Local Chromium playback sample: desktop4K presented about58.8fps; narrow-screen1080p about57.2fps, with **zero dropped video frames** in both2.5-second samples. Each stream advanced150video frames. These are local measurements, not a hardware-independent guarantee.
- Both final media files fully decoded with no errors. The6.167-second loop has370frames, with no identical adjacent frames or near-static frame pairs in the recorded check.
- Reviewed screenshots show the plain space-black canvas and unboxed video. The old backgroundSVG is deleted.

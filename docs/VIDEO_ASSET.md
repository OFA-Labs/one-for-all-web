# ONE FOR ALL smooth video asset

The website visual uses the supplied `Screen Recording 2026-11-15 160400.mp4`. The source remains untouched.

## Why the first export looked choppy

The screen recording is labelled **30 fps**, but its actual content updates at a lower, variable cadence. A nine-second sample has 270 container frames but only about 127 distinct image states. Its opening seconds hold the same geometry for roughly four frames at a time (about 7.5 effective updates/second); later sections provide about 15?16 distinct states/second. Merely setting a 60 fps output rate would duplicate the same holds.

The previous four-second segment was exported forward/reverse at 30 fps, including duplicated endpoint frames. It therefore preserved the recorded stutter and briefly held each reversal.

## Current treatment

1. Select **source t3.0?7.0**, avoiding the lowest-cadence opening and the recorded restart near the end.
2. Mask only the recorded player controls in the bottom corners. Preserve the complete central sculpture and crop excess side black to 1152?1152 at x42/y0.
3. Apply restrained denoising, a small contrast/saturation adjustment, and **remove near-duplicate screen-recording frames** with `mpdecimate`, retaining their original presentation times.
4. Bake **1.25? speed** into the timestamps. Browser playback rate stays at 1.0, preserving the encoded 60 frames per displayed second rather than speeding up a 60 fps file and dropping frames.
5. Create new intermediate frames at **60 fps** using motion-compensated interpolation at source resolution: adaptive overlapped block compensation, bidirectional estimation and variable-size blocks. This is genuine temporal interpolation, not frame duplication. Compared with simple blending, this retains crisper moving highlights and avoids most double-image ghosting.
6. Build a forward/reverse loop **excluding duplicated endpoint frames**. There is no extra held frame at either turn or the loop boundary. The shape moves continuously in both directions; no hard cut or whole-image crossfade is used.
7. Lanczos upscale with mild sharpening and encode H.264/yuv420p/faststart at 60 fps. Export a 3840?2160 master and a lighter 1920?1080 version. Both preserve the centered square sculpture on a black 16:9 canvas; the UI trims the side padding with its square stage.
8. Generate the idle poster from the final interpolated clip's first frame, so clicking to start does not switch to an unrelated shape. Remove all audio.

## Quality boundary

The source is **1194?1152, nominally 30 fps, 12.13 seconds**, already compressed and with variable effective motion cadence. Motion interpolation synthesizes temporal steps and upscaling improves presentation; neither recovers lost native image detail. The 3840?2160 file is an **upscale**, not native 4K or an AI super-resolution result. Fine liquid highlights can still inherit compression/optical-flow limitations from the source. A new high-frame-rate render from the original 3D animation would be required for truly native detail and motion.

## Files

- `public/media/one-for-all-4k.mp4`: 3840?2160, H.264, **60 fps**, CRF18, silent.
- `public/media/one-for-all-1080p.mp4`: 1920?1080, H.264, **60 fps**, CRF19, silent; preferable for narrow screens and lighter decoding.
- `public/media/one-for-all-poster.webp`: 2160?2160 first-frame still.
- `public/media/one-for-all-captions.vtt`: silent visual description.
- `public/media/asset-manifest.json`: exact duration, frame count, speed, file sizes, source cadence and interpolation settings.
- `.cache/media-review/`: non-public comparison candidates and source-resolution interpolation intermediate.

## Verification

Both final MP4s are fully decoded with FFmpeg before publishing. Frame cadence is checked from decoded frames; source geometry holds are removed rather than simply renamed as 60 fps. The motion-compensated candidate was compared with a blended candidate using adjacent-frame contact sheets and temporal differences. Final metadata and frame statistics are recorded in `asset-manifest.json`.

## Reproduce

The media tool is local `imageio-ffmpeg==0.8.1` in `.venv`, bundling FFmpeg 9.0.2 for Windows. No global installation is needed.

```powershell
.\.venv\Scripts\python.exe -m pip install imageio-ffmpeg==0.8.1
.\.venv\Scripts\python.exe scripts/process-video.py
```

Playback starts only after a user gesture and exposes a pause control. Hidden or off-screen animation is paused. No microphone or speech integration is enabled by this asset.

Final export verification: **370 frames / 60 fps = 6.1667 seconds**. The 4K file is 21.11 MB and the 1080p file 7.23 MB. Decoded 1080p motion check found **zero identical adjacent frames and zero near-static pairs** (64px grayscale delta below 0.1); median adjacent delta 2.63, minimum 1.26. Both files fully decode without errors.

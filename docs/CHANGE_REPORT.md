# ONE FOR ALL — visual refresh

16 November 2026 · Asia/Kolkata. This report supersedes the first build's light-theme/orb presentation notes. The frontend-only integration boundary remains unchanged.

## 1. Product rename

- Product, UI wordmark, page metadata, notifications, transcripts, sample domains, package name, local preference key, contracts, specifications and authored documentation now use **ONE FOR ALL**.
- Project folder is now `C:/Users/jaiva/OneDrive/Desktop/voice-agents/one-for-all-web`.
- Package: `one-for-all-web`. Preferences key: `one-for-all-preview-preferences`. Existing preferences under the previous key are not migrated.
- Original `spec_ite1.md` and its project copy were updated for the explicitly requested rebrand. The source video remains untouched.
- The Python virtual environment was recreated at the new path so its activation and pip executables point to the correct folder. `imageio-ffmpeg==0.8.1` is installed locally. The prior tool environment is preserved outside the codebase as `.previous-media-venv`; no project source remains in the previous application folder.

## 2. Video replaces the CSS orb

The website uses the supplied `Screen Recording 2026-11-15 160400.mp4`. The former CSS sphere is removed from the assistant, Reader and account illustration.

- **Tap to talk starts the video immediately**, without opening an integration modal. The control becomes **Pause animation** and can pause/resume the loop.
- Playback is silent and starts only after user interaction. The microphone is not opened. A separate **Voice integration details** control explains the future live-voice integration.
- The animation pauses when the page is hidden or its video goes off-screen. Initial/reduced-motion presentation stays still until explicitly started.
- Idle poster is a locally bundled 2160×2160 WebP. MP4 uses `preload="none"`, H.264, faststart, muted loop and inline playback. A square stage crops only the 16:9 master’s black side padding; screen blending removes the black rectangle from the page.
- Source was 1194×1152, 30fps, 12.13 seconds. Player controls were removed from the bottom corners. Restrained denoising, mild contrast/saturation, Lanczos upscaling and sharpening improve presentation. A four-second forward/reverse segment makes a continuous eight-second loop.
- **3840×2160 export:** `public/media/one-for-all-4k.mp4`, approximately 16.69 MB. A 1920×1080 fallback asset is also included, approximately 5.55 MB.

**Quality limit:** the export has real 4K dimensions, but it is an upscale of compressed source footage. It does not recover missing detail or become native 4K. No AI super-resolution or lossless-quality claim is made. See `VIDEO_ASSET.md` for exact treatment and reproducible commands.

## 3. Background and dark theme

- Recreated the supplied charcoal technology-doodle reference as `public/backgrounds/ofa-tech-pattern.svg`, with faint chips, robots, clouds, code windows, rockets, circuits, gears and OFA marks.
- The reference appeared inline in the conversation; an original raster file was not available locally. The SVG is a faithful interpretation, not a claim to use the exact original pixels.
- Shared canvas is #111111. Navigation, panels, tables, dialogs, forms, authentication, Reader, settings, extension mockup and mobile navigation all use dark surfaces and readable off-white text. Mint actions, focus rings, status words and warning/error states remain distinguishable.
- Background repeats across every route and appears subtly through navigation and panels. Font assets, videos and pattern are local; no new external runtime service is used.

## Verification

- Production build, strict TypeScript and ESLint checks passed.
- Main suite: **24 tests passed**, including actual video playhead progression, 3840×2160 decoded dimensions, muted playback, pause and no initial autoplay.
- Automated accessibility: no detected WCAG A/AA axe violations across all 17 initial screen routes.
- Responsive checks passed at 375, 768, 1024 and 1440 CSS pixels; the new pattern is present across checked routes.
- Supplemental review passed for approvals, mobile integration dialogs, partial selections, history navigation, owner screens, saved preferences/reset and landscape Reader.
- New screenshots are under `docs/screenshots`. Reviewed desktop/mobile assistant and approval views, tablet Reader and owner lab.
- Case-insensitive search of authored source, docs, scripts, tests, design files and package metadata finds no previous product-name text. Third-party/generated dependency and build artifacts are outside that source check.

## Run

```powershell
cd C:\Users\jaiva\OneDrive\Desktop\voice-agents\one-for-all-web
npm run dev
```

Local preview: http://127.0.0.1:3000. If a production preview is already running there, use it or stop it before starting another server on the same port. No credentials are needed. Real voice, AI, authentication, browser automation and external integrations remain outside this frontend-only revision.

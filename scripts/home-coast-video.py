"""Build a stable, cyclic homepage coast video without generating new detail.

Run with the system Python (OpenCV, NumPy, Pillow). FFmpeg is bundled in .venv.
The 720p source is enhanced/upscaled, not a native 4K recording.
"""
from __future__ import annotations

import json
import statistics
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT.parent / "TheSnapInsta.to_instagram_720p_hd.mp4"
MEDIA = PROJECT / "public" / "media"
QA = PROJECT / "artifacts" / "home-video"
FFMPEG = PROJECT / ".venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe"
FPS = 30
OVERLAP = 30
CROP = (60, 34, 1200, 675)


def run(arguments: list[str]) -> None:
    subprocess.run([str(FFMPEG), "-y", "-hide_banner", "-loglevel", "warning", *arguments], check=True)


def main() -> None:
    QA.mkdir(parents=True, exist_ok=True)
    MEDIA.mkdir(parents=True, exist_ok=True)
    capture = cv2.VideoCapture(str(SOURCE))
    count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    source_fps = capture.get(cv2.CAP_PROP_FPS)
    width, height = int(capture.get(3)), int(capture.get(4))
    assert source_fps == FPS and count > OVERLAP * 3
    capture.set(cv2.CAP_PROP_POS_FRAMES, OVERLAP)
    ok, reference = capture.read()
    assert ok
    sift = cv2.SIFT_create(nfeatures=1000)
    matcher = cv2.BFMatcher()
    reference_keys, reference_descriptors = sift.detectAndCompute(
        cv2.cvtColor(reference[:270], cv2.COLOR_BGR2GRAY), None
    )
    capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
    stage = QA / "home-native-cyclic.mkv"
    x, y, crop_width, crop_height = CROP
    encoder = subprocess.Popen([
        str(FFMPEG), "-y", "-hide_banner", "-loglevel", "warning",
        "-f", "rawvideo", "-pixel_format", "bgr24", "-video_size", f"{crop_width}x{crop_height}",
        "-framerate", str(FPS), "-i", "-", "-an", "-c:v", "ffv1", "-level", "3",
        "-pix_fmt", "yuv444p", "-threads", "2", str(stage)
    ], stdin=subprocess.PIPE)
    first_frames: list[np.ndarray] = []
    transforms = []
    samples = []
    selected = {}
    for index in range(count):
        ok, frame = capture.read()
        assert ok, f"Source decode failed at {index}"
        keys, descriptors = sift.detectAndCompute(cv2.cvtColor(frame[:270], cv2.COLOR_BGR2GRAY), None)
        matches = matcher.knnMatch(descriptors, reference_descriptors, k=2)
        good = [a for a, b in matches if a.distance < 0.72 * b.distance]
        origin = np.float32([keys[m.queryIdx].pt for m in good])
        destination = np.float32([reference_keys[m.trainIdx].pt for m in good])
        transform, inliers = cv2.estimateAffinePartial2D(
            origin, destination, method=cv2.RANSAC, ransacReprojThreshold=2
        )
        assert transform is not None and int(inliers.sum()) > 50, f"Unreliable registration at {index}"
        transforms.append(transform.tolist())
        stable = cv2.warpAffine(frame, transform, (width, height), flags=cv2.INTER_LANCZOS4,
                                borderMode=cv2.BORDER_REPLICATE)[y:y+crop_height, x:x+crop_width]
        stable = np.ascontiguousarray(stable)
        if index < OVERLAP:
            first_frames.append(stable.copy())
            continue
        if index >= count - OVERLAP:
            offset = index - (count - OVERLAP)
            fraction = offset / (OVERLAP - 1)
            weight = fraction * fraction * (3 - 2 * fraction)
            stable = cv2.addWeighted(stable, 1 - weight, first_frames[offset], weight, 0)
        assert encoder.stdin is not None
        encoder.stdin.write(stable.tobytes())
        output_index = index - OVERLAP
        samples.append(cv2.resize(stable, (96, 54), interpolation=cv2.INTER_AREA).astype(np.float32))
        if output_index in [0, 150, 295, 302, 310, 318, 324]:
            selected[output_index] = stable.copy()
        if index % 60 == 0:
            print(f"Registered {index}/{count} source frames", flush=True)
    capture.release()
    assert encoder.stdin is not None
    encoder.stdin.close()
    assert encoder.wait() == 0
    print("Stable cyclic source master ready", flush=True)

    # Interpolate to a 60 fps cyclic master. Two copies of the head frame let
    # motion estimation see past the seam, so the last frame is the true
    # source-324 -> source-0 midpoint instead of a repeated frame.
    cyclic = QA / "home-native-cyclic-60.mkv"
    interpolation = (
        "[0:v]split=3[base][h1][h2];"
        "[h1]trim=start_frame=0:end_frame=1,setpts=PTS-STARTPTS[first1];"
        "[h2]trim=start_frame=0:end_frame=1,setpts=PTS-STARTPTS[first2];"
        "[base][first1][first2]concat=n=3:v=1:a=0,"
        "hqdn3d=0.2:0.15:0.3:0.2,"
        "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1:scd=none,"
        "trim=end_frame=650,setpts=PTS-STARTPTS[v]"
    )
    run(["-i", str(stage), "-filter_complex", interpolation, "-map", "[v]", "-an",
         "-c:v", "ffv1", "-level", "3", "-pix_fmt", "yuv444p", "-threads", "4", str(cyclic)])
    print("Cyclic 60 fps master ready", flush=True)

    output_frames = 2 * (count - OVERLAP)
    output_fps = 2 * FPS
    render_graph = (
        "scale=3840:2160:flags=lanczos:in_color_matrix=bt601:out_color_matrix=bt709,"
        "cas=0.55,unsharp=5:5:0.55:3:3:0.15,setsar=1[v4k];"
        "[v4k]split=2[big][small];"
        "[small]scale=1920:1080:flags=lanczos[v1080]"
    )
    output_4k = MEDIA / "home-coast-4k.mp4"
    output_hd = MEDIA / "home-coast-1080p.mp4"
    run(["-i", str(cyclic), "-filter_complex", render_graph,
         "-map", "[big]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p", "-threads", "0", "-r", str(output_fps), "-g", "120",
         "-movflags", "+faststart", "-profile:v", "high", "-level", "5.2",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-metadata", "title=ONE FOR ALL coastal homepage loop",
         "-metadata", "comment=Sharply graded 4K60 upscale from 1280x718; not native 4K; no AI detail generation",
         str(output_4k),
         "-map", "[v1080]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-threads", "0", "-r", str(output_fps), "-g", "120",
         "-movflags", "+faststart", "-profile:v", "high", "-level", "4.2",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-metadata", "title=ONE FOR ALL coastal homepage loop 1080p", str(output_hd)])
    outputs = []
    for output, width_out, height_out in [(output_hd, 1920, 1080), (output_4k, 3840, 2160)]:
        run(["-i", str(output), "-map", "0:v:0", "-f", "null", "-"])
        outputs.append({"file": output.name, "width": width_out, "height": height_out,
                        "fps": output_fps, "frames": output_frames, "bytes": output.stat().st_size})
        print(f"Published {output.name} ({output.stat().st_size:,} bytes)", flush=True)

    poster = MEDIA / "home-coast-poster.webp"
    run(["-i", str(cyclic), "-vf",
         "scale=1920:1080:flags=lanczos:in_color_matrix=bt601:out_color_matrix=bt709,"
         "cas=0.45,unsharp=5:5:0.45:3:3:0.15",
         "-frames:v", "1", "-c:v", "libwebp", "-quality", "94", str(poster)])

    # Verify the seam on the interpolated master, not just the 30 fps source.
    capture = cv2.VideoCapture(str(cyclic))
    small_frames = []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        small_frames.append(cv2.resize(frame, (96, 54), interpolation=cv2.INTER_AREA).astype(np.float32))
    capture.release()
    cyclic_small = np.array(small_frames)
    deltas = np.abs(np.diff(cyclic_small, axis=0)).mean(axis=(1, 2, 3))
    boundary = float(np.abs(cyclic_small[-1] - cyclic_small[0]).mean())
    manifest = {
        "source": SOURCE.name, "source_dimensions": [width, height], "source_fps": source_fps,
        "source_frames": count, "source_duration_seconds": count/source_fps,
        "native_4k": False, "output_fps": output_fps,
        "loop_duration_seconds": output_frames / output_fps,
        "loop_frames": output_frames, "loop_overlap_frames": OVERLAP,
        "loop": "Cloud-landmark camera registration; one-second smooth tail/head blend; head duplicated before 30->60 fps interpolation so the final frame is the 324->0 midpoint",
        "interpolation": "ffmpeg minterpolate (mci, aobmc, vsbmc) at source resolution before upscaling",
        "stable_crop_xywh": list(CROP), "audio": "No audio streams",
        "enhancement": "Light temporal denoise, Lanczos resize to 4K, CAS + mild unsharp for crisp edges; original palette/painterly features preserved; no AI-generated detail",
        "outputs": outputs, "poster": poster.name,
        "verification": {"full_decode_errors": 0, "loop_boundary_mae_96px": boundary,
                          "adjacent_mae_96px_median": float(np.median(deltas)),
                          "adjacent_mae_96px_max": float(deltas.max())},
    }
    (MEDIA / "home-coast-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (QA / "registration-transforms.json").write_text(json.dumps(transforms), encoding="utf-8")
    # A source-resolution sheet makes the horizon's continuity easy to review.
    thumb_width, thumb_height = 384, 216
    sheet = Image.new("RGB", (thumb_width*3, (thumb_height+24)*2), "#222")
    draw = ImageDraw.Draw(sheet)
    for tile, key in enumerate([295, 302, 310, 318, 324, 0]):
        image = Image.fromarray(cv2.cvtColor(selected[key], cv2.COLOR_BGR2RGB)).resize((thumb_width, thumb_height))
        left, top = (tile%3)*thumb_width, (tile//3)*(thumb_height+24)
        sheet.paste(image, (left, top+24))
        draw.text((left+6, top+5), f"Loop frame {key}", fill="white")
    sheet.save(QA / "final-seam-sheet.jpg", quality=96)
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    main()

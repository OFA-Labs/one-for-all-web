"""Build smooth ONE FOR ALL animation assets from the local screen recording.

The recording is nominally 30 fps but repeats image content. De-duplicate before
motion interpolation; simply re-encoding at 60 fps preserves the stutter.
Requires imageio-ffmpeg==0.8.1 in the project .venv. No AI detail recovery.
"""
from __future__ import annotations
import json
import subprocess
import statistics
from pathlib import Path
import imageio_ffmpeg

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT.parent / "Screen Recording 2026-11-15 160400.mp4"
OUT = PROJECT / "public" / "media"
CACHE = PROJECT / ".cache" / "media-review"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
START_SECONDS = 3.0
SOURCE_SECONDS = 4.0
SPEED = 1.25
FPS = 60
CLEAN = (
    "drawbox=x=0:y=1084:w=280:h=68:color=black:t=fill,"
    "drawbox=x=1070:y=1084:w=124:h=68:color=black:t=fill,"
    "crop=1152:1152:42:0,"
    "hqdn3d=0.4:0.4:0.6:0.6,eq=contrast=1.025:saturation=1.025"
)
INTERPOLATE = (
    "mpdecimate=hi=1024:lo=512:frac=0.33,"
    f"setpts=(PTS-STARTPTS)/{SPEED},"
    "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:"
    "me=epzs:mb_size=16:search_param=16:vsbmc=1:scd=none"
)

def run(args: list[str]) -> None:
    subprocess.run([FFMPEG,"-y","-hide_banner","-loglevel","warning",*args],check=True)

def main() -> None:
    OUT.mkdir(parents=True,exist_ok=True)
    CACHE.mkdir(parents=True,exist_ok=True)
    # Do expensive optical flow at source resolution once, never on the 4K upscale.
    master = CACHE / "smooth-forward-60fps.mkv"
    run(["-ss",str(START_SECONDS),"-t",str(SOURCE_SECONDS),"-i",str(SOURCE),
         "-vf",f"{CLEAN},{INTERPOLATE}","-an","-c:v","ffv1","-level","3",str(master)])
    print("Interpolated source-resolution master ready",flush=True)
    # Forward + reverse, with duplicate end frames removed: no held frame at the
    # turn or the video loop boundary. Motion remains continuous in both directions.
    loop = (
        "[0:v]split[forward][backward];"
        "[backward]reverse,trim=start_frame=1,reverse,trim=start_frame=1,reverse,"
        "setpts=PTS-STARTPTS[return];"
        "[forward][return]concat=n=2:v=1:a=0,setpts=N/(60*TB)[loop];"
    )
    for size,canvas_w,name,crf in [(2160,3840,"one-for-all-4k.mp4","18"),(1080,1920,"one-for-all-1080p.mp4","19")]:
        candidate = CACHE / name
        graph=loop+(f"[loop]scale={size}:{size}:flags=lanczos,unsharp=5:5:0.2:3:3:0,"
                    f"pad={canvas_w}:{size}:(ow-iw)/2:0:black,setsar=1[output]")
        run(["-i",str(master),"-filter_complex",graph,"-map","[output]","-an", "-c:v","libx264",
             "-preset","medium","-crf",crf,"-pix_fmt","yuv420p","-r",str(FPS),"-movflags","+faststart",
             "-metadata","title=ONE FOR ALL ? smooth 60 fps animation",
             "-metadata","comment=Screen recording duplicates removed; source-resolution motion interpolation; 1.25x baked speed; upscale, not native 4K",
             str(candidate)])
        # Fully decode before publishing. Existing assets stay usable until ready.
        run(["-i",str(candidate),"-map","0:v:0","-f","null","-"])
        candidate.replace(OUT/name)
        print(f"Published {name}",flush=True)
    run(["-i",str(master),"-vf","scale=2160:2160:flags=lanczos,unsharp=5:5:0.2:3:3:0",
         "-frames:v","1","-c:v","libwebp","-quality","94",str(OUT/"one-for-all-poster.webp")])
    # Count actual encoded frames without depending on a separately installed ffprobe.
    decoded = subprocess.run([FFMPEG,"-hide_banner","-loglevel","error","-i",str(OUT/"one-for-all-1080p.mp4"),
                              "-vf","scale=16:16","-pix_fmt","gray","-f","rawvideo","-"],capture_output=True,check=True).stdout
    frames=len(decoded)//256
    duration=frames/FPS
    (OUT/"one-for-all-captions.vtt").write_text(
        "WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n"
        "An abstract blue-white liquid-light sculpture moves smoothly against black. No speech or sound.\n",encoding="utf-8")
    manifest={
      "source":SOURCE.name,"source_dimensions":[1194,1152],"source_duration_seconds":12.13,"source_fps":30,
      "source_effective_cadence":"Variable screen-recording cadence: first seconds about 7.5 distinct states/sec; selected t3-7 about 15-16 distinct states/sec. In a nine-second sample, 270 container frames reduced to 127 content frames.",
      "source_segment_seconds":[START_SECONDS,START_SECONDS+SOURCE_SECONDS],"output_fps":FPS,"speed_multiplier":SPEED,
      "loop_duration_seconds":duration,"output_frames":frames,
      "interpolation":"mpdecimate preserving timestamps, setpts/1.25, minterpolate MCI with adaptive overlapped blocks, bidirectional estimation, variable-size blocks; performed at 1152-square before upscaling",
      "loop":"Forward/reverse with duplicated endpoints removed, no repeated hold at either turn",
      "cleaning":"Corner control masks; square crop x42/y0/1152; restrained denoise; Lanczos upscale; mild sharpening",
      "audio":"No audio streams; silent visual asset","native_4k":False,
      "outputs":[{"file":"one-for-all-4k.mp4","dimensions":[3840,2160],"fps":FPS},
                 {"file":"one-for-all-1080p.mp4","dimensions":[1920,1080],"fps":FPS},
                 {"file":"one-for-all-poster.webp","dimensions":[2160,2160]}],
      "tool":{"imageio_ffmpeg":imageio_ffmpeg.__version__,"ffmpeg":"9.0.2 bundled Windows executable"}}
    for entry in manifest["outputs"]:entry["bytes"]=(OUT/entry["file"]).stat().st_size
    raw = subprocess.run([FFMPEG,"-hide_banner","-loglevel","error","-i",str(OUT/"one-for-all-1080p.mp4"),
                          "-vf","crop=1080:1080:420:0,scale=64:64","-pix_fmt","gray","-f","rawvideo","-"],
                         capture_output=True,check=True).stdout
    samples = [raw[i:i+4096] for i in range(0,len(raw),4096)]
    deltas = [sum(abs(a-b) for a,b in zip(x,y))/4096 for x,y in zip(samples,samples[1:])]
    manifest["verification"] = {
      "decoded_frames":len(samples),
      "duplicate_adjacent_frames":sum(x==y for x,y in zip(samples,samples[1:])),
      "near_duplicate_pairs_below_0_1":sum(v<0.1 for v in deltas),
      "frame_delta_64px_grayscale_min":min(deltas),
      "frame_delta_64px_grayscale_median":statistics.median(deltas),
      "frame_delta_64px_grayscale_max":max(deltas),
      "loop_boundary_delta":sum(abs(a-b) for a,b in zip(samples[-1],samples[0]))/4096,
      "full_decode_errors":0,
    }
    (OUT/"asset-manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
    print(json.dumps(manifest,indent=2),flush=True)

if __name__=="__main__":main()

"use client";
import { useEffect, useId, useRef } from "react";
import { type ReactorTransition } from "@/lib/reactor/reactor-transition";
import { BackgroundCutout } from "@/components/media/background-cutout";

const HEART_VIDEO = "/media/ofa-engine-heart-loop.mp4";
const HEART_POSTER = "/media/ofa-engine-heart-loop-poster.webp";

/** Play the complete supplied clip at its native speed. Off freezes the frame. */
export function ReactorVisual({
  reactor,
  compact = false,
}: {
  reactor: ReactorTransition;
  compact?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const media = useRef<HTMLVideoElement>(null);
  const cutoutId = useId();

  useEffect(() => {
    const video = media.current;
    return () => video?.pause();
  }, []);

  useEffect(() => {
    const element = root.current;
    const video = media.current;
    if (!element || !video) return;
    let inView = true;
    let disposed = false;
    const powered =
      reactor.phase === "activating" || reactor.phase === "active";

    const sync = () => {
      if (disposed) return;
      // The file supplies every contraction and color change. Never add a CSS
      // pump, change playback speed, or swap in a still while the engine is on.
      video.defaultPlaybackRate = video.playbackRate = 1;
      if (!powered || !inView || document.hidden) {
        video.pause();
        return;
      }
      // Native looping preserves the complete sequence without artificial seeks.
      if (video.paused) {
        void video.play().catch(() => {
          // The matching poster stays visible if media playback is unavailable.
        });
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("canplay", sync);
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("canplay", sync);
    };
  }, [reactor]);

  return (
    <span
      ref={root}
      className={compact ? "reactor-visual is-compact" : "reactor-visual"}
      data-reactor-state={reactor.phase}
      aria-hidden="true"
    >
      {compact && <BackgroundCutout id={cutoutId} />}
      <video
        ref={media}
        className="reactor-core-video"
        src={HEART_VIDEO}
        poster={HEART_POSTER}
        muted
        loop
        playsInline
        preload="metadata"
        style={compact ? { filter: `url(#${cutoutId})` } : undefined}
      />
    </span>
  );
}

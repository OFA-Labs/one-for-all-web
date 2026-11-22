"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const POSTER = "/media/home-coast-poster.webp?v=coast-v2";
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** The loop seam is baked into the media, so playback never swaps elements,
 * seeks on a timer, or fades to a poster when it wraps. */
export function HomeVideo({ active = true }: { active?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let inView = false;
    let disposed = false;
    const sync = () => {
      if (disposed) return;
      if (active && !reducedMotion && inView && !document.hidden) {
        void element.play().catch(() => {
          // The matching still stays visible if autoplay is unavailable.
        });
      } else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    element.addEventListener("loadeddata", sync);
    element.addEventListener("canplay", sync);
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      element.removeEventListener("loadeddata", sync);
      element.removeEventListener("canplay", sync);
      element.pause();
    };
  }, [active, reducedMotion]);

  return (
    <div
      className="home-hero-video"
      data-ready={ready}
      style={{ backgroundImage: `url("${POSTER}")` }}
      aria-hidden="true"
    >
      <video
        ref={video}
        data-testid="ofa-idle-orb"
        autoPlay={active && !reducedMotion}
        muted
        loop
        playsInline
        preload={reducedMotion ? "none" : "auto"}
        poster={POSTER}
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={() => setReady(true)}
        onError={() => setReady(false)}
      >
        <source
          media="(max-width: 900px)"
          src="/media/home-coast-1080p.mp4?v=coast-v2"
          type="video/mp4"
        />
        <source src="/media/home-coast-4k.mp4?v=coast-v2" type="video/mp4" />
      </video>
    </div>
  );
}

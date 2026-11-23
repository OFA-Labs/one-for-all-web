"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const POSTER = "/media/home-gaze-poster.webp?v=gaze-v2";
const motionQuery = "(prefers-reduced-motion: reduce)";
const VIDEO_ASPECT = 16 / 9;
const CROPPED_WIDTH = 1087;
const CROPPED_HEIGHT = 611;
const GAZE_RANGE_X = 40 / CROPPED_WIDTH;
const GAZE_RANGE_Y = 22 / CROPPED_HEIGHT;

function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/** The loop is baked into the media: no element swaps, seeks or poster fades
 * on wrap. The two eyes are rendered above it so they can follow the cursor. */
export function HomeVideo({
  active = true,
  eyesHidden = false,
  orbSlot,
}: {
  active?: boolean;
  eyesHidden?: boolean;
  orbSlot?: ReactNode;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const gazeFrame = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const container = host.current;
    const frame = gazeFrame.current;
    if (!container || !frame) return;
    let gaze = { x: 0, y: 0 };

    // Match object-fit: cover so the eyes stay on the character's face at
    // every viewport size, including the portrait drawer-sized layouts.
    const layout = () => {
      const rect = container.getBoundingClientRect();
      let width = rect.width;
      let height = width / VIDEO_ASPECT;
      if (height < rect.height) {
        height = rect.height;
        width = height * VIDEO_ASPECT;
      }
      const left = (rect.width - width) / 2;
      const top = (rect.height - height) / 2;
      frame.style.left = `${left}px`;
      frame.style.top = `${top}px`;
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      container.style.setProperty("--frame-x", `${left}px`);
      container.style.setProperty("--frame-y", `${top}px`);
      container.style.setProperty("--frame-w", `${width}px`);
      paint(gaze.x, gaze.y, width, height);
    };
    const paint = (x: number, y: number, width: number, height: number) => {
      frame.style.setProperty("--gaze-x", `${x * GAZE_RANGE_X * width}px`);
      frame.style.setProperty("--gaze-y", `${y * GAZE_RANGE_Y * height}px`);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const radius = Math.min(rect.width, rect.height) * 0.32;
      if (!radius) return;
      gaze = {
        x: clamp((event.clientX - (rect.left + rect.width / 2)) / radius),
        y: clamp((event.clientY - (rect.top + rect.height / 2)) / radius),
      };
      paint(gaze.x, gaze.y, frame.offsetWidth, frame.offsetHeight);
    };
    const rest = () => {
      gaze = { x: 0, y: 0 };
      paint(0, 0, frame.offsetWidth, frame.offsetHeight);
    };

    const observer = new ResizeObserver(layout);
    observer.observe(container);
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", rest);
      window.addEventListener("blur", rest);
    }
    layout();
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", rest);
      window.removeEventListener("blur", rest);
    };
  }, [reducedMotion]);

  return (
    <div
      className="home-hero-video"
      ref={host}
      data-ready={ready}
      data-orbiting={eyesHidden}
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
          src="/media/home-gaze-1080p.mp4?v=gaze-v2"
          type="video/mp4"
        />
        <source src="/media/home-gaze-4k.mp4?v=gaze-v2" type="video/mp4" />
      </video>
      <div className="home-hero-gaze" data-ready={ready} ref={gazeFrame}>
        <div className="home-hero-gaze-pair">
          <span className="home-hero-eye" />
          <span className="home-hero-eye" />
        </div>
      </div>
      <div className="home-hero-orb-slot">{orbSlot}</div>
    </div>
  );
}

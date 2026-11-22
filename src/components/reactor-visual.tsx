"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  type ReactorTransition,
  useReactorReducedMotion,
} from "./reactor-transition";
import {
  reactorBeatAt,
  reactorClockAt,
  reactorMediaTime,
  reactorPump,
} from "@/lib/reactor-beat";

const HEART_VIDEO = "/media/ofa-engine-heart.mp4?v=ofa-v1";
const HEART_POSTER = "/media/ofa-engine-heart-poster.webp?v=ofa-v1";
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** The supplied animation stays mounted through startup, pumping and slowdown. */
export function ReactorVisual({
  reactor,
  compact = false,
}: {
  reactor: ReactorTransition;
  compact?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const media = useRef<HTMLVideoElement>(null);
  const mediaReadyAt = useRef<number | null>(null);
  const reducedMotion = useReactorReducedMotion();

  useEffect(() => {
    const video = media.current;
    return () => video?.pause();
  }, []);

  useEffect(() => {
    const element = root.current;
    const video = media.current;
    if (!element || !video) return;
    let frame = 0;
    let inView = true;
    let disposed = false;

    const draw = (now: number) => {
      if (disposed) return;
      frame = 0;
      const elapsed = Math.max(0, now - reactor.startedAt);
      const progress = smooth(elapsed / (reactor.duration || 1));
      let core = 0;
      let environment = 0;
      let flow = 0;
      let presence = 0;
      if (reactor.phase === "active") core = environment = flow = presence = 1;
      if (reactor.phase === "activating") {
        presence = smooth((elapsed - 180) / 1620);
        environment =
          elapsed < 400
            ? Math.sin((elapsed * Math.PI) / 400) * 0.1
            : smooth((elapsed - 400) / 600);
        core = smooth((elapsed - 1000) / 800);
        // Keep the supplied introduction at its original speed. Opacity brings
        // it into view without changing its native heartbeat timing.
        flow = 1;
      }
      if (reactor.phase === "deactivating") {
        // Leave time to see the beat slowing before the final fade to rest.
        core = 1 - smooth((elapsed - (reactor.duration - 1800)) / 1800);
        presence = core;
        environment = flow = 1 - progress;
      }
      // Short opacity-only feedback, including when preference changes mid-sequence.
      if (reducedMotion || (reactor.duration > 0 && reactor.duration < 400)) {
        core =
          flow =
          presence =
            reactor.phase === "activating"
              ? progress
              : reactor.phase === "deactivating"
                ? 1 - progress
                : reactor.phase === "active"
                  ? 1
                  : 0;
        environment = 0;
      }
      const visible = inView && !document.hidden;
      const moving = reactor.phase !== "idle" && !reducedMotion && visible;
      const beatTime = reactorClockAt(reactor, now);
      // Record readiness before seeking to the shared clock: a seek can drop
      // readyState while its new frame decodes, especially after a late load.
      if (video.readyState >= 2 && mediaReadyAt.current === null)
        mediaReadyAt.current = now;
      if (moving && video.readyState >= 2 && !video.seeking) {
        const desiredTime = reactorMediaTime(beatTime);
        // Restore the same clock after navigation/visibility changes, and loop
        // just the glowing pumps rather than replaying the dormant intro.
        if (Math.abs(video.currentTime - desiredTime) > 0.16)
          video.currentTime = desiredTime;
      }
      if (moving && video.paused && video.readyState >= 1) {
        void video.play().catch(() => {
          /* The matching poster remains available. */
        });
      } else if (!moving && !video.paused) video.pause();
      // Chromium supports rates down to 1/16. The final few pixels fade away
      // while the clock reaches zero, then idle pauses the media completely.
      const rate = Math.max(0.0625, flow);
      if (
        Math.abs(video.playbackRate - rate) > 0.005 ||
        (flow === 1 && video.playbackRate !== 1)
      )
        video.playbackRate = rate;
      // A late decoded frame must also fade in, rather than appearing at full
      // power when a slow connection finishes buffering after startup.
      const readyFade =
        mediaReadyAt.current === null
          ? 0
          : smooth((now - mediaReadyAt.current) / (reducedMotion ? 180 : 400));
      const mix = core * readyFade;
      // Retain the same light clock into shutdown; clicking during a beat must
      // not reset its phase or cause an instant change in brightness.
      const beat = reactorBeatAt(beatTime);
      const pulse = reducedMotion
        ? 0
        : reactorPump(beat.since) * presence * flow;
      element.style.setProperty("--reactor-presence", String(presence));
      element.style.setProperty("--reactor-mix", String(mix));
      element.style.setProperty(
        "--reactor-light",
        String(environment * (0.85 + pulse * 0.35)),
      );
      element.style.setProperty(
        "--reactor-brightness",
        String(1 + pulse * 0.06),
      );
      element.style.setProperty("--reactor-beat", String(pulse));
      element.style.setProperty(
        "--reactor-still",
        String(presence === 0 ? 0 : (0.38 + core * 0.35) * (1 - mix)),
      );

      // A single quiet wave comes from the core. Active breathing is low amplitude.
      const wave = reactor.phase === "activating" ? (elapsed - 400) / 1400 : 1;
      const ripple =
        !reducedMotion && wave > 0 && wave < 1
          ? Math.sin(wave * Math.PI) * 0.09
          : 0;
      element.style.setProperty(
        "--reactor-ripple",
        String(ripple * environment),
      );
      element.style.setProperty(
        "--reactor-wave-scale",
        String(0.7 + smooth(wave) * 0.65),
      );

      if (visible && reactor.phase !== "idle" && !reducedMotion) {
        frame = window.requestAnimationFrame(draw);
      } else if (visible && reactor.duration && elapsed < reactor.duration) {
        frame = window.requestAnimationFrame(draw);
      } else if (
        visible &&
        reactor.phase !== "idle" &&
        mediaReadyAt.current !== null &&
        readyFade < 1
      ) {
        frame = window.requestAnimationFrame(draw);
      }
    };
    const refresh = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      draw(performance.now());
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      refresh();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", refresh);
    video.addEventListener("loadeddata", refresh);
    refresh();
    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      video.removeEventListener("loadeddata", refresh);
    };
  }, [reactor, reducedMotion]);

  return (
    <span
      ref={root}
      className={compact ? "reactor-visual is-compact" : "reactor-visual"}
      data-reactor-state={reactor.phase}
      aria-hidden="true"
    >
      {!compact && (
        <>
          <span className="reactor-ambience" />
          <span className="reactor-ripple" />
        </>
      )}
      <Image
        src={HEART_POSTER}
        alt=""
        width={720}
        height={1280}
        unoptimized
        className={
          compact
            ? "nav-image-icon reactor-still"
            : "reactor-core-image reactor-still"
        }
      />
      <video
        ref={media}
        className={compact ? "nav-reactor-video" : "reactor-core-video"}
        src={HEART_VIDEO}
        poster={HEART_POSTER}
        muted
        loop
        playsInline
        preload="auto"
      />
    </span>
  );
}

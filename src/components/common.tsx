"use client";
import {
  ChevronRight,
  CircleHelp,
  Flag,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useApp } from "@/app/providers/app-provider";
import { cn } from "@/lib/utils";
import type { OrbState } from "@/lib/demo";
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return <span className={cn("pill", tone)}>{children}</span>;
}
export function IntegrationButton({
  id,
  label = "Integration details",
}: {
  id: string;
  label?: string;
}) {
  const { integrate } = useApp();
  return (
    <button className="text-button" onClick={() => integrate(id)}>
      <CircleHelp size={15} aria-hidden="true" />
      {label}
    </button>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
}) {
  return (
    <div className={cn("notice", tone)}>
      <Info size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  icon: Icon = CircleHelp,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SectionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-button" href={href}>
      {children}
      <ChevronRight size={16} aria-hidden="true" />
    </Link>
  );
}
export function FlagButton({ id, label }: { id: string; label?: string }) {
  const { integrate, flag, flags } = useApp();
  const base = label ? `Flag this spoken line: ${label}` : "Flag this spoken line";
  return (
    <button
      className={cn("icon-button", flags.includes(id) && "flagged")}
      aria-label={
        flags.includes(id) ? `Line flagged locally: ${label || id}` : base
      }
      onClick={() => integrate("speech.flag", () => flag(id))}
    >
      <Flag size={15} />
    </button>
  );
}
// 20% faster than the source clip, applied before the first frame is shown.
const ORB_PLAYBACK_RATE = 3;
export function VoiceVideo({
  state = "Idle",
  compact = false,
  playing = false,
  persist = false,
  videoRef,
  testId = "voice-animation",
  staticPoster = false,
  onFailureChange,
}: {
  state?: OrbState;
  compact?: boolean;
  playing?: boolean;
  /** Keep moving even when scrolled out of view, until explicitly paused. */
  persist?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  testId?: string;
  /** Show only the local poster — no video request, for decorative surfaces. */
  staticPoster?: boolean;
  onFailureChange?: (failed: boolean) => void;
}) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const video = videoRef ?? localVideo;
  const [failed, setFailed] = useState(false);
  const failureCallback = useRef(onFailureChange);
  useEffect(() => {
    failureCallback.current = onFailureChange;
  }, [onFailureChange]);
  useEffect(() => {
    failureCallback.current?.(failed);
  }, [failed]);
  // Rate is set during layout so the very first decoded frame already runs fast.
  useLayoutEffect(() => {
    const element = video.current;
    if (!element) return;
    element.defaultPlaybackRate = ORB_PLAYBACK_RATE;
    element.playbackRate = ORB_PLAYBACK_RATE;
  }, [video]);
  useLayoutEffect(() => {
    const element = video.current;
    if (!element) return;
    let inView = persist;
    let disposed = false;
    const applyRate = () => {
      element.defaultPlaybackRate = ORB_PLAYBACK_RATE;
      element.playbackRate = ORB_PLAYBACK_RATE;
    };
    const sync = () => {
      applyRate();
      if (playing && (persist || (inView && !document.hidden))) {
        void element.play().catch(() => {
          if (!disposed) setFailed(true);
        });
      } else element.pause();
    };
    let observer: IntersectionObserver | null = null;
    if (!persist) {
      observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
      });
      observer.observe(element);
    }
    document.addEventListener("visibilitychange", sync);
    element.addEventListener("loadedmetadata", sync);
    element.addEventListener("canplay", sync);
    element.addEventListener("play", applyRate);
    sync();
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      element.removeEventListener("loadedmetadata", sync);
      element.removeEventListener("canplay", sync);
      element.removeEventListener("play", applyRate);
    };
  }, [playing, persist, video]);
  // Pause only when the element actually leaves the page, so a fresh click
  // never interrupts its own first frame with a cleanup pause.
  useEffect(() => {
    const element = video.current;
    return () => element?.pause();
  }, [video]);
  return (
    <div
      className={cn(
        "voice-video-stage",
        compact && "compact",
        playing && "playing",
      )}
      role="group"
      aria-label={`ONE FOR ALL voice animation: ${state}`}
    >
      {staticPoster ? (
        <Image
          className="voice-video"
          data-testid={testId}
          src="/media/one-for-all-poster.webp?v=smooth60-v2"
          alt="Still frame of the ONE FOR ALL orb. The animation is not played on this screen."
          width={330}
          height={330}
          unoptimized
        />
      ) : (
        <video
          ref={video}
          className="voice-video"
          data-testid={testId}
          muted
          loop
          playsInline
          preload={compact ? "none" : "auto"}
          poster="/media/one-for-all-poster.webp?v=smooth60-v2"
          aria-label="Silent liquid animation. Playback is a visual preview, not an active microphone."
          onCanPlay={() => setFailed(false)}
          onError={() => setFailed(true)}
        >
          <source
            media="(max-width: 900px)"
            src="/media/one-for-all-1080p.mp4?v=smooth60-v2"
            type="video/mp4"
          />
          <source
            src="/media/one-for-all-4k.mp4?v=smooth60-v2"
            type="video/mp4"
          />
          <source
            src="/media/one-for-all-1080p.mp4?v=smooth60-v2"
            type="video/mp4"
          />
        </video>
      )}
      {failed && !staticPoster && (
        <p className="video-error" role="status">
          The animation could not play. Your typed workspace is still available.
        </p>
      )}
    </div>
  );
}
export function TrustLine() {
  return (
    <div className="trust-line">
      <ShieldCheck size={15} aria-hidden="true" />
      <span>Your browser. Your accounts. Your final say.</span>
    </div>
  );
}

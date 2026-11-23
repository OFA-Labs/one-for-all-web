"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { Tooltip } from "radix-ui";
import {
  Atom,
  AudioLines,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  Code2,
  Command,
  History,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Power,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/app/providers/app-provider";
import { ReactorVisual } from "@/components/reactor/reactor-visual";
import { BackgroundCutout } from "@/components/media/background-cutout";
import { reactorBeatAt, reactorPump } from "@/lib/reactor/reactor-beat";
import {
  reactorActionLabel,
  reactorIsTransitioning,
  useReactorReducedMotion,
} from "@/lib/reactor/reactor-transition";
import { ThemeSelector } from "./theme-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
type NavItem = {
  href: string;
  name: string;
  icon: LucideIcon;
  image?: string;
  imageMode?: "monochrome" | "original" | "wide";
  /** Optical size inside the fixed artwork frame, not a source-image edit. */
  imageScale?: number;
  iconSize?: number;
};

// The entry flow owns the whole viewport until the five setup steps are done.
// The sign-in/setup screens and the privacy notice they link to stay public.
const STANDALONE_ROUTES = new Set([
  "/sign-in",
  "/sign-up",
  "/recover",
  "/onboarding",
]);
const PUBLIC_ROUTES = new Set([...STANDALONE_ROUTES, "/privacy"]);

const nav: NavItem[] = [
  {
    href: "/",
    name: "Home",
    icon: AudioLines,
    image: "/media/home-relaxing.webp",
    imageScale: 1,
  },
  {
    href: "/playground",
    name: "Playground",
    icon: Boxes,
    iconSize: 28,
  },
  {
    href: "/history",
    name: "History",
    icon: History,
    image: "/media/history-plugins.webp",
    imageMode: "original",
    imageScale: 0.94,
  },
  {
    href: "/watchers",
    name: "Watchers",
    icon: Bell,
    image: "/media/watchers-folder.png",
    imageMode: "original",
    imageScale: 1,
  },
  {
    href: "/arc-reactor",
    name: "OFA Engine",
    icon: Atom,
  },
  {
    href: "/e-brain",
    name: "e-brain",
    icon: Atom,
    image: "/media/e-brain-mark-v2.png",
    imageMode: "original",
    imageScale: 1,
  },
];

const settingsNav: NavItem[] = [
  {
    href: "/connections",
    name: "Connections",
    icon: Plug,
    image: "/media/connections-plugs.webp",
    imageMode: "wide",
    imageScale: 1,
  },
  {
    href: "/settings",
    name: "Settings",
    icon: Settings2,
    image: "/media/settings-gears.webp",
    imageScale: 0.96,
  },
  {
    href: "/handoff",
    name: "Developer handoff",
    icon: Code2,
    iconSize: 26,
  },
];

function NavHint({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root disableHoverableContent>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="nav-tooltip" side="right" sideOffset={12}>
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function NavArtwork({
  src,
  mode = "monochrome",
  scale = 1,
}: {
  src: string;
  mode?: NavItem["imageMode"];
  scale?: number;
}) {
  const cutoutId = useId();
  const monochrome = mode === "monochrome";
  return (
    <span
      className={cn("nav-image-icon nav-artwork", mode === "wide" && "is-wide")}
      style={{ "--art-scale": scale } as React.CSSProperties}
      aria-hidden="true"
    >
      {monochrome && <BackgroundCutout id={cutoutId} monochrome />}
      <Image
        src={src}
        alt=""
        width={48}
        height={48}
        unoptimized
        loading="eager"
        className={cn("nav-artwork-image", monochrome && "is-monochrome")}
        style={monochrome ? { filter: `url(#${cutoutId})` } : undefined}
      />
    </span>
  );
}
function NavIcon({ item }: { item: NavItem }) {
  const { reactor } = useApp();
  if (item.href === "/arc-reactor")
    return <ReactorVisual reactor={reactor} compact />;
  if (!item.image)
    return (
      <item.icon
        size={item.iconSize ?? 26}
        strokeWidth={1.7}
        aria-hidden="true"
      />
    );
  return (
    <NavArtwork
      src={item.image}
      mode={item.imageMode}
      scale={item.imageScale}
    />
  );
}

const NAV_INDICATOR_HEIGHT = 22;

/** One shared rail indicator measures the live link position, so it can slide
 * between the main and settings groups instead of growing the selected icon. */
function NavStack({
  activeKey,
  children,
}: {
  activeKey: string;
  children: ReactNode;
}) {
  const stack = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{
    y: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const root = stack.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>(".nav-link.active");
      if (!active) {
        setIndicator(null);
        return;
      }
      // offsetTop chain is unaffected by dialog/zoom transforms, so the pill
      // stays aligned even while the mobile drawer is still animating in.
      let top = 0;
      let node: HTMLElement | null = active;
      while (node && node !== root) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      setIndicator({
        y:
          Math.round(
            (top + (active.offsetHeight - NAV_INDICATOR_HEIGHT) / 2) * 10,
          ) / 10,
        height: NAV_INDICATOR_HEIGHT,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeKey]);

  return (
    <div className="sidebar-nav-stack" ref={stack}>
      <span
        className={cn("nav-indicator", indicator && "is-visible")}
        style={
          indicator
            ? {
                transform: `translateY(${indicator.y}px)`,
                height: indicator.height,
              }
            : undefined
        }
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-wordmark" aria-label="ONE FOR ALL">
        ONE FOR ALL
      </span>
    </span>
  );
}
function subscribeToWorkspaceScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
  };
}
function workspaceScrollSnapshot() {
  return window.scrollY > window.innerHeight * 0.65;
}
const serverScrollSnapshot = () => false;

// How far the user has scrolled through the full-screen hero (0 → 1). Written
// to a CSS variable instead of React state so it can update every frame
// without re-rendering the whole shell.
function subscribeToHeroProgress(callback: () => void) {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      callback();
    });
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) window.cancelAnimationFrame(frame);
  };
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const standalone = STANDALONE_ROUTES.has(pathname);
  const workspaceVisible = useSyncExternalStore(
    subscribeToWorkspaceScroll,
    workspaceScrollSnapshot,
    serverScrollSnapshot,
  );
  const immersive = pathname === "/";
  const shellRef = useRef<HTMLDivElement>(null);

  // Drive the hero → workspace transition straight from scroll progress so the
  // sidebar/chrome fade in continuously instead of snapping in all at once.
  useEffect(() => {
    if (!immersive) return;
    const writeProgress = () => {
      const shell = shellRef.current;
      if (!shell) return;
      // Reduced motion: no gradual fade — snap between hidden at the hero and
      // fully visible in the workspace.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const inWorkspace = window.scrollY > window.innerHeight * 0.65;
        shell.style.setProperty(
          "--workspace-progress",
          inWorkspace ? "1" : "0",
        );
        shell.classList.toggle("sidebar-revealed", inWorkspace);
        return;
      }
      const hero = document.querySelector<HTMLElement>(".assistant-hero");
      const distance = hero?.offsetHeight || window.innerHeight;
      const progress = Math.min(1, Math.max(0, window.scrollY / distance));
      shell.style.setProperty("--workspace-progress", progress.toFixed(4));
      // Keep the sidebar genuinely hidden (not just transparent) at the top so
      // it can't be focused or reported visible before the reveal begins.
      shell.classList.toggle("sidebar-revealed", progress > 0.02);
    };
    writeProgress();
    return subscribeToHeroProgress(writeProgress);
  }, [immersive]);
  const {
    role,
    setRole,
    authReady,
    onboardingComplete,
    reset,
    arcReactorActive,
    reactor,
    toggleArcReactor,
    notifications,
    unseenCount,
    markSeen,
    markAllSeen,
  } = useApp();
  const signedIn = role !== "visitor";
  // Setup itself is full-screen, but a guest still cannot open it directly.
  const gated = pathname === "/onboarding" || !PUBLIC_ROUTES.has(pathname);

  // First-run enforcement: guests start at sign-in, and a signed-in preview
  // cannot reach the workspace until all five setup steps are complete.
  useEffect(() => {
    if (!authReady || !gated) return;
    if (!signedIn) router.replace("/sign-in");
    else if (pathname !== "/onboarding" && !onboardingComplete)
      router.replace("/onboarding");
  }, [authReady, gated, pathname, signedIn, onboardingComplete, router]);

  const reducedReactorMotion = useReactorReducedMotion();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const shell = shellRef.current;
    const elapsed = performance.now() - reactor.startedAt;
    if (
      !shell ||
      reducedReactorMotion ||
      reactor.phase !== "activating" ||
      elapsed >= reactor.duration
    )
      return;
    // A heartbeat moves every visible surface together only during startup.
    // Sharing its pulse with ReactorVisual keeps the jolt on the heart's beat.
    const surfaces = [
      ...shell.querySelectorAll<HTMLElement>(
        ":scope > .sidebar, :scope > .sidebar-reopen, :scope > .mobile-bottom-nav, :scope > .app-frame > *",
      ),
      ...document.querySelectorAll<HTMLElement>(".mobile-nav-dialog, .toast"),
    ];
    const original = surfaces.map((surface) => surface.style.translate);
    const restore = () =>
      surfaces.forEach((surface, index) => {
        surface.style.translate = original[index];
      });
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - reactor.startedAt);
      if (elapsed >= reactor.duration) {
        restore();
        return;
      }
      const beat = reactorBeatAt(now - reactor.heartbeatAt);
      const t = Math.max(0, Math.min(1, (elapsed - 180) / 1620));
      const presence = t * t * (3 - 2 * t);
      const settle = Math.min(1, (reactor.duration - elapsed) / 500);
      const pulse = reactorPump(beat.since) * presence * settle;
      const x = 6 * pulse * Math.sin((beat.since * Math.PI) / 30);
      const y = 3 * pulse * Math.sin((beat.since * Math.PI) / 22);
      surfaces.forEach((surface) => {
        surface.style.translate = `${x}px ${y}px`;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      restore();
    };
  }, [reactor, reducedReactorMotion, pathname, menu]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pressedHref, setPressedHref] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = (href: string) => {
    setPressedHref(href);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressedHref(null), 180);
  };
  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    [],
  );
  const active = nav.find((n) =>
    n.href === "/" ? pathname === "/" : pathname.startsWith(n.href),
  );
  const links = (
    <NavStack activeKey={pathname}>
      <Link
        href="/"
        className={cn("sidebar-home", pressedHref === "/" && "is-pressed")}
        aria-label="ONE FOR ALL home"
        title="ONE FOR ALL home"
        onClick={() => {
          pulse("/");
          setMenu(false);
        }}
      >
        <span className="sidebar-wordmark" aria-hidden="true">
          ONE FOR ALL
        </span>
      </Link>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {nav.map((n) => {
          const isActive =
            n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <div className="nav-item" key={n.href}>
              <NavHint label={n.name}>
                <Link
                  href={n.href}
                  aria-label={n.name}
                  onClick={() => {
                    pulse(n.href);
                    setMenu(false);
                  }}
                  className={cn(
                    "nav-link",
                    isActive && "active",
                    pressedHref === n.href && "is-pressed",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-icon-slot">
                    <NavIcon item={n} />
                  </span>
                  <span className="sr-only">{n.name}</span>
                  {n.href === "/watchers" && unseenCount > 0 && (
                    <span
                      className="nav-count"
                      aria-label={`${unseenCount} unseen`}
                    >
                      {unseenCount}
                    </span>
                  )}
                </Link>
              </NavHint>
              {n.href === "/watchers" && unseenCount > 0 && (
                <button
                  type="button"
                  className="nav-utility watcher-seen"
                  aria-label={`Mark ${unseenCount} watcher notification${unseenCount === 1 ? "" : "s"} as seen`}
                  title="Mark all watcher notices as seen"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markAllSeen();
                  }}
                >
                  <Check size={12} aria-hidden="true" />
                </button>
              )}
              {n.href === "/arc-reactor" && (
                <button
                  type="button"
                  className={cn(
                    "nav-utility arc-toggle",
                    arcReactorActive && "is-active",
                  )}
                  data-reactor-state={reactor.phase}
                  aria-label={reactorActionLabel[reactor.phase]}
                  aria-pressed={arcReactorActive}
                  aria-busy={reactorIsTransitioning(reactor.phase)}
                  disabled={reactorIsTransitioning(reactor.phase)}
                  title={reactorActionLabel[reactor.phase]}
                  onClick={toggleArcReactor}
                >
                  <Power size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-lower">
        <nav aria-label="Workspace settings" className="sidebar-nav">
          {settingsNav.map((n) => {
            const isActive = pathname === n.href;
            return (
              <div className="nav-item" key={n.href}>
                <NavHint label={n.name}>
                  <Link
                    className={cn(
                      "nav-link",
                      isActive && "active",
                      pressedHref === n.href && "is-pressed",
                    )}
                    href={n.href}
                    aria-label={n.name}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      pulse(n.href);
                      setMenu(false);
                    }}
                  >
                    <span className="nav-icon-slot">
                      <NavIcon item={n} />
                    </span>
                    <span className="sr-only">{n.name}</span>
                  </Link>
                </NavHint>
              </div>
            );
          })}
        </nav>
        <NavHint
          label={role === "visitor" ? "Sign in" : "Your workspace settings"}
        >
          <Link
            className="sidebar-person"
            href={role === "visitor" ? "/sign-in" : "/settings"}
            aria-label={
              role === "visitor" ? "Sign in" : "Your workspace settings"
            }
          >
            <span className="avatar" aria-hidden="true">
              {role === "visitor" ? "G" : "JV"}
            </span>
          </Link>
        </NavHint>
      </div>
    </NavStack>
  );
  const blocked =
    authReady &&
    gated &&
    (!signedIn || (pathname !== "/onboarding" && !onboardingComplete));
  if (blocked) {
    return (
      <div className="auth-redirect" role="status">
        Opening your workspace…
      </div>
    );
  }
  if (standalone) {
    return (
      <div className="auth-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <main id="main-content" className="main-content" key={pathname}>
          {children}
        </main>
      </div>
    );
  }
  return (
    <div
      ref={shellRef}
      className={cn(
        "application-shell",
        immersive && "immersive-home",
        workspaceVisible && "workspace-visible",
        sidebarCollapsed && "sidebar-collapsed",
      )}
      style={
        { "--workspace-progress": immersive ? 0 : 1 } as React.CSSProperties
      }
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="sidebar-toggle"
          aria-label="Hide navigation"
          title="Hide navigation"
          onClick={() => setSidebarCollapsed(true)}
        >
          <PanelLeftClose size={18} aria-hidden="true" />
        </button>
        {links}
      </aside>
      {sidebarCollapsed && (
        <button
          className="sidebar-reopen"
          aria-label="Show navigation"
          title="Show navigation"
          onClick={() => setSidebarCollapsed(false)}
        >
          <PanelLeftOpen size={18} aria-hidden="true" />
        </button>
      )}
      <div className="app-frame">
        <header className="topbar">
          <div className="header-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span>{" "}
              <strong>
                {active?.name ||
                  {
                    "/connections": "Connections",
                    "/settings": "Settings",
                    "/handoff": "Developer handoff",
                    "/privacy": "Privacy",
                    "/extension": "Browser companion",
                    "/voice-lab": "Voice lab",
                    "/about": "About ONE FOR ALL",
                    "/onboarding": "Get started",
                    "/sign-in": "Sign in",
                    "/sign-up": "Create account",
                    "/recover": "Recover access",
                  }[pathname] ||
                  "Task details"}
              </strong>
            </span>
          </div>
          <div className="header-actions">
            <span className="preview-marker">
              <span />
              Interactive preview
            </span>
            <label className="role-control">
              <span className="sr-only">Preview role</span>
              <select
                aria-label="Preview role"
                title="Visual preview only — this does not change permissions or create an account"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="visitor">Visitor view</option>
                <option value="member">Member view</option>
                <option value="owner">Owner view</option>
              </select>
            </label>
            <button
              className="icon-button"
              aria-label={`Open sample notifications${unseenCount > 0 ? `, ${unseenCount} unseen` : ""}`}
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={19} />
              {unseenCount > 0 && <i className="notification-dot" />}
            </button>
            <ThemeSelector />
          </div>
        </header>
        <div className="preview-banner">
          <Sparkles size={14} aria-hidden="true" />
          <span>Local demo — no audio or real browser actions.</span>
          <Link href="/about">
            What’s included <ChevronDown size={13} aria-hidden="true" />
          </Link>
        </div>
        <main id="main-content" className="main-content" key={pathname}>
          {children}
        </main>
        <footer className="privacy-footer">
          <span>
            <ShieldCheck size={14} aria-hidden="true" />
            Private by design. You decide what happens next.
          </span>
          <div>
            <Link href="/privacy">Privacy & data</Link>
            <Link href="/about">About</Link>
            <button onClick={() => setDeleteOpen(true)}>Delete my data</button>
          </div>
        </footer>
      </div>
      <Dialog open={menu} onOpenChange={setMenu}>
        <DialogContent
          className="mobile-nav-dialog"
          showCloseButton={false}
          style={{ translate: "none" }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Navigation</DialogTitle>
            <DialogDescription>
              Move between ONE FOR ALL screens
            </DialogDescription>
          </DialogHeader>
          <button
            className="icon-button close-menu"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X />
          </button>
          {links}
        </DialogContent>
      </Dialog>
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Updates, without the noise</DialogTitle>
            <DialogDescription>
              Unseen notices show a count on the watchers icon. Mark one seen,
              or all of them, to clear it. Nothing was sent to a real account.
            </DialogDescription>
            {unseenCount > 0 && (
              <button
                type="button"
                className="mark-all-seen"
                onClick={markAllSeen}
              >
                Mark all as seen
              </button>
            )}
          </DialogHeader>
          {notifications.length === 0 ? (
            <p className="muted">You’re all caught up.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((n) => (
                <div key={n.id} className="notification-item is-unseen">
                  {n.href === "/watchers" ? (
                    <Image
                      src="/media/watchers-folder.png"
                      alt=""
                      width={19}
                      height={19}
                      unoptimized
                      aria-hidden="true"
                    />
                  ) : (
                    <Command size={19} aria-hidden="true" />
                  )}
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.detail}</p>
                    <div className="notification-actions">
                      <Link
                        href={n.href}
                        onClick={() => setNotificationsOpen(false)}
                      >
                        {n.href === "/watchers"
                          ? "View watchers"
                          : "Explore the extension preview"}
                      </Link>
                      <button
                        type="button"
                        className="seen-button"
                        onClick={() => markSeen(n.id)}
                      >
                        Seen
                      </button>
                      <span className="notification-time">{n.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your local demo data</DialogTitle>
            <DialogDescription>
              There is no account or server here. Resetting erases the local
              preferences and sample task saved in this browser. Nothing outside
              this browser is affected.
            </DialogDescription>
          </DialogHeader>
          <div className="stack">
            <Button
              variant="destructive"
              onClick={() => {
                reset();
                setDeleteOpen(false);
              }}
            >
              Reset local demo now
            </Button>
            <Button variant="outline" asChild>
              <Link href="/privacy" onClick={() => setDeleteOpen(false)}>
                Read the privacy details
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
        {nav.map((n) => (
          <Link
            href={n.href}
            key={n.href}
            aria-label={n.name}
            title={n.name}
            aria-current={active?.href === n.href ? "page" : undefined}
            className={cn(active?.href === n.href && "active")}
          >
            <NavIcon item={n} />
            <span className="sr-only">{n.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

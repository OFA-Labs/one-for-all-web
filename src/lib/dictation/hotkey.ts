// A browser keyboard filter, NOT a Win32 hook. It cannot reserve OS Caps Lock,
// receive events from other programs, or identify LLKHF_INJECTED/TEST_MAGIC.
type CapsLockIdentity = { key?: string; code?: string; keyCode?: number };

export function isCapsLockEvent(event: CapsLockIdentity) {
  // Physical code survives layout/IME differences in the reported key label.
  // keyCode is a compatibility fallback for older embedded keyboard bridges.
  return (
    event.code === "CapsLock" ||
    event.key === "CapsLock" ||
    event.keyCode === 20
  );
}

export class CapsLockPreviewFilter {
  private held = false;
  private lastUp = -Infinity;
  private lastDown = -Infinity;
  reset() {
    this.held = false;
    this.lastUp = -Infinity;
    this.lastDown = -Infinity;
  }
  down(
    event: CapsLockIdentity & {
      repeat: boolean;
      shiftKey: boolean;
      ctrlKey: boolean;
      altKey: boolean;
      metaKey: boolean;
    },
    now: number,
  ) {
    if (!isCapsLockEvent(event)) return { swallow: false, toggle: false };
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
      return { swallow: false, toggle: false };
    if (event.repeat) return { swallow: this.held, toggle: false };
    if (now - Math.max(this.lastUp, this.lastDown) < 30)
      return { swallow: true, toggle: false };
    // A fresh non-repeat keydown is another physical press even if the browser
    // lost the previous keyup. Do not leave the shortcut latched indefinitely.
    this.held = true;
    this.lastDown = now;
    return { swallow: true, toggle: true };
  }
  up(event: CapsLockIdentity | string, now: number) {
    if (!isCapsLockEvent(typeof event === "string" ? { key: event } : event))
      return false;
    const swallow = this.held;
    this.held = false;
    this.lastUp = now;
    return swallow;
  }
}

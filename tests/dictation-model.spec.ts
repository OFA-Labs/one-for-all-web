import { expect, test } from "@playwright/test";
import { CapsLockPreviewFilter } from "../src/lib/dictation/hotkey";
import {
  dictationReducer as reduce,
  initialDictationState,
} from "../src/lib/dictation/model";
import { createMockDictationServices } from "../src/lib/dictation/mock-services";
import { SAMPLE_TRANSCRIPT } from "../src/lib/dictation/contracts";

function ready() {
  let state = reduce(initialDictationState(), { type: "RESTORE", now: 10000 });
  state = reduce(state, { type: "CONSENT", now: 10001 });
  return reduce(state, { type: "CONNECTED", now: 10002 });
}
function listening(state = ready(), id = "session-1") {
  state = reduce(state, { type: "TOGGLE", id, now: 11000 });
  return reduce(state, { type: "CAPTURE_READY", sessionId: id, now: 11500 });
}
function processing(state = listening()) {
  return reduce(state, { type: "TOGGLE", id: "stop-press", now: 13500 });
}
function inserting(state = processing(), text = SAMPLE_TRANSCRIPT) {
  return reduce(state, {
    type: "TEXT_READY",
    sessionId: state.session!.id,
    text,
    now: 14000,
  });
}

test("browser filter handles one toggle per held Caps key, release, modifiers and bounce", () => {
  const gate = new CapsLockPreviewFilter();
  const event = {
    key: "CapsLock",
    repeat: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  };
  expect(gate.down(event, 100)).toEqual({ swallow: true, toggle: true });
  for (let index = 0; index < 40; index++)
    expect(gate.down({ ...event, repeat: true }, 110 + index)).toEqual({
      swallow: true,
      toggle: false,
    });
  expect(gate.up("CapsLock", 160)).toBe(true);
  expect(gate.down(event, 180)).toEqual({ swallow: true, toggle: false });
  expect(gate.down(event, 200)).toEqual({ swallow: true, toggle: true });
  gate.reset();
  for (const modifier of ["shiftKey", "ctrlKey", "altKey", "metaKey"] as const)
    expect(gate.down({ ...event, [modifier]: true }, 300)).toEqual({
      swallow: false,
      toggle: false,
    });
  // Non-trigger keys return before inspecting any other event fields.
  expect(
    gate.down(
      {
        ...event,
        key: "a",
        get repeat(): boolean {
          throw new Error("non-trigger inspected");
        },
      },
      400,
    ),
  ).toEqual({ swallow: false, toggle: false });
});

test("consent gates enablement and target guards refuse password and indicator fields", () => {
  let state = initialDictationState();
  state = reduce(state, { type: "ENABLE", now: 1 });
  state = reduce(state, { type: "TOGGLE", id: "forbidden", now: 2 });
  expect(state.phase).toBe("IDLE");
  expect(state.enabled).toBe(false);
  for (const blocked of ["password", "overlay"] as const) {
    state = reduce(ready(), {
      type: "TOGGLE",
      id: "blocked",
      blocked,
      now: 11000,
    });
    expect(state.phase).toBe("ERROR");
    expect(state.session).toBeNull();
  }
});

test("Caps identity survives unknown key labels, legacy bridges and differently labeled releases", () => {
  const modifiers = {
    repeat: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  };
  for (const identity of [
    { key: "Unidentified", code: "CapsLock" },
    { key: "Unidentified", code: "", keyCode: 20 },
    { key: "CapsLock", code: "" },
  ]) {
    const gate = new CapsLockPreviewFilter();
    expect(gate.down({ ...identity, ...modifiers }, 100).toggle).toBe(true);
    expect(gate.up({ key: "Unidentified", code: "CapsLock" }, 150)).toBe(true);
    expect(gate.down({ ...identity, ...modifiers }, 250).toggle).toBe(true);
  }
});

test("a missing Caps release cannot latch the next fresh press while held repeats remain inert", () => {
  const gate = new CapsLockPreviewFilter();
  const event = {
    key: "CapsLock",
    code: "CapsLock",
    repeat: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  };
  expect(gate.down(event, 100).toggle).toBe(true);
  expect(gate.down(event, 110).toggle).toBe(false);
  for (let index = 0; index < 40; index++)
    expect(gate.down({ ...event, repeat: true }, 150 + index).toggle).toBe(
      false,
    );
  // No keyup was delivered, but the browser identifies this as a new press.
  expect(gate.down(event, 800).toggle).toBe(true);
  expect(gate.up({ code: "CapsLock" }, 850)).toBe(true);
});

test("quick second press aborts startup and stale asynchronous results cannot affect a new session", () => {
  let state = reduce(ready(), { type: "TOGGLE", id: "old", now: 11000 });
  state = reduce(state, { type: "TOGGLE", id: "abort", now: 11100 });
  expect(state.phase).toBe("IDLE");
  expect(state.recent).toEqual([]);
  state = reduce(state, { type: "TOGGLE", id: "new", now: 11400 });
  expect(
    reduce(state, { type: "CAPTURE_READY", sessionId: "old", now: 12000 }),
  ).toBe(state);
  state = reduce(state, {
    type: "CAPTURE_READY",
    sessionId: "new",
    now: 12000,
  });
  expect(state.phase).toBe("LISTENING");
  state = reduce(state, { type: "TICK", now: 24000 });
  expect(state.phase).toBe("LISTENING");
  state = reduce(state, { type: "MINIMIZE", minimized: true, now: 25000 });
  state = reduce(state, { type: "FOREGROUND", app: "Chat", now: 26000 });
  expect(state.phase).toBe("LISTENING");
});

test("processing and insertion ignore additional toggles and preserve the exact Unicode result", () => {
  const fixture = `${SAMPLE_TRANSCRIPT}\nconst value = { text: "hello" };\n  next();`;
  let state = processing();
  state = reduce(state, { type: "TOGGLE", id: "busy", now: 13600 });
  expect(state.phase).toBe("PROCESSING");
  expect(state.pulse).toBe(1);
  state = inserting(state, fixture);
  state = reduce(state, { type: "TOGGLE", id: "busy-again", now: 14100 });
  expect(state.phase).toBe("INSERTING");
  state = reduce(state, {
    type: "INSERTED",
    sessionId: "session-1",
    result: { kind: "confirmed", app: "Notepad" },
    now: 14500,
  });
  expect(state.phase).toBe("IDLE");
  expect(state.documents.Notepad).toBe(fixture);
  expect(JSON.stringify(state.transitions)).not.toContain("meeting");
  expect(state.transitions.map((record) => record.to)).toContain("PROCESSING");
});

test("original and current target policies update only their selected sandbox documents", () => {
  let original = reduce(listening(), {
    type: "FOREGROUND",
    app: "Chat",
    now: 12000,
  });
  original = inserting(processing(original));
  original = reduce(original, {
    type: "INSERTED",
    sessionId: "session-1",
    result: { kind: "confirmed", app: "Notepad" },
    now: 15000,
  });
  expect(original.documents.Notepad).toBe(SAMPLE_TRANSCRIPT);
  expect(original.documents.Chat).toBe("");
  let current = listening(
    reduce(ready(), {
      type: "SETTINGS",
      patch: { insertionTargetPolicy: "current" },
      now: 10500,
    }),
  );
  current = reduce(current, { type: "FOREGROUND", app: "Chat", now: 12000 });
  current = inserting(processing(current));
  current = reduce(current, {
    type: "INSERTED",
    sessionId: "session-1",
    result: { kind: "confirmed", app: "Chat" },
    now: 15000,
  });
  expect(current.documents.Chat).toBe(SAMPLE_TRANSCRIPT);
  expect(current.documents.Notepad).toBe("");
});

test("failed insertion retains transcript until confirmed retry or explicit discard", () => {
  let state = inserting();
  state = reduce(state, {
    type: "INSERTED",
    sessionId: "session-1",
    result: { kind: "fallback", app: "Notepad" },
    now: 15000,
  });
  expect(state.recent[0].transcript).toBe(SAMPLE_TRANSCRIPT);
  expect(state.documents.Notepad).toBe("");
  state = reduce(state, { type: "CLEAR_ERROR", now: 20000 });
  expect(state.recent).toHaveLength(1);
  state = reduce(state, {
    type: "RETRY",
    recentId: "session-1",
    id: "retry-1",
    now: 21000,
  });
  expect(state.recent).toHaveLength(1);
  expect(state.phase).toBe("PROCESSING");
  state = reduce(state, {
    type: "TEXT_READY",
    sessionId: "retry-1",
    text: SAMPLE_TRANSCRIPT,
    now: 22000,
  });
  state = reduce(state, {
    type: "INSERTED",
    sessionId: "retry-1",
    result: { kind: "confirmed", app: "Notepad" },
    now: 23000,
  });
  expect(state.recent).toHaveLength(0);
  expect(state.documents.Notepad).toBe(SAMPLE_TRANSCRIPT);
  let discarded = reduce(processing(), {
    type: "FAILED",
    sessionId: "session-1",
    message: "Preview failure",
    now: 15000,
  });
  expect(
    reduce(discarded, {
      type: "TEXT_READY",
      sessionId: "session-1",
      text: "late result",
      now: 15500,
    }),
  ).toBe(discarded);
  discarded = reduce(discarded, {
    type: "DISCARD",
    recentId: "session-1",
    now: 16000,
  });
  expect(discarded.recent).toHaveLength(0);
});

test("disable, interruption, cap, device loss, empty and error recovery preserve their UI invariants", () => {
  const active = listening();
  const disabled = reduce(active, { type: "DISABLE", now: 15000 });
  expect(disabled.enabled).toBe(false);
  expect(disabled.recent).toHaveLength(1);
  expect(disabled.documents.Notepad).toBe("");
  const interrupted = reduce(active, {
    type: "INTERRUPT",
    reason: "Sleep preview",
    now: 15000,
  });
  expect(interrupted.phase).toBe("IDLE");
  expect(interrupted.recent).toHaveLength(1);
  for (const reason of ["cap", "device-lost"] as const)
    expect(reduce(active, { type: "STOP", reason, now: 15000 }).phase).toBe(
      "PROCESSING",
    );
  let cap = reduce(active, {
    type: "SETTINGS",
    patch: { maxRecordingMinutes: 1 },
    now: 12000,
  });
  cap = reduce(cap, { type: "TICK", now: 12500 });
  expect(cap.warned).toBe(true);
  cap = reduce(cap, { type: "TICK", now: 72000 });
  expect(cap.phase).toBe("PROCESSING");
  expect(cap.session).not.toBeNull();
  const empty = reduce(processing(), {
    type: "TEXT_READY",
    sessionId: "session-1",
    text: "",
    now: 15000,
  });
  expect(empty.phase).toBe("IDLE");
  expect(empty.documents.Notepad).toBe("");
  let failed = reduce(active, {
    type: "FAILED",
    sessionId: "session-1",
    message: "Mic unavailable",
    now: 15000,
  });
  failed = reduce(failed, { type: "TOGGLE", id: "next", now: 16000 });
  expect(failed.phase).toBe("STARTING");
  const reset = reduce(disabled, { type: "RESET", now: 17000 });
  expect(reset.enabled).toBe(false);
  expect(reset.recent).toEqual([]);
  expect(reset.consentVersion).toBeNull();
});

test("mock adapter is explicitly non-native, abortable and exposes two simulated retry attempts", async () => {
  const services = createMockDictationServices();
  expect(services.capabilities).toEqual({
    mode: "simulation",
    globalHotkey: false,
    nativeOverlay: false,
  });
  const controller = new AbortController();
  controller.abort();
  await expect(
    services.startCapture(listening().session!, controller.signal),
  ).rejects.toMatchObject({ name: "AbortError" });
  const retries: number[] = [];
  const session = {
    ...processing().session!,
    scenario: "network-error" as const,
  };
  await expect(
    services.transcribe(
      { kind: "simulated", id: session.id, durationMs: 2000 },
      session,
      (progress) => {
        if (progress.retry) retries.push(progress.retry);
      },
      new AbortController().signal,
    ),
  ).rejects.toThrow("Connection failed");
  expect(retries).toEqual([1, 2]);
});

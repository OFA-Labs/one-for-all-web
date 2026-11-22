import { test, expect } from "@playwright/test";
import { createTask, interruptionPreview, transition } from "../src/lib/demo";
import { features } from "../src/lib/integrations";
import { segmentText } from "../src/lib/utils";
test("Reader preserves original email, URL, version and currency text", () => {
  const text =
    "A role pays ₹8,50,000. Send your CV to hello@example.test. Version 2.1.0 is ready. Visit https://example.test/docs. Don’t drop any words.";
  const sentences = segmentText(text);
  expect(sentences.join(" ")).toBe(text);
  expect(sentences.some((s) => s.includes("hello@example.test"))).toBe(true);
  expect(sentences.some((s) => s.includes("2.1.0"))).toBe(true);
  expect(segmentText("")).toEqual([]);
});
test("approval cannot commit expired, unselected or stale drafts", () => {
  let t = createTask("social");
  t = transition(t, { type: "advance" });
  t = transition(t, { type: "allow" });
  expect(t.status).toBe("waiting");
  t = transition(t, { type: "draft", id: "slack", text: "A shorter version" });
  expect(t.expired).toBe(true);
  expect(transition(t, { type: "approve" }).status).toBe("waiting");
  t = transition(t, { type: "refresh" });
  for (const d of t.drafts)
    t = transition(t, { type: "draft", id: d.id, selected: false });
  expect(transition(t, { type: "approve" }).status).toBe("waiting");
  t = transition(t, { type: "draft", id: "slack", selected: true });
  t = transition(t, { type: "approve" });
  expect(t.approved).toEqual(["slack"]);
  expect(t.status).toBe("executing");
  t = transition(t, { type: "advance" });
  expect(t.status).toBe("completed");
  expect(transition(t, { type: "approve" })).toEqual(t);
});
test("pause preserves work and cancellation revokes unused approval", () => {
  let t = transition(transition(createTask("pr"), { type: "advance" }), {
    type: "allow",
  });
  const drafts = t.drafts;
  t = transition(t, { type: "pause" });
  expect(t.status).toBe("paused");
  expect(transition(t, { type: "advance" }).status).toBe("paused");
  expect(t.drafts).toEqual(drafts);
  t = transition(t, { type: "resume" });
  expect(t.status).toBe("waiting");
  t = transition(t, { type: "cancel" });
  expect(t.expired).toBe(true);
  expect(t.approved).toEqual([]);
  expect(transition(t, { type: "resume" }).status).toBe("cancelled");
});
test("refusal has no sites or drafts; parser preserves negative stop and backchannels", () => {
  const t = createTask("decline");
  expect(t.status).toBe("declined");
  expect(t.drafts).toHaveLength(0);
  for (const s of [
    "don't stop",
    "mat ruk",
    "wait for approval",
    "haan",
    "hmm",
    "ok",
  ])
    expect(interruptionPreview(s)).toBe("none");
  for (const s of ["stop", "ruk", "wait", "ek minute"])
    expect(interruptionPreview(s)).toBe("pause");
  expect(interruptionPreview("cancel")).toBe("cancel");
});
test("handoff IDs unique and every feature has all required fields", () => {
  expect(new Set(features.map((f) => f.id)).size).toBe(features.length);
  for (const f of features) {
    expect(f.frontend.length).toBeGreaterThan(0);
    expect(f.backend.length).toBeGreaterThan(0);
    expect(f.errors.length).toBeGreaterThan(0);
    if (f.api.transport === "local-adapter") {
      expect(f.api.path).toMatch(/^src\/.+\.ts — \w+$/);
    } else {
      expect(f.api.path).toMatch(/^\/v1\//);
    }
    expect(f.rules.length).toBeGreaterThan(0);
    expect(f.success.length).toBeGreaterThan(15);
  }
});

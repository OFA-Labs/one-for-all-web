// FRONTEND ONLY. These interfaces are the replacement seams for a desktop host.
// BACKEND NOT IMPLEMENTED: no native hook, microphone, STT, OS insertion,
// native clipboard protocol, tray process, or audio-file storage exists here.
export type DictationPhase =
  "IDLE" | "STARTING" | "LISTENING" | "PROCESSING" | "INSERTING" | "ERROR";
export type PreviewApp = "Notepad" | "Code editor" | "Chat";
export type TargetCondition =
  "normal" | "closed" | "elevated" | "password" | "overlay";
export type MockScenario =
  | "success"
  | "mic-denied"
  | "network-error"
  | "retry-once"
  | "empty"
  | "hook-failure"
  | "long-session";
export const CONSENT_VERSION = "dictation-preview-v1";
export type DictationSettings = {
  trigger: "CapsLock";
  insertionTargetPolicy: "original" | "current";
  acceptInjectedKeys: boolean;
  maxRecordingMinutes: number;
  retainFailedAudioHours: number;
  soundCues: boolean;
  closeToTray: boolean;
};
export const DEFAULT_SETTINGS: DictationSettings = {
  trigger: "CapsLock",
  insertionTargetPolicy: "original",
  acceptInjectedKeys: false,
  maxRecordingMinutes: 120,
  retainFailedAudioHours: 24,
  soundCues: true,
  closeToTray: true,
};
export const SAMPLE_TRANSCRIPT = "Kal meeting hai, कृपया agenda भेज दो 🙂";
export type DictationTarget = {
  app: PreviewApp;
  condition: TargetCondition;
  nativeReference?: string;
};
export type DictationSession = {
  id: string;
  startedAt: number;
  capturedAt?: number;
  durationMs: number;
  target: DictationTarget;
  policy: "original" | "current";
  scenario: MockScenario;
  sample: string;
  transcript?: string;
  sourceRecentId?: string;
};
export type RecentDictation = {
  id: string;
  createdAt: number;
  expiresAt: number;
  target: DictationTarget;
  scenario: MockScenario;
  sample: string;
  transcript?: string;
  durationMs: number;
  status: "saved" | "failed" | "needs-copy";
  reason: string;
};
export type DictationArtifact = {
  kind: "simulated" | "native-reference";
  id: string;
  durationMs: number;
};
export type DictationProgress = {
  retry?: number;
  part?: number;
  totalParts?: number;
};
export type InsertionResult = {
  kind: "confirmed" | "fallback";
  app: PreviewApp;
  reason?: string;
};

export interface DictationServices {
  readonly capabilities: {
    mode: "simulation" | "native";
    globalHotkey: boolean;
    nativeOverlay: boolean;
  };
  // BACKEND NOT IMPLEMENTED: a future host installs its global listener here,
  // forwarding only trigger events. Browser fallback is consent-gated in Provider.
  connect(
    onToggle: () => void,
    scenario: MockScenario,
    signal: AbortSignal,
  ): Promise<void>;
  disconnect(): void;
  // The operation signal cancels startup; capture lifetime belongs to stopCapture.
  startCapture(session: DictationSession, signal: AbortSignal): Promise<void>;
  stopCapture(
    session: DictationSession,
    signal: AbortSignal,
  ): Promise<DictationArtifact>;
  recoverArtifact(
    session: DictationSession,
    signal: AbortSignal,
  ): Promise<DictationArtifact>;
  subscribeLevels(onLevel: (levels: number[]) => void): () => void;
  transcribe(
    artifact: DictationArtifact,
    session: DictationSession,
    progress: (event: DictationProgress) => void,
    signal: AbortSignal,
  ): Promise<string>;
  insertText(
    session: DictationSession,
    target: DictationTarget,
    signal: AbortSignal,
  ): Promise<InsertionResult>;
}

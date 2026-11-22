import type { Dispatch } from "react";
import type { DictationAction, DictationState } from "@/lib/dictation/model";

export type DictationContextValue = {
  state: DictationState;
  send: Dispatch<DictationAction>;
  consentOpen: boolean;
  shortcut: {
    presses: number;
    outcome: "waiting" | "received" | "modified" | "untrusted";
  };
  requestEnable: () => void;
  confirmEnable: () => void;
  closeConsent: () => void;
  toggle: () => void;
  disable: () => void;
  retry: (id: string) => void;
  copyText: (text: string) => Promise<void>;
};

"use client";
import { useState } from "react";
import { ArrowUp, Plus, ShieldCheck } from "lucide-react";
import { useApp } from "@/app/providers/app-provider";
import { classifyPreview, interruptionPreview, scenarios } from "@/lib/demo";

/** Compact chat entry point that lives inside the hero's lower arc. */
export function HeroComposer() {
  const { task, act, start, clear, integrate, notify } = useApp();
  const [prompt, setPrompt] = useState("");

  const submit = (value: string) => {
    if (!value.trim()) return;
    const command = interruptionPreview(value);
    if (command === "pause" || command === "cancel") act({ type: command });
    if (task && !["completed", "cancelled", "declined"].includes(task.status)) {
      notify("Pause or cancel your current preview before starting a new one.");
      return;
    }
    const scenario = classifyPreview(value);
    integrate(scenarios[scenario].feature, () => {
      start(scenario, value);
      setPrompt("");
    });
  };

  const newConversation = () => {
    if (task && !["completed", "cancelled", "declined"].includes(task.status)) {
      notify("Pause or cancel your current preview before starting fresh.");
      return;
    }
    clear();
    setPrompt("");
  };

  return (
    <div className="ofa-hero-chat">
      <form
        className="ofa-hero-chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(prompt);
        }}
      >
        <button
          type="button"
          className="ofa-hero-chat-new"
          onClick={newConversation}
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus size={17} aria-hidden="true" />
        </button>
        <label className="sr-only" htmlFor="hero-request">
          Your request
        </label>
        <input
          id="hero-request"
          type="text"
          placeholder="Ask anything..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          autoComplete="off"
        />
        <button
          className="ofa-hero-chat-send"
          type="submit"
          disabled={!prompt.trim()}
          aria-label="Preview typed request"
        >
          <ArrowUp size={18} aria-hidden="true" />
        </button>
      </form>
      <p className="ofa-hero-chat-note">
        <ShieldCheck size={12} aria-hidden="true" />
        You approve before anything is sent
      </p>
    </div>
  );
}

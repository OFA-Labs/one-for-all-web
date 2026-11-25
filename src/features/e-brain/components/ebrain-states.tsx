import { EmptyState, Notice } from "@/components/common";

export function EBrainLoading() {
  return (
    <p className="ebrain-loading" aria-busy="true">
      Loading memory…
    </p>
  );
}

export function EBrainError({
  baseUrl,
  onRetry,
}: {
  baseUrl: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert">
      <Notice tone="danger">
        E-Brain service is not reachable at {baseUrl}. Nothing was changed.
      </Notice>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function EBrainEmpty() {
  return (
    <EmptyState
      title="No memories yet"
      description="Claude Code, Codex and the voice agent will add them as you work."
    />
  );
}

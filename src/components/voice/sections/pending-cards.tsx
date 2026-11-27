"use client";
import { Button } from "@/components/ui/button";
import { useDesktop } from "../desktop-provider";

/** Things waiting for you (pairing, a choice, an approval, a handoff). Shown above every settings tab. */
export function PendingCards() {
  const { state, decide, answer, continueTask, chooseApp } = useDesktop();
  const connected = state.connected;
  return (
    <>
      {state.status === "Approve on Windows" && (
        <div
          className="mt-4 rounded border p-4"
          role="status"
          aria-live="polite"
        >
          <h3 className="font-semibold">Approve on Windows</h3>
          <p className="mt-1">
            A small permission card is open on your desktop. Check the website
            and browser key, then choose Connect.
          </p>
          {state.fingerprint && (
            <p className="mt-2">
              Browser key: <code>{state.fingerprint}</code>
            </p>
          )}
          <p className="muted small mt-2">
            Waiting for your confirmation. Nothing is recorded and no app is
            opened until you approve.
          </p>
        </div>
      )}

      {!!state.choices?.length && (
        <div
          className="mt-4"
          role="region"
          aria-label="Choose installed application"
        >
          <p>Which installed application should I open?</p>
          <div className="button-row">
            {state.choices.map((option) => (
              <Button key={option.id} onClick={() => chooseApp(option.id)}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {state.task?.approval && (
        <div
          className="mt-4 rounded border p-4"
          role="region"
          aria-label="Desktop action approval"
        >
          <h3>Approve this exact action</h3>
          <p>{state.task.approval.exact_action.operation}</p>
          {state.task.approval.reading.identity?.workspace ? (
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(
                state.task.approval.reading.identity.workspace,
                null,
                2,
              )}
            </pre>
          ) : null}
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(state.task.approval.exact_action.target, null, 2)}
          </pre>
          {state.task.approval.exact_action.text !== undefined && (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">
              {state.task.approval.exact_action.text}
            </pre>
          )}
          <p>
            Current version: <code>{state.task.approval.reading_hash}</code>
          </p>
          {state.task.approval.reading.facts.sha256 ? (
            <p>
              File SHA-256:{" "}
              <code>{String(state.task.approval.reading.facts.sha256)}</code>
            </p>
          ) : null}
          <div className="button-row mt-3">
            <Button onClick={() => decide(true)}>Approve action</Button>
            <Button variant="outline" onClick={() => decide(false)}>
              Reject action
            </Button>
          </div>
          <p>
            Changed state or an expired approval requires a fresh card. Stop
            voice cancels pending work.
          </p>
        </div>
      )}
      {state.task?.question && (
        <div className="mt-4" role="region" aria-label="Desktop action choice">
          <p>{state.task.question.message}</p>
          <div className="button-row">
            {state.task.question.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                onClick={() => answer(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {state.task?.handoff && (
        <div
          className="mt-4"
          role="region"
          aria-label="Desktop human assistance"
        >
          <p>{state.task.handoff.reason}</p>
          <p>
            Finish this step in the application, then continue. OFA will check
            the result again.
          </p>
          <Button onClick={continueTask}>I finished; check again</Button>
        </div>
      )}
      {connected && state.filePreview !== undefined && (
        <details className="mt-4">
          <summary>Latest selected file text</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap">
            {state.filePreview}
          </pre>
          <p>Showing the first 16,384 characters read by the companion.</p>
        </details>
      )}
    </>
  );
}

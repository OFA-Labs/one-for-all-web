"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>The preview couldn’t open this view.</h1>
      <p>Try again. This does not restart any real task or send any action.</p>
      <button className="text-button" onClick={reset}>
        Try this view again
      </button>
    </div>
  );
}

import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <p>404</p>
      <h1>This page has wandered off.</h1>
      <p>Your workspace is still right where you left it.</p>
      <Link href="/" className="text-button">
        Back to assistant
      </Link>
    </div>
  );
}

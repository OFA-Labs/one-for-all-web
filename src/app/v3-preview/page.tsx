import { headers } from "next/headers";
import type { Metadata } from "next";
import { V3PreviewHarness } from "@/features/e-brain/components/v3-preview-harness";

export const metadata: Metadata = {
  title: "V3 preview",
  robots: { index: false, follow: false },
};

/**
 * Clearly labelled local preview route. It is disabled on non-loopback hosts
 * in production and can be disabled explicitly with EBRAIN_V3_PREVIEW=off.
 * The E2E harness runs `next start` on 127.0.0.1, so loopback stays available
 * there. No secrets, bearer tokens or localStorage roles are read here.
 */
export default async function Page() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("host") ?? "").split(":")[0];
  const loopback =
    host === "127.0.0.1" || host === "localhost" || host === "[::1]";
  const disabledByEnv = process.env.EBRAIN_V3_PREVIEW === "off";
  const disabled =
    disabledByEnv || (process.env.NODE_ENV === "production" && !loopback);

  if (disabled) {
    return (
      <section className="panel v3-preview" aria-label="V3 preview disabled">
        <h1>V3 preview is disabled</h1>
        <p>
          This local, synthetic preview route is not available on this host.
          No E-Brain data was read.
        </p>
      </section>
    );
  }

  return <V3PreviewHarness />;
}

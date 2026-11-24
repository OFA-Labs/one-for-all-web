import type { EBrainClient } from "./contracts";
import { createHttpEBrainClient } from "./http-client";
import { createMockEBrainClient } from "./mock-client";

export function getEBrainClient(): EBrainClient {
  const url = process.env.NEXT_PUBLIC_EBRAIN_API_URL;
  return url
    ? createHttpEBrainClient(url, process.env.NEXT_PUBLIC_EBRAIN_TOKEN ?? "")
    : createMockEBrainClient();
}

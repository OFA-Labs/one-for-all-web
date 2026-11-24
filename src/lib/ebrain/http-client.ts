import {
  DEFAULT_PROJECT,
  EBrainHttpError,
  type EBrainClient,
} from "./contracts";

export function createHttpEBrainClient(
  baseUrl: string,
  token: string,
): EBrainClient {
  const url = baseUrl.replace(/\/+$/, "");
  const project = `project=${encodeURIComponent(DEFAULT_PROJECT)}`;

  async function request<T>(path: string, body?: object): Promise<T> {
    const response = await fetch(url + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new EBrainHttpError(response.status, await response.text());
    }
    return response.json() as Promise<T>;
  }

  return {
    baseUrl: url,
    getLimits(projectId = DEFAULT_PROJECT) {
      return request(
        `/v1/ebrain/limits?project=${encodeURIComponent(projectId)}`,
      );
    },
    listChains(cursor = 0) {
      return request(`/v1/ebrain/chains?${project}&cursor=${cursor}`);
    },
    getChain(chain) {
      return request(
        `/v1/ebrain/chains/${encodeURIComponent(chain)}?${project}`,
      );
    },
    getHeal() {
      return request(`/v1/ebrain/heal?${project}`);
    },
    async approveHeal(opId, ts) {
      await request(`/v1/ebrain/heal/${encodeURIComponent(opId)}/approve`, {
        ts,
      });
    },
    listPairs() {
      return request(`/v1/ebrain/pairs?${project}`);
    },
    async confirmPair(a, b, ts) {
      await request("/v1/ebrain/pairs/confirm", {
        project_id: DEFAULT_PROJECT,
        a,
        b,
        ts,
      });
    },
    async splitPair(a, b, ts) {
      await request("/v1/ebrain/pairs/split", {
        project_id: DEFAULT_PROJECT,
        a,
        b,
        ts,
      });
    },
  };
}

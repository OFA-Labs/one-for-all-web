import {
  HistoryHttpError,
  type HistoryClient,
  type ListParams,
  type RangeParams,
} from "./contracts";
import {
  toCalendar,
  toDetail,
  toPage,
  toPeriod,
  type ApiCalendar,
  type ApiDetail,
  type ApiPage,
  type ApiPeriod,
} from "./view-model";

/** Builds a query string, omitting empty values so URLs stay short and cacheable-by-nobody. */
function query(entries: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === "") continue;
    params.set(
      key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

const statusFilter = (status?: string) =>
  status && status !== "all" ? status : undefined;

function rangeQuery(p: RangeParams) {
  return query({
    from: p.from,
    to: p.to,
    tz: p.tz,
    q: p.q,
    status: statusFilter(p.status),
    include_sample: p.includeSample === false ? false : undefined,
  });
}

/** Maps any failure to a HistoryHttpError; an abort is passed through untouched. */
async function failure(response: Response): Promise<HistoryHttpError> {
  let code = "request_failed";
  let message = `History request failed (${response.status}).`;
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
  } catch {
    /* a non-JSON error body keeps the generic code */
  }
  return new HistoryHttpError(response.status, code, message);
}

/**
 * Live client. `base` is a same-origin proxy path such as "/api/history". It sends no
 * credentials of its own: the Next.js proxy adds the server-side bearer token.
 */
export function createHttpHistoryClient(base: string): HistoryClient {
  const root = base.replace(/\/+$/, "");

  async function send(path: string, signal?: AbortSignal): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(root + path, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal,
      });
    } catch (error) {
      if (signal?.aborted || (error as Error)?.name === "AbortError")
        throw error;
      throw new HistoryHttpError(
        0,
        "service_unavailable",
        "History is unreachable.",
      );
    }
    if (!response.ok) throw await failure(response);
    return response;
  }

  async function json<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await send(path, signal);
    try {
      return (await response.json()) as T;
    } catch {
      throw new HistoryHttpError(
        response.status,
        "invalid_response",
        "History returned an unreadable response.",
      );
    }
  }

  return {
    mode: "live",
    async listTasks(p: ListParams, signal) {
      return toPage(
        await json<ApiPage>(
          "/tasks" +
            query({
              q: p.q,
              status: statusFilter(p.status),
              state: p.state,
              tier: p.tier,
              from: p.from,
              to: p.to,
              tz: p.tz,
              cursor: p.cursor,
              limit: p.limit,
              sort: p.sort,
              include_sample: p.includeSample === false ? false : undefined,
            }),
          signal,
        ),
      );
    },
    async getPeriod(p, signal) {
      return toPeriod(
        await json<ApiPeriod>("/history/period" + rangeQuery(p), signal),
      );
    },
    async getCalendar(p, signal) {
      return toCalendar(
        await json<ApiCalendar>("/history/calendar" + rangeQuery(p), signal),
      );
    },
    async getTask(id, signal) {
      return toDetail(
        await json<ApiDetail>(`/tasks/${encodeURIComponent(id)}`, signal),
      );
    },
    async exportTask(id, signal) {
      return (
        await send(`/tasks/${encodeURIComponent(id)}/export`, signal)
      ).blob();
    },
  };
}

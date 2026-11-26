"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import {
  addDays,
  displayCivil,
  eventCivilDate,
  eventMinutes,
  eventTime,
  getMonthDays,
  getPeriodBounds,
  getPeriodLabel,
  getTodayInZone,
  relativeDay,
  shiftPeriod,
  startOfWeek,
  TIME_ZONE_OPTIONS,
  type CalendarView,
} from "@/features/history/lib/history-calendar";
import { DEFAULT_TIME_ZONE } from "@/lib/history/civil";
import {
  DISPLAY_STATUSES,
  type HistoryClient,
  type HistoryItem,
} from "@/lib/history/contracts";
import { IntegrationButton } from "@/components/common";
import { TaskDetail } from "@/components/tasks/task-detail";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounced } from "../hooks/use-debounced";
import { useHistoryClient } from "../hooks/use-history-client";
import {
  useHistoryCalendar,
  useHistoryLatest,
  useHistoryPeriod,
} from "../hooks/use-history-data";
import { describeError } from "../lib/format";
import { HistoryTaskDetail } from "./history-task-detail";
import "./history-calendar.css";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const DEFAULT_BLOCK_MINUTES = 45;
const blockMinutes = (task: HistoryItem) =>
  task.durationMs === null
    ? DEFAULT_BLOCK_MINUTES
    : Math.round(task.durationMs / 60_000);
function EventButton({
  task,
  timeZone,
  compact = false,
  onOpen,
}: {
  task: HistoryItem;
  timeZone: string;
  compact?: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`hc-event ${compact ? "compact" : ""}`}
      data-status={task.status.toLowerCase().replaceAll(" ", "-")}
      onClick={() => onOpen(task.id)}
      aria-label={`Open task details for ${task.title}`}
      title={`${task.title} · ${eventTime(task.occurredAt, timeZone)} · ${task.status}${task.isSample && !compact ? " · demo record" : ""}`}
    >
      <strong>{task.title}</strong>
      <span>
        {eventTime(task.occurredAt, timeZone)}
        {!compact && ` · ${task.status}`}
      </span>
    </button>
  );
}
function MonthMini({
  anchor,
  selected,
  today,
  onSelect,
  onOpenMonth,
  yearMode = false,
  taskDays,
}: {
  anchor: string;
  selected: string;
  today: string;
  onSelect: (date: string) => void;
  onOpenMonth?: (date: string) => void;
  yearMode?: boolean;
  taskDays: Set<string>;
}) {
  const month = anchor.slice(0, 7);
  return (
    <div className={`hc-mini-month ${yearMode ? "year-month" : ""}`}>
      {yearMode && (
        <button
          className="hc-month-name"
          onClick={() =>
            onOpenMonth ? onOpenMonth(`${month}-01`) : onSelect(`${month}-01`)
          }
          aria-label={`Open ${displayCivil(anchor, { month: "long", year: "numeric" })}`}
        >
          {displayCivil(anchor, { month: "long" })}
        </button>
      )}
      <div className="hc-mini-weekdays" aria-hidden="true">
        {weekdays.map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
      <div className="hc-mini-days">
        {getMonthDays(anchor).map((date) => (
          <button
            key={date}
            className={`${date.slice(0, 7) !== month ? "outside " : ""}${date === selected ? "selected " : ""}${date === today ? "today " : ""}${taskDays.has(date) ? "has-events" : ""}`}
            onClick={() => onSelect(date)}
            aria-label={`${yearMode ? "Open" : "Select"} ${displayCivil(date, { day: "numeric", month: "long", year: "numeric" })}`}
            aria-current={date === today ? "date" : undefined}
          >
            <span>{Number(date.slice(8))}</span>
            {taskDays.has(date) && <i aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
function TimeGrid({
  anchor,
  view,
  tasks,
  today,
  timeZone,
  zoneShort,
  onSelect,
  onOpenTask,
}: {
  anchor: string;
  view: "day" | "week";
  tasks: HistoryItem[];
  today: string;
  timeZone: string;
  zoneShort: string;
  onSelect: (date: string) => void;
  onOpenTask: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const dates =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))
      : [anchor];
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 8 * 64;
  }, [anchor, view]);
  return (
    <div
      className={`hc-schedule-scroll ${view}`}
      ref={scroller}
      aria-label={`${view === "week" ? "Week" : "Day"} task calendar`}
      tabIndex={0}
    >
      <div
        className="hc-schedule-width"
        style={{ minWidth: view === "week" ? 650 : 0 }}
      >
        <div
          className="hc-schedule-header"
          style={{
            gridTemplateColumns: `64px repeat(${dates.length},minmax(0,1fr))`,
          }}
        >
          <div className="hc-zone">{zoneShort}</div>
          {dates.map((date) => (
            <button
              key={date}
              className={date === today ? "today" : ""}
              onClick={() => onSelect(date)}
              aria-label={`Open ${displayCivil(date, { day: "numeric", month: "long", year: "numeric" })}`}
            >
              <span>{displayCivil(date, { weekday: "short" })}</span>
              <strong>{Number(date.slice(8))}</strong>
            </button>
          ))}
        </div>
        <div className="hc-time-body">
          <div className="hc-hours">
            {Array.from({ length: 24 }, (_, hour) => (
              <div className="hc-hour" key={hour}>
                <span>
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>
          <div
            className="hc-day-columns"
            style={{
              gridTemplateColumns: `repeat(${dates.length},minmax(0,1fr))`,
            }}
          >
            {dates.map((date) => {
              const dayTasks = tasks
                .filter(
                  (task) => eventCivilDate(task.occurredAt, timeZone) === date,
                )
                .sort(
                  (a, b) =>
                    eventMinutes(a.occurredAt, timeZone) -
                    eventMinutes(b.occurredAt, timeZone),
                );
              return (
                <div className="hc-day-column" key={date}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div className="hc-hour-line" key={i} />
                  ))}
                  {dayTasks.map((task, index) => {
                    const start = eventMinutes(task.occurredAt, timeZone);
                    const overlaps = dayTasks.filter(
                      (other) =>
                        eventMinutes(other.occurredAt, timeZone) <
                          start + blockMinutes(task) &&
                        eventMinutes(other.occurredAt, timeZone) +
                          blockMinutes(other) >
                          start,
                    );
                    const lane = overlaps.indexOf(task);
                    return (
                      <div
                        className="hc-timed-event"
                        key={task.id}
                        style={{
                          top: (start / 60) * 64,
                          height: Math.max(
                            38,
                            (blockMinutes(task) / 60) * 64 - 3,
                          ),
                          left: `calc(${(lane / overlaps.length) * 100}% + 3px)`,
                          width: `calc(${100 / overlaps.length}% - 6px)`,
                          zIndex: index + 1,
                        }}
                      >
                        <EventButton
                          task={task}
                          timeZone={timeZone}
                          onOpen={onOpenTask}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryHeading() {
  return (
    <div className="hc-heading">
      <span className="hc-calendar-icon">
        <Image
          src="/media/history-plugins.webp"
          alt=""
          width={28}
          height={28}
          unoptimized
          aria-hidden="true"
        />
      </span>
      <div>
        <h1 id="history-title">History</h1>
        <p>Your work, in its own time.</p>
      </div>
    </div>
  );
}

/** Shown on the server and until the browser knows whether History is live or a preview. */
function HistorySkeleton() {
  return (
    <section
      className="history-calendar"
      aria-labelledby="history-title"
      aria-busy="true"
    >
      <header className="hc-toolbar">
        <HistoryHeading />
      </header>
      <div className="hc-empty-period" role="status">
        <h3>Loading history…</h3>
      </div>
    </section>
  );
}

export function HistoryCalendar() {
  const client = useHistoryClient();
  return client ? <HistoryWorkspace client={client} /> : <HistorySkeleton />;
}

function HistoryWorkspace({ client }: { client: HistoryClient }) {
  const live = client.mode === "live";
  const [timeZone, setTimeZone] = useState<string>(DEFAULT_TIME_ZONE);
  // null = "follow the latest activity"; set once the user navigates.
  const [anchorChoice, setAnchor] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("day");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const searchText = useDebounced(query.trim(), 250);

  const today = getTodayInZone(new Date(), timeZone);
  const latest = useHistoryLatest(client);
  const latestKnown =
    latest.state.status === "ready" || latest.state.status === "error";
  const latestMs = latest.state.status === "ready" ? latest.state.data : null;
  const latestDate =
    latestMs === null ? today : eventCivilDate(latestMs, timeZone);
  const anchor = anchorChoice ?? latestDate;

  const bounds = getPeriodBounds(anchor, view);
  const gridDays = getMonthDays(anchor);
  const grid = { from: gridDays[0], to: addDays(gridDays[41], 1) };
  const filters = { q: searchText, status };
  const periodRange =
    latestKnown && view !== "year"
      ? {
          ...(view === "month" ? grid : { from: bounds.start, to: bounds.end }),
        }
      : null;
  const calendarRange = latestKnown
    ? view === "year"
      ? { from: bounds.start, to: bounds.end }
      : grid
    : null;
  const period = useHistoryPeriod(
    client,
    periodRange && { ...periodRange, tz: timeZone, ...filters },
  );
  const calendar = useHistoryCalendar(
    client,
    calendarRange && { ...calendarRange, tz: timeZone, ...filters },
  );

  const zoneLabel =
    TIME_ZONE_OPTIONS.find((option) => option.value === timeZone)?.label ||
    "the selected time zone";
  const zoneShort =
    timeZone === "Asia/Kolkata"
      ? "GMT+5:30"
      : timeZone === "UTC"
        ? "UTC"
        : timeZone === "Europe/London"
          ? "UK time"
          : "ET";

  const items = period.state.status === "ready" ? period.state.data.items : [];
  const truncatedBy =
    period.state.status === "ready" && period.state.data.truncated
      ? period.state.data.total - period.state.data.items.length
      : 0;
  const taskDays = new Set(
    calendar.state.status === "ready"
      ? calendar.state.data.days.map((day) => day.date)
      : [],
  );
  const itemsByDay = new Map<string, HistoryItem[]>();
  for (const task of items) {
    const day = eventCivilDate(task.occurredAt, timeZone);
    itemsByDay.set(day, [...(itemsByDay.get(day) ?? []), task]);
  }
  const inPeriod = items.filter((task) => {
    const day = eventCivilDate(task.occurredAt, timeZone);
    return day >= bounds.start && day < bounds.end;
  });
  const yearCount =
    calendar.state.status === "ready"
      ? calendar.state.data.days
          .filter((day) => day.date >= bounds.start && day.date < bounds.end)
          .reduce((sum, day) => sum + day.count, 0)
      : 0;
  const main = view === "year" ? calendar : period;
  const mainReady = latestKnown && main.state.status === "ready";
  const recordCount = view === "year" ? yearCount : inPeriod.length;
  const filtersActive = !!searchText || status !== "all";
  const noSearchMatches = mainReady && recordCount === 0 && filtersActive;
  const noun = live ? "task" : "sample task";
  const selectedTask = items.find((task) => task.id === selectedTaskId);

  const selectDay = (date: string) => {
    setAnchor(date);
    setView("day");
  };
  const selectMonth = (date: string) => {
    setAnchor(date);
    setView("month");
  };
  const shift = (amount: number) => {
    setAnchor(shiftPeriod(anchor, view, amount));
  };
  const clearFilters = () => {
    setQuery("");
    setStatus("all");
  };
  const retry = () => {
    latest.retry();
    period.retry();
    calendar.retry();
  };
  const failed =
    latest.state.status === "error" || main.state.status === "error";

  return (
    <section className="history-calendar" aria-labelledby="history-title">
      <header className="hc-toolbar">
        <HistoryHeading />
        <div className="hc-controls">
          <div
            className="hc-navigation"
            role="group"
            aria-label="History period navigation"
          >
            <button
              className="hc-button hc-today-reset"
              aria-label="Go to today"
              title="Go to today"
              onClick={() => {
                setAnchor(today);
                setView("day");
              }}
            >
              <CalendarDays size={15} aria-hidden="true" />
              <span>Today</span>
            </button>
            <button
              className="hc-button"
              aria-label="Go to most recent activity"
              title="Go to most recent activity"
              onClick={() => {
                setAnchor(latestDate);
                setView("day");
              }}
            >
              <span className="hc-latest-label">Latest activity</span>
            </button>
            <button
              className="hc-button"
              aria-label={`Previous ${view}`}
              title={`Previous ${view}`}
              onClick={() => shift(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span>Prev</span>
            </button>
            <button
              className="hc-button"
              aria-label={`Next ${view}`}
              title={`Next ${view}`}
              onClick={() => shift(1)}
            >
              <span>Next</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <label className="hc-zone-control">
            <span>Time zone</span>
            <select
              aria-label="History time zone"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            >
              {TIME_ZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="hc-views"
          role="group"
          aria-label="History calendar view"
        >
          {(["day", "week", "month", "year"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
            >
              {mode === "day" ? "Today" : mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </header>
      <div className="hc-workspace" data-view={view}>
        <aside className="hc-sidebar" aria-label="Calendar date picker">
          <div className="hc-mini-heading">
            <strong>
              {displayCivil(anchor, { month: "long", year: "numeric" })}
            </strong>
            <button
              aria-label="Previous picker month"
              onClick={() => setAnchor(shiftPeriod(anchor, "month", -1))}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="Next picker month"
              onClick={() => setAnchor(shiftPeriod(anchor, "month", 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <MonthMini
            anchor={anchor}
            selected={anchor}
            today={today}
            taskDays={taskDays}
            onSelect={selectDay}
          />
          <div className="hc-activity-label">
            <span className="hc-activity-dot" />
            Task activity
          </div>
          <p className="hc-sidebar-note">
            {live
              ? "Dots mark days with recorded tasks. Select a date to explore its history."
              : "Dots mark days with sample tasks. Select a date to explore its history."}
          </p>
          {calendar.state.status === "error" && (
            <p className="hc-sidebar-note" role="status">
              Task-day markers couldn’t load.
            </p>
          )}
          <div className="hc-sidebar-bottom">
            <span>{live ? "Your history" : "Sample workspace"}</span>
            <p>
              {live
                ? "A read-only record of finished and parked tasks. Demo records are labelled."
                : "All seven records are fictional. No account data is being fetched."}
            </p>
            {!live && (
              <IntegrationButton
                id="history.list"
                label="History integration"
              />
            )}
          </div>
        </aside>
        <div className="hc-main" aria-busy={!mainReady && !failed}>
          <div className="hc-period-row">
            <div>
              <h2 data-testid="history-period-label">
                {latestKnown ? getPeriodLabel(anchor, view) : "Loading…"}
              </h2>
              {view === "day" && latestKnown && (
                <span className="hc-relative-day" role="status">
                  {relativeDay(anchor, today)}
                </span>
              )}
            </div>
            <span className="hc-record-count" role="status">
              {mainReady
                ? `${recordCount} ${noun}${recordCount === 1 ? "" : "s"}${
                    truncatedBy > 0 ? ` · +${truncatedBy} more` : ""
                  }`
                : "Loading…"}
            </span>
          </div>
          <div className="hc-filters">
            <div className="hc-search">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search task history"
                placeholder="Search task history"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  aria-label="Clear history search"
                  onClick={() => setQuery("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <label className="sr-only" htmlFor="hc-status">
              Filter history by status
            </label>
            <select
              id="hc-status"
              aria-label="Filter history by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {DISPLAY_STATUSES.filter(
                (value) => live || (value !== "Cancelled" && value !== "Error"),
              ).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          {failed ? (
            <div className="hc-empty-period" role="alert">
              <h3>Couldn’t load history.</h3>
              <p>
                {describeError(
                  latest.state.status === "error"
                    ? latest.state.error
                    : main.state.status === "error"
                      ? main.state.error
                      : null,
                )}
              </p>
              <button className="hc-button" onClick={retry}>
                Try again
              </button>
            </div>
          ) : !mainReady ? (
            <div className="hc-empty-period" role="status">
              <h3>Loading history…</h3>
            </div>
          ) : noSearchMatches ? (
            <div className="hc-empty">
              <Search size={27} aria-hidden="true" />
              <h3>Nothing matches this search.</h3>
              <p>
                Nothing in this period matches. Try another search, clear the
                status filter, or browse another date.
              </p>
              <button className="hc-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {recordCount === 0 && (
                <div className="hc-empty-period" role="status">
                  <h3>No tasks in this period.</h3>
                  <p>
                    There’s nothing recorded here. Browse another period or jump
                    back to today.
                  </p>
                </div>
              )}
              {truncatedBy > 0 && (
                <div className="hc-empty-period" role="status">
                  <h3>+{truncatedBy} more tasks in this period.</h3>
                  <p>Narrow your search or status filter to see them.</p>
                </div>
              )}
              {(view === "day" || view === "week") && (
                <TimeGrid
                  anchor={anchor}
                  view={view}
                  tasks={items}
                  today={today}
                  timeZone={timeZone}
                  zoneShort={zoneShort}
                  onSelect={selectDay}
                  onOpenTask={setSelectedTaskId}
                />
              )}
              {view === "month" && (
                <div className="hc-month-view">
                  <div className="hc-month-weekdays">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <span key={day}>{day}</span>
                      ),
                    )}
                  </div>
                  <div className="hc-month-cells">
                    {gridDays.map((date) => (
                      <div
                        className={`hc-month-cell ${date.slice(0, 7) !== anchor.slice(0, 7) ? "outside" : ""}`}
                        key={date}
                      >
                        <button
                          className={`hc-day-number ${date === today ? "today" : ""}`}
                          aria-label={`Open ${displayCivil(date, { day: "numeric", month: "long", year: "numeric" })}`}
                          onClick={() => selectDay(date)}
                          aria-current={date === today ? "date" : undefined}
                        >
                          {Number(date.slice(8))}
                        </button>
                        <div className="hc-month-events">
                          {(itemsByDay.get(date) ?? []).map((task) => (
                            <EventButton
                              key={task.id}
                              task={task}
                              timeZone={timeZone}
                              compact
                              onOpen={setSelectedTaskId}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {view === "year" && (
                <div className="hc-year-view">
                  {Array.from(
                    { length: 12 },
                    (_, month) =>
                      `${anchor.slice(0, 4)}-${String(month + 1).padStart(2, "0")}-01`,
                  ).map((month) => (
                    <MonthMini
                      key={month}
                      anchor={month}
                      selected={anchor}
                      today={today}
                      taskDays={taskDays}
                      onSelect={selectDay}
                      onOpenMonth={selectMonth}
                      yearMode
                    />
                  ))}
                </div>
              )}
            </>
          )}
          <div className="hc-footer-note">
            Times shown in {zoneLabel}.{" "}
            {live
              ? "Select a task to open its read-only audit record without leaving this page."
              : "Select a task to preview its existing details without leaving this page."}
          </div>
        </div>
      </div>
      <Dialog
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
      >
        <DialogContent
          className="hc-task-dialog"
          overlayClassName="hc-task-overlay"
          showCloseButton={false}
        >
          <div className="hc-task-dialog-bar">
            <DialogTitle className="sr-only">
              {selectedTask?.title || "Task details"}
            </DialogTitle>
            <span>Task details</span>
            <DialogClose asChild>
              <button
                type="button"
                className="hc-task-close"
                aria-label="Close task details"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">
            {live
              ? "Read-only audit record for this task."
              : "Read-only details for this sample task. No real website or account was used."}
          </DialogDescription>
          <div className="hc-task-dialog-body">
            {selectedTaskId &&
              (live ? (
                <HistoryTaskDetail
                  client={client}
                  id={selectedTaskId}
                  timeZone={timeZone}
                />
              ) : (
                <TaskDetail id={selectedTaskId} />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

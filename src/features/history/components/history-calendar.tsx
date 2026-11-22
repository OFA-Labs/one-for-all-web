"use client";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { historyRows } from "@/lib/demo";
import {
  addDays,
  displayCivil,
  eventCivilDate,
  eventMinutes,
  eventTime,
  getMonthDays,
  getPeriodBounds,
  getPeriodLabel,
  getTodayInKolkata,
  getCalendarTimeZone,
  relativeDay,
  setCalendarTimeZone,
  shiftPeriod,
  startOfWeek,
  TIME_ZONE_OPTIONS,
  type CalendarView,
} from "@/features/history/lib/history-calendar";
import { IntegrationButton } from "@/components/common";
import { TaskDetail } from "@/components/tasks/task-detail";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import "./history-calendar.css";

type HistoryTask = (typeof historyRows)[number];
const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const LATEST_ACTIVITY_DATE =
  historyRows.map((task) => eventCivilDate(task.timestamp)).sort().at(-1) ||
  getTodayInKolkata();
const duration = (task: HistoryTask) =>
  task.scenario === "jobs"
    ? 70
    : task.scenario === "social"
      ? 80
      : task.scenario === "decline"
        ? 20
        : 45;
function EventButton({
  task,
  compact = false,
  onOpen,
}: {
  task: HistoryTask;
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
      title={`${task.title} · ${eventTime(task.timestamp)} · ${task.status}`}
    >
      <strong>{task.title}</strong>
      <span>
        {eventTime(task.timestamp)}
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
  zoneShort,
  onSelect,
  onOpenTask,
}: {
  anchor: string;
  view: "day" | "week";
  tasks: HistoryTask[];
  today: string;
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
                .filter((task) => eventCivilDate(task.timestamp) === date)
                .sort(
                  (a, b) =>
                    eventMinutes(a.timestamp) - eventMinutes(b.timestamp),
                );
              return (
                <div className="hc-day-column" key={date}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div className="hc-hour-line" key={i} />
                  ))}
                  {dayTasks.map((task, index) => {
                    const start = eventMinutes(task.timestamp);
                    const overlaps = dayTasks.filter(
                      (other) =>
                        eventMinutes(other.timestamp) <
                          start + duration(task) &&
                        eventMinutes(other.timestamp) + duration(other) > start,
                    );
                    const lane = overlaps.indexOf(task);
                    return (
                      <div
                        className="hc-timed-event"
                        key={task.id}
                        style={{
                          top: (start / 60) * 64,
                          height: Math.max(38, (duration(task) / 60) * 64 - 3),
                          left: `calc(${(lane / overlaps.length) * 100}% + 3px)`,
                          width: `calc(${100 / overlaps.length}% - 6px)`,
                          zIndex: index + 1,
                        }}
                      >
                        <EventButton task={task} onOpen={onOpenTask} />
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

export function HistoryCalendar() {
  const today = getTodayInKolkata();
  // Start where the sample activity is, not on an empty "today".
  const [anchor, setAnchor] = useState(LATEST_ACTIVITY_DATE);
  const [timeZone, setTimeZone] = useState(getCalendarTimeZone);
  const [view, setView] = useState<CalendarView>("day");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  useEffect(() => {
    setCalendarTimeZone(timeZone);
  }, [timeZone]);
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
  const selectedTask = historyRows.find((task) => task.id === selectedTaskId);
  const filtered = historyRows.filter(
    (task) =>
      `${task.title} ${task.subtitle}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || task.status === status),
  );
  const bounds = getPeriodBounds(anchor, view);
  const tasks = filtered.filter((task) => {
    const day = eventCivilDate(task.timestamp);
    return day >= bounds.start && day < bounds.end;
  });
  const taskDays = new Set(
    filtered.map((task) => eventCivilDate(task.timestamp)),
  );
  const selectDay = (date: string) => {
    setAnchor(date);
    setView("day");
  };
  const selectMonth = (date: string) => {
    setAnchor(date);
    setView("month");
  };
  const chooseView = (next: CalendarView) => {
    setView(next);
    if (next === "day") setAnchor(LATEST_ACTIVITY_DATE);
  };
  const shift = (amount: number) => {
    setAnchor((value) => shiftPeriod(value, view, amount));
  };
  const clearFilters = () => {
    setQuery("");
    setStatus("all");
  };
  const noSearchMatches =
    filtered.length === 0 && (!!query || status !== "all");
  return (
    <section className="history-calendar" aria-labelledby="history-title">
      <header className="hc-toolbar">
        <div className="hc-heading">
          <span className="hc-calendar-icon">
            <CalendarDays size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 id="history-title">History</h1>
            <p>Your work, in its own time.</p>
          </div>
        </div>
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
                setAnchor(LATEST_ACTIVITY_DATE);
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
              onClick={() => chooseView(mode)}
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
              onClick={() =>
                setAnchor((value) => shiftPeriod(value, "month", -1))
              }
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="Next picker month"
              onClick={() =>
                setAnchor((value) => shiftPeriod(value, "month", 1))
              }
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
            Dots mark days with sample tasks. Select a date to explore its
            history.
          </p>
          <div className="hc-sidebar-bottom">
            <span>Sample workspace</span>
            <p>
              All seven records are fictional. No account data is being fetched.
            </p>
            <IntegrationButton id="history.list" label="History integration" />
          </div>
        </aside>
        <div className="hc-main">
          <div className="hc-period-row">
            <div>
              <h2 data-testid="history-period-label">
                {getPeriodLabel(anchor, view)}
              </h2>
              {view === "day" && (
                <span className="hc-relative-day" role="status">
                  {relativeDay(anchor, today)}
                </span>
              )}
            </div>
            <span className="hc-record-count" role="status">
              {tasks.length} sample {tasks.length === 1 ? "task" : "tasks"}
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
              {[
                "Verified",
                "Needs review",
                "Submitted",
                "Declined",
                "Paused",
                "Unknown",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          {noSearchMatches ? (
            <div className="hc-empty">
              <Search size={27} aria-hidden="true" />
              <h3>Nothing matches this search.</h3>
              <p>Try another search or clear the status filter.</p>
              <button className="hc-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {!tasks.length && (
                <div className="hc-empty-period" role="status">
                  <h3>No tasks in this period.</h3>
                  <p>
                    {query || status !== "all"
                      ? "Your filters hide this period’s tasks. Try clearing them or browse another date."
                      : "There’s nothing recorded here. Browse another period or jump back to today."}
                  </p>
                </div>
              )}
              {(view === "day" || view === "week") && (
                <TimeGrid
                  anchor={anchor}
                  view={view}
                  tasks={tasks}
                  today={today}
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
                    {getMonthDays(anchor).map((date) => (
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
                          {filtered
                            .filter(
                              (task) => eventCivilDate(task.timestamp) === date,
                            )
                            .map((task) => (
                              <EventButton
                                key={task.id}
                                task={task}
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
            Times shown in {zoneLabel}. Select a task to preview its existing
            details without leaving this page.
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
            Read-only details for this sample task. No real website or account
            was used.
          </DialogDescription>
          <div className="hc-task-dialog-body">
            {selectedTaskId && <TaskDetail id={selectedTaskId} />}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

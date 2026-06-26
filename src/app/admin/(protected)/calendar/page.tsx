"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PollResponse } from "@/types/database";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface DayAssignModalProps {
  date: string;
  currentPoll: PollResponse | undefined;
  unassigned: PollResponse[];
  onClose: () => void;
  onAssign: (pollId: string, date: string) => void;
  onUnassign: (pollId: string) => void;
}

function DayAssignModal({
  date,
  currentPoll,
  unassigned,
  onClose,
  onAssign,
  onUnassign,
}: DayAssignModalProps) {
  const [selected, setSelected] = useState(currentPoll?.id ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentPoll && selected !== currentPoll.id) {
        await onUnassign(currentPoll.id);
      }
      if (selected && selected !== currentPoll?.id) {
        await onAssign(selected, date);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!currentPoll) return;
    setSaving(true);
    try {
      await onUnassign(currentPoll.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const formatted = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-title"
    >
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/[0.08] bg-[#121212] p-7 shadow-2xl">
        <div>
          <h2 id="assign-title" className="text-lg font-bold text-white/90">
            {formatted}
          </h2>
          <p className="mt-1 text-[0.875rem] text-white/40">
            {currentPoll ? "Assigned poll:" : "No poll assigned."}
          </p>
        </div>

        {currentPoll && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[0.875rem] text-white/75">{currentPoll.question}</p>
          </div>
        )}

        <div>
          <label htmlFor="poll-select" className="mb-1.5 block text-[0.8125rem] font-medium text-white/50">
            Assign a draft poll
          </label>
          <select
            id="poll-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[0.875rem] text-white/75 outline-none focus:border-white/[0.18]"
          >
            <option value="" className="bg-[#1a1a1a]">— Select a poll —</option>
            {unassigned.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                {p.question}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selected}
            className="flex-1 rounded-xl bg-white/[0.09] py-2.5 text-[0.875rem] font-medium text-white/80 transition-colors hover:bg-white/[0.14] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Assign"}
          </button>
          {currentPoll && (
            <button
              type="button"
              onClick={handleUnassign}
              disabled={saving}
              className="rounded-xl bg-red-500/10 px-4 py-2.5 text-[0.875rem] text-red-300/70 transition-colors hover:bg-red-500/18 disabled:opacity-40"
            >
              Unassign
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[0.875rem] text-white/35 transition-colors hover:text-white/60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [pollsByDate, setPollsByDate] = useState<Map<string, PollResponse>>(new Map());
  const [draftPolls, setDraftPolls] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = now.toISOString().slice(0, 10);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [publishedRes, draftRes] = await Promise.all([
        fetch("/api/admin/polls?status=published&limit=200"),
        fetch("/api/admin/polls?status=draft&limit=300"),
      ]);
      const [publishedData, draftData] = await Promise.all([
        publishedRes.json(),
        draftRes.json(),
      ]);

      const scheduled = await fetch(
        "/api/admin/polls?status=scheduled&limit=365"
      ).then((r) => r.json());

      const all = [
        ...(publishedData.polls ?? []),
        ...(scheduled.polls ?? []),
      ] as PollResponse[];

      const map = new Map<string, PollResponse>();
      for (const p of all) {
        if (p.date) map.set(p.date, p);
      }

      setPollsByDate(map);
      setDraftPolls((draftData.polls ?? []) as PollResponse[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async (pollId: string, date: string) => {
    await fetch(`/api/admin/polls/${pollId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, status: "scheduled" }),
    });
    await loadData();
  };

  const handleUnassign = async (pollId: string) => {
    await fetch(`/api/admin/polls/${pollId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: null, status: "draft" }),
    });
    await loadData();
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const selectedPoll = selectedDay ? pollsByDate.get(selectedDay) : undefined;
  const unassignedDrafts = draftPolls.filter((p) => !p.date);

  return (
    <>
      {selectedDay && (
        <DayAssignModal
          date={selectedDay}
          currentPoll={selectedPoll}
          unassigned={unassignedDrafts}
          onClose={() => setSelectedDay(null)}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">
              Calendar
            </h1>
            <p className="mt-1 text-[0.875rem] text-white/38">
              {draftPolls.filter((p) => !p.date).length} unscheduled drafts available
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2 text-white/50 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-purple-400/60"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-36 text-center text-[0.9375rem] font-semibold text-white/80">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2 text-white/50 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-purple-400/60"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[0.75rem] font-semibold uppercase tracking-wide text-white/22">
                {d}
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-white/[0.06]">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2.5 text-center text-[0.72rem] font-semibold uppercase tracking-wider text-white/25">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[5rem] border-b border-r border-white/[0.04] last:border-r-0 bg-white/[0.005]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = toDateStr(year, month, day);
                const poll = pollsByDate.get(dateStr);
                const isToday = dateStr === today;
                const isPast = dateStr < today;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(dateStr)}
                    className={`group relative min-h-[5rem] border-b border-r border-white/[0.04] p-2 text-left transition-colors last:border-r-0 focus-visible:outline-2 focus-visible:outline-purple-400/60 ${
                      isPast
                        ? "opacity-50 hover:bg-white/[0.02]"
                        : poll
                        ? "hover:bg-white/[0.03]"
                        : "hover:bg-purple-500/[0.04]"
                    }`}
                    aria-label={`${dateStr}${poll ? ": " + poll.question : " — no poll"}`}
                  >
                    {/* Day number */}
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[0.8125rem] font-medium ${
                        isToday
                          ? "bg-purple-500/30 text-purple-200"
                          : "text-white/40"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Poll badge */}
                    {poll && (
                      <p className="mt-1 line-clamp-2 text-[0.68rem] leading-snug text-white/55">
                        {poll.question}
                      </p>
                    )}

                    {/* Empty slot indicator */}
                    {!poll && !isPast && (
                      <p className="mt-1 text-[0.68rem] text-white/15 opacity-0 transition-opacity group-hover:opacity-100">
                        + Assign
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-5 text-[0.78rem] text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500/40" />
            Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/20" />
            Poll assigned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
            Empty
          </span>
        </div>
      </div>
    </>
  );
}

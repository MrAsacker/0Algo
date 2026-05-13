"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Clock,
  Youtube,
  X,
  StickyNote,
  Save,
  ChevronLeft,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { getCpLadderProgress, updateCpLadderProgress } from "@/actions/cp-ladder";

// ── Types ──────────────────────────────────────────────────────────────────
type Problem = {
  title: string;
  videoUrl: string;
  solveLink: string;
};

type Status = "none" | "solved" | "attempted";

type ProblemMeta = {
  status: Status;
  bookmarked: boolean;
  note: string;
};

type Props = {
  slug: string;
  displayName: string;
  problems: Problem[];
  availableLadders: { slug: string; displayName: string }[];
};

// ── Status cycle helper ────────────────────────────────────────────────────
const STATUS_CYCLE: Status[] = ["none", "attempted", "solved"];
function nextStatus(current: Status): Status {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

const STATUS_CONFIG: Record<Status, { icon: React.ReactNode; label: string; color: string }> = {
  none: {
    icon: <Circle size={18} />,
    label: "Not Started",
    color: "text-zinc-500",
  },
  attempted: {
    icon: <Clock size={18} />,
    label: "Attempted",
    color: "text-yellow-400",
  },
  solved: {
    icon: <CheckCircle2 size={18} />,
    label: "Solved",
    color: "text-green-400",
  },
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function CpLadderClient({ slug, displayName, problems, availableLadders }: Props) {
  const router = useRouter();
  const storageKey = `cp_ladder_${slug}`;
  const { userId } = useAuth();

  // ── State ──
  const [meta, setMeta] = useState<Record<number, ProblemMeta>>({});
  const [filter, setFilter] = useState<"all" | "bookmarked" | "notes">("all");
  const [videoModal, setVideoModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  });
  const [noteModal, setNoteModal] = useState<{ open: boolean; idx: number; draft: string }>({
    open: false,
    idx: -1,
    draft: "",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Track which problem indices were changed locally since mount (for merge logic)
  const localChanges = useRef<Set<number>>(new Set());

  // ── Load from DB or localStorage ──
  useEffect(() => {
    // Reset local changes tracking on slug change
    localChanges.current = new Set();

    // 1. Fast path: optimistic load from localStorage
    let localMeta: Record<number, ProblemMeta> = {};
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        localMeta = JSON.parse(stored);
        setMeta(localMeta);
      }
    } catch {}

    // 2. Slow path: fetch from DB and merge into localStorage
    async function loadData() {
      if (!userId) return;
      const dbData = await getCpLadderProgress(slug);
      if (!dbData) return;

      // Merge strategy: DB is the authoritative base.
      // Any problem the user toggled SINCE this mount (tracked in localChanges) keeps its freshest local value.
      const merged: Record<number, ProblemMeta> = { ...(dbData as any) };

      try {
        const freshStored = localStorage.getItem(storageKey);
        if (freshStored) {
          const freshLocalMeta = JSON.parse(freshStored);
          for (const idx of localChanges.current) {
            if (freshLocalMeta[idx]) {
              merged[idx] = freshLocalMeta[idx]; // preserve in-flight local changes
            }
          }
        }
      } catch {}

      setMeta(merged);
      // Always write merged result back to localStorage — this is the key sync step
      localStorage.setItem(storageKey, JSON.stringify(merged));
    }
    loadData();
  }, [storageKey, slug, userId]);

  // ── Persist helper ──
  const persist = useCallback(
    (next: Record<number, ProblemMeta>, updatedIdx?: number, updatedMeta?: ProblemMeta) => {
      setMeta(next);
      // Write full meta synchronously — same event loop as state change
      localStorage.setItem(storageKey, JSON.stringify(next));

      // Track this index as locally changed so the DB merge doesn't overwrite it
      if (updatedIdx !== undefined) {
        localChanges.current.add(updatedIdx);
      }

      if (userId && updatedIdx !== undefined && updatedMeta) {
        // Optimistically update the heatmap activity locally
        const prevStatus = meta[updatedIdx]?.status ?? "none";
        if (prevStatus !== updatedMeta.status) {
          try {
            const actStr = localStorage.getItem("cp_ladder_activity");
            const activity: Record<string, number> = actStr ? JSON.parse(actStr) : {};
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, "0");
            const d = String(today.getDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;

            if (updatedMeta.status === "solved") {
              activity[dateStr] = (activity[dateStr] || 0) + 1;
            } else if (prevStatus === "solved") {
              activity[dateStr] = Math.max(0, (activity[dateStr] || 0) - 1);
            }
            localStorage.setItem("cp_ladder_activity", JSON.stringify(activity));

            // Dispatch a custom event so the heatmap component knows to re-render immediately
            window.dispatchEvent(new Event("activityUpdated"));
          } catch (e) {}
        }

        updateCpLadderProgress(slug, String(updatedIdx), updatedMeta);
      }
    },
    [storageKey, slug, userId]
  );

  const getMeta = (idx: number): ProblemMeta =>
    meta[idx] ?? { status: "none", bookmarked: false, note: "" };

  // ── Actions ──
  const cycleStatus = (idx: number) => {
    const m = getMeta(idx);
    const newStatus = nextStatus(m.status);
    const updatedMeta = { ...m, status: newStatus };
    persist({ ...meta, [idx]: updatedMeta }, idx, updatedMeta);
  };

  const toggleBookmark = (idx: number) => {
    const m = getMeta(idx);
    const updatedMeta = { ...m, bookmarked: !m.bookmarked };
    persist({ ...meta, [idx]: updatedMeta }, idx, updatedMeta);
  };

  const openNote = (idx: number) => {
    setNoteModal({ open: true, idx, draft: getMeta(idx).note });
  };

  const saveNote = () => {
    const m = getMeta(noteModal.idx);
    const updatedMeta = { ...m, note: noteModal.draft };
    persist({ ...meta, [noteModal.idx]: updatedMeta }, noteModal.idx, updatedMeta);
    setNoteModal({ open: false, idx: -1, draft: "" });
  };

  // ── Filtering ──
  const visibleProblems = problems
    .map((p, i) => ({ p, i, m: getMeta(i) }))
    .filter(({ m }) => {
      if (filter === "bookmarked") return m.bookmarked;
      if (filter === "notes") return !!m.note;
      return true;
    });

  // ── Stats ──
  const solved = problems.filter((_, i) => getMeta(i).status === "solved").length;
  const attempted = problems.filter((_, i) => getMeta(i).status === "attempted").length;
  const pct = problems.length ? Math.round((solved / problems.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4 w-full relative flex flex-col items-center justify-center gap-4">
        {/* Navigation (Left) */}
        <div className="flex items-center gap-2 justify-start w-full sm:absolute sm:left-4 sm:top-8 sm:w-auto z-10">
          <Button
            asChild
            size="icon"
            className="h-8 w-8 bg-white text-black hover:bg-zinc-200 shadow-sm"
          >
            <Link href="/cp-ladder">
              <ChevronLeft className="h-4 w-4" strokeWidth={3} />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8 bg-white text-black hover:bg-zinc-200 font-bold shadow-sm"
          >
            <Link href="/cp-ladder">All Sections</Link>
          </Button>
        </div>

        {/* Title & Progress (Center) */}
        <div className="text-center w-full px-2 mt-2 sm:mt-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {displayName}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">{pct}% Completed</p>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-16 w-full mt-4">
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {/* Table Toolbar (Filters & Stats) */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-b border-border bg-muted/20">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
              {(["all", "bookmarked", "notes"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize",
                    filter === f
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                <span className="text-foreground font-bold tabular-nums">{solved}</span> Solved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]"></span>
                <span className="text-foreground font-bold tabular-nums">{attempted}</span>{" "}
                Attempted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span className="text-foreground font-bold tabular-nums">
                  {problems.length}
                </span>{" "}
                Total
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[650px]">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_85px_85px_85px_85px] bg-muted/40 border-b border-border">
                <div className="pl-8 pr-5 py-3 text-sm font-semibold text-white uppercase tracking-wider">
                  Problems
                </div>
                <div className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Solution
                </div>
                <div className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Status
                </div>
                <div className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  BookMark
                </div>
                <div className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Note
                </div>
              </div>

              {/* Rows */}
              {visibleProblems.length === 0 ? (
                <div className="py-16 text-center text-zinc-500">
                  No problems match the current filter.
                </div>
              ) : (
                visibleProblems.map(({ p, i, m }) => {
                  const statusCfg = STATUS_CONFIG[m.status];
                  const isSolved = m.status === "solved";
                  const isAttempted = m.status === "attempted";

                  return (
                    <div
                      key={i}
                      className={cn(
                        "grid grid-cols-[1fr_85px_85px_85px_85px] border-b border-border/60 transition-colors",
                        isSolved ? "bg-[#0d2b1a] hover:bg-[#0f3320]" : "bg-card hover:bg-muted/50"
                      )}
                    >
                      {/* Problem title — the whole title is the link */}
                      <div className="pl-8 pr-5 py-3.5 flex items-center gap-3">
                        <a
                          href={p.solveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-base font-semibold transition-colors tracking-tight",
                            isSolved
                              ? "text-green-300 hover:text-green-200"
                              : isAttempted
                                ? "text-yellow-400 hover:text-yellow-300"
                                : "text-foreground hover:text-blue-400"
                          )}
                        >
                          {p.title}
                        </a>
                        {m.note && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"
                            title="Has note"
                          />
                        )}
                      </div>

                      {/* Solution Video */}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() =>
                            setVideoModal({ open: true, url: p.videoUrl, title: p.title })
                          }
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSolved ? "hover:bg-green-900/40" : "hover:bg-zinc-800"
                          )}
                          title="Watch Solution"
                        >
                          <Youtube className="h-5 w-5 text-red-600" />
                        </button>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => cycleStatus(i)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            statusCfg.color,
                            isSolved
                              ? "bg-green-500/10"
                              : isAttempted
                                ? "bg-yellow-400/10"
                                : "hover:bg-zinc-800"
                          )}
                          title={statusCfg.label}
                        >
                          {statusCfg.icon}
                        </button>
                      </div>

                      {/* Bookmark */}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => toggleBookmark(i)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            m.bookmarked
                              ? "text-yellow-400 bg-yellow-400/10"
                              : cn(
                                  "text-zinc-500 hover:text-yellow-400",
                                  isSolved ? "hover:bg-green-900/40" : "hover:bg-zinc-800"
                                )
                          )}
                          title={m.bookmarked ? "Remove Bookmark" : "Bookmark"}
                        >
                          {m.bookmarked ? (
                            <Bookmark size={17} fill="currentColor" />
                          ) : (
                            <Bookmark size={17} />
                          )}
                        </button>
                      </div>

                      {/* Notes */}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => openNote(i)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            m.note
                              ? "text-yellow-300 bg-yellow-400/10"
                              : cn(
                                  "text-zinc-500 hover:text-zinc-300",
                                  isSolved ? "hover:bg-green-900/40" : "hover:bg-zinc-800"
                                )
                          )}
                          title={m.note ? "Edit Note" : "Add Note"}
                        >
                          <StickyNote size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── YouTube Video Modal ──────────────────────────────────────── */}
      {videoModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setVideoModal({ open: false, url: "", title: "" })}
        >
          <div
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Youtube size={20} className="text-red-500" />
                <span className="font-semibold text-white truncate">{videoModal.title}</span>
              </div>
              <button
                onClick={() => setVideoModal({ open: false, url: "", title: "" })}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Embed */}
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={videoModal.url}
                title={videoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Notes Modal ─────────────────────────────────────────────── */}
      {noteModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setNoteModal({ open: false, idx: -1, draft: "" })}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <StickyNote size={18} className="text-yellow-400" />
                <span className="font-semibold text-white">
                  Note — {problems[noteModal.idx]?.title}
                </span>
              </div>
              <button
                onClick={() => setNoteModal({ open: false, idx: -1, draft: "" })}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Textarea */}
            <div className="p-5">
              <textarea
                className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 text-sm p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-600 font-mono"
                placeholder="Write your approach, key observations, or reminders here..."
                value={noteModal.draft}
                onChange={(e) => setNoteModal((n) => ({ ...n, draft: e.target.value }))}
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex justify-end gap-3">
              <button
                onClick={() => setNoteModal({ open: false, idx: -1, draft: "" })}
                className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-colors"
              >
                <Save size={14} /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { getRoadmapProgress, toggleRoadmapNode } from "@/actions/roadmap";
import { ChevronRight, CheckCircle2, Circle, BarChart2, Target, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import GlobalChatWidget from "@/components/GlobalChatWidget";

// --- Types ---
type Unit = {
  unit_name: string;
  text: string;
  questions?: any[];
  articles?: any[];
};

type Section = {
  section_name: string;
  units: Unit[];
};

type RoadmapClientProps = {
  slug: string;
  data: Section[];
  availableRoadmaps: string[];
};

// --- Helpers ---
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const prettySlug = (s: string) =>
  s
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// --- Code Block with header + copy ---
function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false);

  // Extract language from the inner code element className
  let lang = "code";
  let rawCode = "";
  React.Children.forEach(children, (child: any) => {
    if (child?.props?.className) {
      const match = child.props.className.match(/language-([\w-]+)/);
      if (match) lang = match[1];
    }
    if (child?.props?.children) {
      rawCode =
        typeof child.props.children === "string"
          ? child.props.children
          : Array.isArray(child.props.children)
            ? child.props.children.join("")
            : "";
    }
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const displayLang =
    lang === "code" || lang === "text" ? "text" : lang.charAt(0).toUpperCase() + lang.slice(1);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-zinc-800 bg-[#111118] shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-[#111118]">
        <span className="text-xs font-semibold text-zinc-500">{displayLang}</span>
        <button
          onClick={handleCopy}
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 custom-scrollbar text-sm m-0 bg-transparent">
        {children}
      </pre>
    </div>
  );
}

// --- Mock Ratings ---
const MOCK_RATINGS = [
  { old: 800, new: 1400, targetOld: 1200, targetNew: 1600 },
  { old: 1000, new: 1700, targetOld: 1300, targetNew: 1700 },
  { old: 1100, new: 1800, targetOld: 1400, targetNew: 1800 },
  { old: 1400, new: 2000, targetOld: 1600, targetNew: 2100 },
  { old: 1700, new: 2400, targetOld: 1900, targetNew: 2600 },
];

// Extract a short description from the first unit's text
function getSectionDesc(section: Section): string {
  const raw = section.units[0]?.text || "";
  // Strip markdown (code blocks, images, headers)
  const stripped = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*|\*|__|_/g, "")
    .trim();
  // Return the first 1-2 sentences (up to 200 chars)
  const firstSentences = stripped
    .split(/(?<=[.!?])\s+/)
    .slice(0, 2)
    .join(" ");
  return firstSentences.length > 200 ? firstSentences.slice(0, 197) + "..." : firstSentences;
}

// --- Landing View Component ---
function LandingView({
  slug,
  data,
  completedUnits,
  onSelectSection,
}: {
  slug: string;
  data: Section[];
  completedUnits: Record<string, boolean>;
  onSelectSection: (sIdx: number) => void;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
          <Link href="/roadmaps" className="hover:text-zinc-200 transition-colors">
            Roadmaps
          </Link>
          <ChevronRight size={14} className="text-zinc-600" />
          <span className="text-zinc-100 font-semibold">{prettySlug(slug)}</span>
        </div>

        {/* Master Card */}
        <div className="border border-zinc-800/80 rounded-3xl p-6 md:p-10 bg-[#0a0a0c]">
          <div className="mb-10">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">
              Roadmap
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              {prettySlug(slug)}
            </h1>
            <p className="text-zinc-400 font-medium text-sm md:text-base">
              Select a section to begin
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {data.map((section, sIdx) => {
              const sSlug = slugify(section.section_name);
              const sectionTotal = section.units.length;
              const sectionCompleted = section.units.filter(
                (u) => completedUnits[`${sSlug}_${slugify(u.unit_name)}`]
              ).length;
              const isDone = sectionCompleted === sectionTotal && sectionTotal > 0;
              const rating = MOCK_RATINGS[sIdx % MOCK_RATINGS.length];
              const desc = getSectionDesc(section);

              return (
                <button
                  key={sIdx}
                  onClick={() => onSelectSection(sIdx)}
                  className={cn(
                    "w-full text-left bg-[#0f0f11] border rounded-2xl p-6 transition-all",
                    isDone
                      ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50"
                      : "border-zinc-800/60 hover:bg-[#151518] hover:border-zinc-700"
                  )}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col flex-1">
                      <h2 className="text-lg font-bold text-zinc-100 mb-2 flex items-center gap-2">
                        {section.section_name}
                        {isDone && <CheckCircle2 size={16} className="text-green-500" />}
                      </h2>
                      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 mb-3">
                        <span className="flex items-center gap-1.5">
                          <BarChart2 size={13} />
                          {rating.old} → {rating.new}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Target size={13} />
                          {rating.targetOld} → {rating.targetNew}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed pr-8">{desc}</p>
                    </div>
                    <div className="flex flex-col items-end justify-center shrink-0 pt-1">
                      <div className="text-[17px] font-bold text-white mb-0.5">
                        {sectionCompleted}
                        <span className="text-zinc-500 font-semibold text-sm">/{sectionTotal}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
                        units
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---
export default function RoadmapClient({ slug, data, availableRoadmaps }: RoadmapClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sectionParam = searchParams.get("section");
  const unitParam = searchParams.get("unit");

  const activeSectionIndex = useMemo(() => {
    if (!sectionParam) return -1;
    const idx = data.findIndex((s) => slugify(s.section_name) === sectionParam);
    return idx >= 0 ? idx : -1;
  }, [data, sectionParam]);

  const activeUnitIndex = useMemo(() => {
    if (!unitParam || activeSectionIndex === -1) return -1;
    const units = data[activeSectionIndex]?.units || [];
    const idx = units.findIndex((u) => slugify(u.unit_name) === unitParam);
    return idx >= 0 ? idx : -1;
  }, [data, activeSectionIndex, unitParam]);

  const activeSection = activeSectionIndex >= 0 ? data[activeSectionIndex] : null;
  const activeUnit =
    activeSection && activeUnitIndex >= 0 ? activeSection.units[activeUnitIndex] : null;

  const [completedUnits, setCompletedUnits] = useState<Record<string, boolean>>({});
  const progressKey = `roadmap_progress_${slug}`;
  const { userId } = useAuth();

  useEffect(() => {
    // 1. Fast path: optimistic load from localStorage
    let localMap: Record<string, boolean> = {};
    try {
      const stored = localStorage.getItem(progressKey);
      if (stored) {
        localMap = JSON.parse(stored);
        setCompletedUnits(localMap);
      }
    } catch {}

    // 2. Slow path: fetch from DB and sync
    async function loadProgress() {
      if (userId) {
        const dbNodes = await getRoadmapProgress(slug);
        if (dbNodes && dbNodes.length > 0) {
          const map: Record<string, boolean> = {};
          dbNodes.forEach((id) => {
            map[id] = true;
          });
          setCompletedUnits(map);
          // Sync to localStorage
          localStorage.setItem(progressKey, JSON.stringify(map));
        }

        // ── One-time migration: push localStorage data to DB ──
        if (Object.keys(localMap).some((k) => localMap[k])) {
          const MIGRATION_KEY = `roadmap_db_migrated_v1_${slug}`;
          if (!localStorage.getItem(MIGRATION_KEY)) {
            localStorage.setItem(MIGRATION_KEY, "1");
            for (const [nodeId, completed] of Object.entries(localMap)) {
              if (completed) toggleRoadmapNode(slug, nodeId, true);
            }
          }
        }
      }
    }
    loadProgress();
  }, [progressKey, slug, userId]);

  const toggleCompletion = () => {
    if (!activeUnit || !activeSection) return;
    const unitId = `${slugify(activeSection.section_name)}_${slugify(activeUnit.unit_name)}`;
    const newVal = !completedUnits[unitId];
    const next = { ...completedUnits, [unitId]: newVal };
    setCompletedUnits(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
    if (userId) {
      toggleRoadmapNode(slug, unitId, newVal);
    }
  };

  const goToSection = (sIdx: number) => {
    const section = data[sIdx];
    if (!section || section.units.length === 0) return;
    router.push(
      `/roadmaps/${slug}?section=${slugify(section.section_name)}&unit=${slugify(section.units[0].unit_name)}`
    );
  };

  const goToUnit = (sIdx: number, uIdx: number) => {
    const section = data[sIdx];
    if (!section) return;
    const unit = section.units[uIdx];
    if (!unit) return;
    router.push(
      `/roadmaps/${slug}?section=${slugify(section.section_name)}&unit=${slugify(unit.unit_name)}`
    );
  };

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-zinc-500">No roadmap data found.</div>;
  }

  if (!activeSection || !activeUnit) {
    return (
      <>
        <LandingView
          slug={slug}
          data={data}
          completedUnits={completedUnits}
          onSelectSection={goToSection}
        />
        <GlobalChatWidget />
      </>
    );
  }

  const sIdx = activeSectionIndex;
  const sSlug = slugify(activeSection.section_name);
  const currentUnitId = `${sSlug}_${slugify(activeUnit.unit_name)}`;
  const isCurrentCompleted = completedUnits[currentUnitId] || false;
  const rating = MOCK_RATINGS[sIdx % MOCK_RATINGS.length];
  const desc = getSectionDesc(activeSection);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0a0a0c] overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/70 bg-[#0a0a0c] shrink-0">
        <button
          onClick={() => router.push(`/roadmaps/${slug}`)}
          className="flex items-center gap-2 h-7 px-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 shadow-sm transition-colors shrink-0"
        >
          <ChevronLeft size={13} strokeWidth={3} />
        </button>
        <button
          onClick={() => router.push(`/roadmaps/${slug}`)}
          className="h-7 px-3 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 shadow-sm transition-colors shrink-0"
        >
          All Sections
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANE */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-zinc-800/70 overflow-y-auto custom-scrollbar bg-[#0a0a0c]">
          {/* Section Hero Card */}
          <div
            className="mx-3 mt-4 mb-5 rounded-2xl p-5 shrink-0"
            style={{
              background: "linear-gradient(135deg, #1a2e42 0%, #102030 60%, #081520 100%)",
              border: "1px solid rgba(56,110,160,0.25)",
            }}
          >
            <h2 className="text-xl font-black text-white mb-2.5 leading-snug">
              {activeSection.section_name}
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 mb-2.5">
              <span className="flex items-center gap-1.5">
                <BarChart2 size={12} />
                {rating.old} → {rating.new}
              </span>
              <span className="flex items-center gap-1.5">
                <Target size={12} />
                {rating.targetOld} → {rating.targetNew}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{desc}</p>
          </div>

          {/* Unit Timeline — pill nodes */}
          <div className="px-3 pb-8 flex flex-col gap-2">
            {activeSection.units.map((unit, uIdx) => {
              const uSlug = slugify(unit.unit_name);
              const uId = `${sSlug}_${uSlug}`;
              const isCurrent = uIdx === activeUnitIndex;
              const isDone = completedUnits[uId];

              return (
                <button
                  key={uIdx}
                  onClick={() => goToUnit(sIdx, uIdx)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all border",
                    isCurrent
                      ? "bg-zinc-800/70 border-zinc-600"
                      : isDone
                        ? "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-800"
                        : "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-800"
                  )}
                >
                  {/* Circle node */}
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm font-black border-2 transition-all",
                      isCurrent
                        ? "bg-zinc-200 text-zinc-900 border-zinc-200"
                        : isDone
                          ? "bg-green-500/10 border-green-500/40 text-green-400"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400"
                    )}
                  >
                    {isDone && !isCurrent ? <CheckCircle2 size={16} /> : uIdx + 1}
                  </div>

                  {/* Unit info */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={cn(
                        "text-sm font-bold leading-snug truncate",
                        isCurrent ? "text-white" : "text-zinc-300"
                      )}
                    >
                      {unit.unit_name}
                    </span>
                  </div>

                  {/* Progress bar for current */}
                  {isCurrent && (
                    <div className="w-12 h-1 rounded-full bg-zinc-700 shrink-0 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full bg-zinc-400 transition-all",
                          isCurrentCompleted ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE — Content Reader */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
          <div className="max-w-3xl mx-auto px-7 py-8">
            {/* Unit header row */}
            <div className="flex items-start mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                <span className="text-zinc-500 font-semibold mr-2">
                  {sIdx + 1}.{activeUnitIndex + 1}
                </span>
                {activeUnit.unit_name}
              </h1>
            </div>

            <div className="w-full h-px bg-zinc-800/70 mb-7" />

            {/* Markdown content */}
            <div className="prose prose-invert max-w-none prose-headings:mt-8 prose-headings:mb-4 prose-p:my-4 prose-p:text-zinc-300 prose-p:leading-7 prose-ul:my-4 prose-li:my-1 prose-pre:my-6 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
                components={{
                  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                  code: ({ node, inline, className, children, ...props }: any) => {
                    if (inline)
                      return (
                        <code className="bg-zinc-800/80 text-blue-300 px-1.5 py-0.5 rounded border border-zinc-700/60 text-[0.82em] font-mono">
                          {children}
                        </code>
                      );
                    return (
                      <code
                        className={`${className ?? ""} text-sm font-mono leading-relaxed`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {activeUnit.text}
              </ReactMarkdown>
            </div>

            {/* Questions & Articles */}
            {((activeUnit.questions?.length ?? 0) > 0 ||
              (activeUnit.articles?.length ?? 0) > 0) && (
              <div className="mt-12 pt-8 border-t border-zinc-800">
                <h3 className="text-base font-bold text-white mb-4">Resources & Practice</h3>
                {activeUnit.questions && activeUnit.questions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Practice Problems
                    </h4>
                    <ul className="space-y-2">
                      {activeUnit.questions.map((q, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ChevronRight size={13} className="text-blue-500 shrink-0" />
                          {typeof q === "object" && q.url ? (
                            <a
                              href={q.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors text-sm"
                            >
                              {q.title || q.url}
                            </a>
                          ) : (
                            <span className="text-zinc-300 text-sm">
                              {typeof q === "string" ? q : JSON.stringify(q)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeUnit.articles && activeUnit.articles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Further Reading
                    </h4>
                    <ul className="space-y-2">
                      {activeUnit.articles.map((a, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ChevronRight size={13} className="text-green-500 shrink-0" />
                          {typeof a === "object" && a.url ? (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 hover:underline transition-colors text-sm"
                            >
                              {a.title || a.url}
                            </a>
                          ) : (
                            <span className="text-zinc-300 text-sm">
                              {typeof a === "string" ? a : JSON.stringify(a)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tasks section */}
            <div className="mt-12 pt-8 border-t border-zinc-800 pb-16">
              <h3 className="text-base font-bold text-white mb-4">Tasks</h3>
              <button
                onClick={toggleCompletion}
                className="flex items-center gap-3 text-sm text-zinc-300 hover:text-white transition-colors group"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    isCurrentCompleted
                      ? "border-green-500 bg-green-500/10"
                      : "border-zinc-600 group-hover:border-zinc-400"
                  )}
                >
                  {isCurrentCompleted && <div className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
                <span className={isCurrentCompleted ? "line-through text-zinc-500" : ""}>
                  Read Unit
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <GlobalChatWidget />
    </div>
  );
}

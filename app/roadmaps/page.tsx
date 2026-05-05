"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

// --- MOCK DATA ---
const TAG_COLORS: Record<string, string> = {
  Interview: "bg-red-500/10 text-red-500 border-red-500/20",
  Olympiad: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  DSA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

interface Roadmap {
  title: string;
  desc?: string;
  tags: string[];
  units: number;
  learning: number;
  href: string;
}

const RECOMMENDED: Roadmap[] = [
  {
    title: "Dynamic Programming",
    desc: "You'll break problems into subproblems and reuse solutions. Covers memoization, tabulation, knapsack,...",
    tags: ["Interview", "Olympiad", "DSA"],
    units: 918,
    learning: 2185,
    href: "/roadmaps/dp",
  },
  {
    title: "Graph Theory",
    desc: "Graphs model connections between things. Covers BFS, DFS, connectivity, and problems on both graphs...",
    tags: ["Interview", "Olympiad", "DSA"],
    units: 1633,
    learning: 805,
    href: "/roadmaps/graph_theory",
  },
  {
    title: "Math Fundamentals",
    desc: "The math behind the algorithms. Covers arithmetic, algebra, logic, counting, and complexity analysis.",
    tags: ["Olympiad"],
    units: 814,
    learning: 667,
    href: "/roadmaps/math",
  },
  {
    title: "Data Structures",
    desc: "The fundamental building blocks of computing. Covers arrays, linked lists, trees, heaps, and hash maps.",
    tags: ["Interview", "DSA"],
    units: 741,
    learning: 240,
    href: "/roadmaps/data_structures",
  },
];

const CATEGORIES = [
  {
    title: "Interview Prep",
    total: 4,
    items: [
      {
        title: "Data Structures",
        tags: ["Interview", "DSA"],
        units: 741,
        learning: 240,
        href: "/roadmaps/data_structures",
      },
      {
        title: "Dynamic Programming",
        tags: ["Interview", "Olympiad", "DSA"],
        units: 918,
        learning: 2185,
        href: "/roadmaps/dp",
      },
      {
        title: "Graph Theory",
        tags: ["Interview", "Olympiad", "DSA"],
        units: 1633,
        learning: 805,
        href: "/roadmaps/graph_theory",
      },
      {
        title: "Fundamental Algorithms",
        tags: ["Interview"],
        units: 301,
        learning: 90,
        href: "/roadmaps/fundamental_algorithms",
      },
    ],
  },
  {
    title: "Competitive Programming",
    total: 3,
    items: [
      {
        title: "Dynamic Programming",
        tags: ["Interview", "Olympiad", "DSA"],
        units: 918,
        learning: 2185,
        href: "/roadmaps/dp",
      },
      {
        title: "Graph Theory",
        tags: ["Interview", "Olympiad", "DSA"],
        units: 1633,
        learning: 805,
        href: "/roadmaps/graph_theory",
      },
      {
        title: "Math Fundamentals",
        tags: ["Olympiad"],
        units: 814,
        learning: 667,
        href: "/roadmaps/math",
      },
    ],
  },
  {
    title: "Languages",
    total: 3,
    items: [
      {
        title: "C++",
        tags: ["Interview", "Olympiad"],
        units: 1024,
        learning: 201,
        href: "/roadmaps/cpp",
      },
      { title: "Python", tags: ["Interview"], units: 612, learning: 53, href: "/roadmaps/python" },
      {
        title: "JavaScript",
        tags: ["Interview"],
        units: 618,
        learning: 21,
        href: "/roadmaps/javascript",
      },
    ],
  },
];

function TagBadge({ label }: { label: string }) {
  const colorClass = TAG_COLORS[label] || "bg-zinc-800 text-zinc-300 border-zinc-700";
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${colorClass}`}
    >
      {label}
    </span>
  );
}

function RoadmapsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  if (selectedCategory) {
    const cat = CATEGORIES.find((c) => c.title === selectedCategory);
    if (cat) {
      return (
        <div className="min-h-screen bg-[#09090b] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/roadmaps")}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2"
              >
                &larr; All sections
              </button>
              <h1 className="text-3xl font-black text-white tracking-tight">{cat.title}</h1>
            </div>

            <div className="flex flex-col">
              {cat.items.map((item, ii) => (
                <Link
                  key={ii}
                  href={item.href}
                  className="group flex items-center justify-between py-5 border-b border-zinc-800/80 hover:bg-zinc-900/40 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3">
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {item.tags.map((t) => (
                            <TagBadge key={t} label={t} />
                          ))}
                        </div>
                      )}
                      <span className="text-[12px] text-zinc-500 font-medium flex items-center gap-2">
                        {item.tags.length > 0 && <span>·</span>}
                        {item.units} units <span>·</span> {item.learning} learning
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1.5">
                    Start <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Recommended Section */}
        <section>
          <h2 className="text-lg font-bold text-zinc-100 mb-4">Recommended for you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOMMENDED.map((r, i) => (
              <div
                key={i}
                className="flex flex-col bg-[#111113] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors h-full"
              >
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {r.tags.map((t) => (
                    <TagBadge key={t} label={t} />
                  ))}
                </div>
                <h3 className="text-base font-bold text-zinc-100 mb-1.5 tracking-tight">
                  {r.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 flex-1">{r.desc}</p>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-4 font-medium">
                  <span>{r.units} units</span>
                  <span>{r.learning} learning</span>
                </div>
                <Link
                  href={r.href}
                  className="flex items-center justify-center w-full py-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Start Roadmap
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Browse Section */}
        <section>
          <h2 className="text-xl font-bold text-zinc-100 mb-6">Browse all roadmaps</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            {CATEGORIES.map((cat, ci) => (
              <div key={ci} className="flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                  <h3 className="text-sm font-bold text-zinc-100">{cat.title}</h3>
                  {cat.total > 0 && (
                    <button
                      onClick={() => router.push(`?category=${encodeURIComponent(cat.title)}`)}
                      className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                    >
                      See all {cat.total} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col">
                  {cat.items.map((item, ii) => (
                    <Link
                      key={ii}
                      href={item.href}
                      className="group flex items-center justify-between py-3 border-b border-zinc-800/50 hover:bg-zinc-900/30 -mx-3 px-3 rounded-lg transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {item.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {item.tags.map((t) => (
                                <TagBadge key={t} label={t} />
                              ))}
                            </div>
                          )}
                          <span className="text-[11px] text-zinc-500 font-medium">
                            {item.tags.length > 0 && <span className="mr-2">·</span>}
                            {item.units} units <span className="mx-1">·</span> {item.learning}{" "}
                            learning
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                        Start <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function RoadmapsIndex() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <RoadmapsContent />
    </Suspense>
  );
}

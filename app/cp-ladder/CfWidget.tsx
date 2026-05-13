"use client";

import { useEffect, useState, useRef } from "react";
import { Edit2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getUserProfile, saveCfHandle } from "@/actions/cp-ladder";

// ── Exact Codeforces rank hex colors ──────────────────────────────────────
const CF_RANK_COLOR: Record<string, string> = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03A89E",
  expert: "#0000FF",
  "candidate master": "#AA00AA",
  master: "#FF8C00",
  "international master": "#FF8C00",
  grandmaster: "#FF0000",
  "international grandmaster": "#FF0000",
  "legendary grandmaster": "#FF0000",
};

export function cfRankColor(rank?: string): string {
  if (!rank) return "#808080";
  return CF_RANK_COLOR[rank.toLowerCase()] ?? "#808080";
}

export default function CfWidget() {
  const [handle, setHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [rank, setRank] = useState<string>("");
  const [maxRating, setMaxRating] = useState<number | null>(null);
  const [maxRank, setMaxRank] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();

  // Load CF handle from localStorage first (fast), then verify/update with DB
  useEffect(() => {
    const stored = localStorage.getItem("cf_handle");
    if (stored) {
      setSavedHandle(stored);
      const cached = localStorage.getItem("cf_rating_data");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.handle === stored) {
            setRating(data.rating);
            setRank(data.rank);
            setMaxRating(data.maxRating);
            setMaxRank(data.maxRank);
          }
        } catch {}
      }
    }

    async function loadProfile() {
      if (userId) {
        const profile = await getUserProfile();
        if (profile?.cfHandle) {
          setSavedHandle(profile.cfHandle);
          const d = profile.cfRatingData as any;
          if (d) {
            setRating(d.rating ?? null);
            setRank(d.rank ?? "");
            setMaxRating(d.maxRating ?? null);
            setMaxRank(d.maxRank ?? "");
            localStorage.setItem("cf_handle", profile.cfHandle);
            localStorage.setItem("cf_rating_data", JSON.stringify(d));
            return;
          }
          fetchRating(profile.cfHandle, true);
          return;
        }
      }
      if (stored && !rating) {
        fetchRating(stored, true);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchRating = async (h: string, silent = false): Promise<boolean> => {
    if (!h) return false;
    setLoading(true);
    try {
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${h}`);
      const json = await res.json();
      if (json.status === "OK") {
        const user = json.result[0];
        setRating(user.rating ?? null);
        setRank(user.rank ?? "");
        setMaxRating(user.maxRating ?? null);
        setMaxRank(user.maxRank ?? "");

        const ratingData = {
          handle: h,
          rating: user.rating ?? null,
          rank: user.rank ?? "",
          maxRating: user.maxRating ?? null,
          maxRank: user.maxRank ?? "",
        };
        localStorage.setItem("cf_rating_data", JSON.stringify(ratingData));
        if (!silent) toast.success(`Rating refreshed: ${user.rating ?? "Unrated"}`);
        return true;
      } else {
        toast.error("Codeforces user not found", {
          description: `No user with handle "${h}" exists. Try a different handle.`,
          position: "top-center",
          duration: 5000,
        });
        return false;
      }
    } catch {
      toast.error("Could not reach Codeforces", {
        description: "Check your internet connection and try again.",
        position: "top-center",
        duration: 5000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveHandle = async () => {
    const h = handle.trim();
    if (!h) return;
    const ok = await fetchRating(h);
    if (ok) {
      localStorage.setItem("cf_handle", h);
      setSavedHandle(h);
      setEditing(false);
      setHandle("");
      const cached = localStorage.getItem("cf_rating_data");
      if (userId && cached) {
        try {
          const ratingData = JSON.parse(cached);
          await saveCfHandle(h, ratingData);
        } catch {}
      }
    }
  };

  if (!savedHandle && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 bg-[#1a67ff] hover:bg-[#155de0] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow"
      >
        <img src="/code-forces.svg" alt="CF" className="w-4 h-4" />
        Connect Codeforces
      </button>
    );
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveHandle();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={inputRef}
          autoFocus
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="CF handle..."
          className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 w-36"
        />
        <button
          type="submit"
          className="bg-[#1a67ff] hover:bg-[#155de0] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-zinc-500 hover:text-white text-xs px-2 py-1.5"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <img src="/code-forces.svg" alt="CF" className="w-5 h-5" />
          <a
            href={`https://codeforces.com/profile/${savedHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: cfRankColor(rank) }}
            className="text-base font-bold hover:underline"
          >
            {savedHandle}
          </a>
          <button
            onClick={() => setEditing(true)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Change handle"
          >
            <Edit2 size={11} />
          </button>
        </div>
        <div className="text-sm text-zinc-400 mt-0.5 pl-0.5">
          Contest rating:{" "}
          <span style={{ color: cfRankColor(rank) }} className="text-sm font-semibold">
            {rating ?? "—"}
          </span>
          {maxRating !== null && (
            <span className="text-zinc-500">
              {" "}
              (max. <span style={{ color: cfRankColor(maxRank) }}>{maxRank}</span>
              {", "}
              {maxRating})
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => fetchRating(savedHandle)}
        disabled={loading}
        className="flex items-center gap-2 bg-[#1a67ff] hover:bg-[#155de0] disabled:opacity-60 text-white text-base font-bold px-5 py-2.5 rounded-xl transition-colors shadow shrink-0"
      >
        <img src="/code-forces.svg" alt="CF" className="w-5 h-5" />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

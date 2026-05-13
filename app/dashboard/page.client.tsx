"use client";

import { useEffect, useState } from "react";
import LeetCodeDashboard from "@/components/LeetCodeDashboard";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function DashboardClient() {
  const { userId } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  // This new state holds the list of questions the user has completed from the DB
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // 1. Load User Progress
    let progressPromise;
    try {
      const cachedSlugs = localStorage.getItem("dashboard-progress-v1");
      if (cachedSlugs) {
        const parsed = JSON.parse(cachedSlugs);
        if (Array.isArray(parsed)) {
          progressPromise = Promise.resolve({ slugs: parsed });
        }
      }
    } catch {}

    if (!progressPromise) {
      progressPromise = fetch("/api/user-progress")
        .then((res) => res.json())
        .catch((err) => {
          console.error("Error fetching progress:", err);
          return { slugs: [] };
        });
    } else {
      // Fetch in background to update cache
      fetch("/api/user-progress")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.slugs) {
            setCompletedSlugs(data.slugs);
            localStorage.setItem("dashboard-progress-v1", JSON.stringify(data.slugs));
          }
        })
        .catch(() => {});
    }

    // 2. Prepare to fetch Questions (Check cache first)
    let questionsPromise;
    let isCached = false;

    try {
      const cached = localStorage.getItem("dashboard-cache-v2");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.questions) && Array.isArray(parsed.companies)) {
          questionsPromise = Promise.resolve(parsed);
          isCached = true;
        }
      }
    } catch (e) {
      // If cache parse fails, ignore and fetch fresh
    }

    if (!questionsPromise) {
      questionsPromise = fetch("/api/questions").then((res) => res.json());
    }

    // 3. Execute both requests in parallel
    Promise.all([questionsPromise, progressPromise])
      .then(([questionsData, progressData]) => {
        // Update Questions & Companies
        setQuestions(questionsData.questions || []);
        setCompanies(questionsData.companies || []);

        // Update User Progress (The list of completed question slugs)
        setCompletedSlugs(progressData.slugs || []);

        setLoading(false);

        // Update cache if we performed a fresh fetch
        if (!isCached) {
          try {
            localStorage.setItem(
              "dashboard-cache-v2",
              JSON.stringify({
                questions: questionsData.questions,
                companies: questionsData.companies,
              })
            );
          } catch {}
        }
      })
      .catch((error) => {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId && !loading) {
      router.push("/");
    }
  }, [userId, loading, router]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer the heavy React render to the next frame so the page transition is instant
    const t = setTimeout(() => setIsReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (loading || !userId || !isReady) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6">
          <div className="w-full bg-card border rounded-lg shadow-sm">
            <div className="p-6 border-b space-y-2">
              <div className="w-48 h-8 bg-muted animate-pulse rounded" />
              <div className="w-96 h-4 bg-muted animate-pulse rounded" />
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 h-32 animate-pulse" />
                ))}
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="w-64 h-10 bg-muted animate-pulse rounded" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-32 h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <LeetCodeDashboard
        questions={questions}
        companies={companies}
        initialCompleted={completedSlugs} // Pass the DB data here
      />
    </div>
  );
}

import React from "react";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import RoadmapClient from "./RoadmapClient";

export const dynamic = "force-static";
export const dynamicParams = false;

const CONTENT_ROOT = path.join(process.cwd(), "public", "roadmaps");

export async function generateStaticParams() {
  try {
    const files = await fs.readdir(CONTENT_ROOT);
    const jsonFiles = files.filter((f) => f.toLowerCase().endsWith(".json"));
    return jsonFiles.map((f) => ({ slug: f.replace(/\.json$/i, "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Roadmap` };
}

export default async function RoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const filePath = path.join(CONTENT_ROOT, `${slug}.json`);
    const rawData = await fs.readFile(filePath, "utf8");
    const roadmapData = JSON.parse(rawData);

    // Get all available roadmaps for the sidebar switcher
    const files = await fs.readdir(CONTENT_ROOT);
    const availableRoadmaps = files
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .map((f) => f.replace(/\.json$/i, ""));

    return (
      <React.Suspense
        fallback={<div className="p-8 text-center text-zinc-500">Loading roadmap...</div>}
      >
        <RoadmapClient slug={slug} data={roadmapData} availableRoadmaps={availableRoadmaps} />
      </React.Suspense>
    );
  } catch (error) {
    return notFound();
  }
}

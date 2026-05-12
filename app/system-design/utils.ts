import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";

const CONTENT_ROOT = path.join(process.cwd(), "public", "system-design");

export interface SystemDesignChapter {
  slug: string;
  folder: string;
  title: string;
  order: number;
  content: string;
  video: string | null;
  podcast: string | null;
}

export const getAllSystemDesignChapters = cache(async (): Promise<SystemDesignChapter[]> => {
  try {
    const dirents = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
    const folders = dirents.filter((d) => d.isDirectory()).map((d) => d.name);

    const chapters: SystemDesignChapter[] = [];

    // Process all folders concurrently to speed up IO operations
    await Promise.all(
      folders.map(async (folder) => {
        try {
          const dirPath = path.join(CONTENT_ROOT, folder);
          const files = await fs.readdir(dirPath);
          const mdFile = files.find((f) => f.toLowerCase().endsWith(".md"));
          if (!mdFile) return;

          const raw = await fs.readFile(path.join(dirPath, mdFile), "utf8");
          const parsed = matter(raw);
          const fmSlug = (parsed.data?.slug as string | undefined)?.trim();
          if (!fmSlug) return;

          let title =
            (parsed.data?.title as string | undefined)?.trim() || folder.replace(/[-_]+/g, " ");
          const h1 = parsed.content.match(/^#\s+(.+)$/m) || parsed.content.match(/^##\s+(.+)$/m);
          if (!parsed.data?.title && h1?.[1]) {
            title = h1[1].trim();
          }

          const folderOrderMatch = folder.match(/^(\d{1,3})/);
          const titleOrderMatch = title.match(/chapter\s*(\d{1,3})/i);
          const orderFromFolder = folderOrderMatch ? parseInt(folderOrderMatch[1], 10) : NaN;
          const orderFromTitle = titleOrderMatch ? parseInt(titleOrderMatch[1], 10) : NaN;
          const order = Number.isFinite(orderFromFolder)
            ? orderFromFolder
            : Number.isFinite(orderFromTitle)
              ? orderFromTitle
              : Number.MAX_SAFE_INTEGER;

          const video = (parsed.data?.video as string | undefined)?.trim() || null;
          const podcast = (parsed.data?.podcast as string | undefined)?.trim() || null;

          chapters.push({
            slug: fmSlug,
            folder,
            title,
            order,
            content: parsed.content,
            video,
            podcast,
          });
        } catch {}
      })
    );

    chapters.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });

    return chapters;
  } catch {
    return [];
  }
});

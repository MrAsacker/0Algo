import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Slugger from "github-slugger";

const CONTENT_ROOT = path.join(process.cwd(), "public", "system-design");

export interface ChapterItem {
  slug: string;
  title: string;
  order: number;
}

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface MarkdownDoc {
  content: string;
  folder: string;
  video?: string | null;
  podcast?: string | null;
  toc: TocItem[];
  frontmatter: {
    title?: string;
    slug?: string;
    [key: string]: any;
  };
}

// Helper to find a markdown file in a directory
async function findMdFile(dirPath: string) {
  try {
    const files = await fs.readdir(dirPath);
    return files.find((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return null;
  }
}

export async function getAllChapters(): Promise<ChapterItem[]> {
  try {
    const dirents = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
    const folders = dirents.filter((d) => d.isDirectory()).map((d) => d.name);
    const items: ChapterItem[] = [];

    for (const folder of folders) {
      try {
        const dirPath = path.join(CONTENT_ROOT, folder);
        const mdFile = await findMdFile(dirPath);
        if (!mdFile) continue;

        const raw = await fs.readFile(path.join(dirPath, mdFile), "utf8");
        const parsed = matter(raw);
        const fmSlug = (parsed.data?.slug as string | undefined)?.trim();

        if (!fmSlug) continue;

        let title = folder.replace(/[-_]+/g, " ");
        // Try to get title from H1 or frontmatter
        const h1 = parsed.content.match(/^#\s+(.+)$/m) || parsed.content.match(/^##\s+(.+)$/m);
        if (parsed.data?.title) title = parsed.data.title;
        else if (h1?.[1]) title = h1[1].trim();

        // Parse Order
        const folderOrderMatch = folder.match(/^(\d{1,3})/);
        const titleOrderMatch = title.match(/chapter\s*(\d{1,3})/i);
        const order = folderOrderMatch 
          ? parseInt(folderOrderMatch[1], 10) 
          : titleOrderMatch ? parseInt(titleOrderMatch[1], 10) : 999;

        items.push({ slug: fmSlug, title, order });
      } catch (e) {
        console.error(`Error processing folder ${folder}:`, e);
        continue;
      }
    }

    return items.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
  } catch (error) {
    console.error("Error getting chapters:", error);
    return [];
  }
}

export async function getDocBySlug(slug: string): Promise<MarkdownDoc | null> {
  try {
    const dirents = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
    const folders = dirents.filter((d) => d.isDirectory()).map((d) => d.name);

    for (const folder of folders) {
      const dirPath = path.join(CONTENT_ROOT, folder);
      const mdFile = await findMdFile(dirPath);
      if (!mdFile) continue;

      const raw = await fs.readFile(path.join(dirPath, mdFile), "utf8");
      const parsed = matter(raw);
      const fmSlug = (parsed.data?.slug as string | undefined)?.trim();

      if (fmSlug === slug) {
        // Generate TOC
        const slugger = new Slugger();
        const toc: TocItem[] = [];
        for (const line of parsed.content.split("\n")) {
          const m = /^(#{1,4})\s+(.+)$/.exec(line.trim());
          if (m) {
            const depth = m[1].length;
            const text = m[2].replace(/[#`*_]+/g, "").trim();
            const id = slugger.slug(text);
            toc.push({ id, text, depth });
          }
        }

        return {
          content: parsed.content,
          folder,
          video: (parsed.data?.video as string)?.trim() || null,
          podcast: (parsed.data?.podcast as string)?.trim() || null,
          toc,
          frontmatter: parsed.data,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error reading doc by slug:", error);
    return null;
  }
}
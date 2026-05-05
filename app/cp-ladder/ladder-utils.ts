import fs from "fs";
import path from "path";

const LADDER_DIR = path.join(process.cwd(), "public", "cp-ladder");

/**
 * Convert a raw filename (e.g. "1 C++ STL") to a clean URL slug.
 * Strips leading number prefix, lowercases, replaces non-alphanumeric runs with hyphens.
 * "1 C++ STL" → "c-stl"   ... wait we want "cpp-stl"
 * Actually: strip the leading "N " prefix, then slugify the rest.
 */
export function filenameToSlug(filename: string): string {
  // Remove .json extension
  const base = filename.replace(/\.json$/i, "");
  // Strip leading number + space (e.g. "1 ", "26 ")
  const withoutNumber = base.replace(/^\d+\s+/, "");
  // Slugify: lowercase, replace C++ → cpp, & special chars → hyphens
  return withoutNumber
    .toLowerCase()
    .replace(/c\+\+/g, "cpp") // C++ → cpp
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric runs → hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/**
 * Strip leading number prefix from display name.
 * "1 C++ STL" → "C++ STL"
 */
export function filenameToDisplayName(filename: string): string {
  const base = filename.replace(/\.json$/i, "");
  return base.replace(/^\d+\s+/, "").trim();
}

/**
 * Extract the sort order number from a filename.
 * "1 C++ STL.json" → 1
 */
export function filenameToOrder(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

export type LadderMeta = {
  slug: string;
  displayName: string;
  totalProblems: number;
  order: number;
  filename: string;
};

/**
 * Read all CP Ladder JSON files, sorted by their number prefix.
 */
export function getAllLadders(): LadderMeta[] {
  try {
    const files = fs.readdirSync(LADDER_DIR).filter((f) => f.endsWith(".json"));

    return files
      .map((f) => {
        const slug = filenameToSlug(f);
        const displayName = filenameToDisplayName(f);
        const order = filenameToOrder(f);
        let totalProblems = 0;
        try {
          const raw = fs.readFileSync(path.join(LADDER_DIR, f), "utf-8");
          totalProblems = JSON.parse(raw).length;
        } catch {}
        return { slug, displayName, totalProblems, order, filename: f };
      })
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

/**
 * Find a single ladder by URL slug, return its problems array.
 */
export function getLadderBySlug(slug: string): { meta: LadderMeta; problems: any[] } | null {
  const ladders = getAllLadders();
  const meta = ladders.find((l) => l.slug === slug);
  if (!meta) return null;

  try {
    const raw = fs.readFileSync(path.join(LADDER_DIR, meta.filename), "utf-8");
    return { meta, problems: JSON.parse(raw) };
  } catch {
    return null;
  }
}

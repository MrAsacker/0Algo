import { notFound } from "next/navigation";
import { getAllLadders, getLadderBySlug } from "../ladder-utils";
import CpLadderClient from "./CpLadderClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const ladders = getAllLadders();
  return ladders.map((l) => ({ slug: l.slug }));
}

export default async function CpLadderSlugPage({ params }: Props) {
  const { slug } = await params;
  const result = getLadderBySlug(slug);
  if (!result) return notFound();

  const { meta, problems } = result;
  const allLadders = getAllLadders();

  return (
    <CpLadderClient
      slug={meta.slug}
      displayName={meta.displayName}
      problems={problems}
      availableLadders={allLadders.map((l) => ({ slug: l.slug, displayName: l.displayName }))}
    />
  );
}

import { redirect } from "next/navigation";
import { getAllSystemDesignChapters } from "./utils";

export default async function SystemDesignIndexRedirect() {
  const items = await getAllSystemDesignChapters();

  if (items.length === 0) {
    redirect("/");
  }

  redirect(`/system-design/${encodeURIComponent(items[0].slug)}`);
}

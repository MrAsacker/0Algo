import { getAllLadders } from "./ladder-utils";
import CpLadderIndex from "./CpLadderIndex";

export default function CpLadderPage() {
  const ladders = getAllLadders();
  return <CpLadderIndex ladders={ladders} />;
}

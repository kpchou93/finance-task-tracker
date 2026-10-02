import { getBoard } from "@/lib/data/queries";
import { todayInMalaysia } from "@/lib/logic/categorize";
import Board from "./Board";
export default async function BoardPage({ view = "dashboard" }: { view?: "dashboard" | "tasks" | "companies" }) {
  const data = await getBoard();
  return <Board {...data} today={todayInMalaysia()} view={view} />;
}

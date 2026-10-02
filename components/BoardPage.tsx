import { getBoard } from "@/lib/data/queries";
import { todayInMalaysia } from "@/lib/logic/categorize";
import Board from "./Board";
export default async function BoardPage({ view = "dashboard", demo = false }: { view?: "dashboard" | "tasks" | "companies"; demo?: boolean }) {
 const data = await getBoard(demo);
 return <Board {...data} today={todayInMalaysia()} view={view} demo={demo} />;
}

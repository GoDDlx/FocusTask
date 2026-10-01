import { getStats, listTasks } from "@/lib/tasks-server";
import { TaskApp } from "@/components/TaskApp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const [tasks, stats] = await Promise.all([listTasks({ filter: "all", sort: "due" }), getStats()]);
    return <TaskApp initialTasks={tasks} initialStats={stats} />;
  } catch {
    return <TaskApp initialTasks={[]} initialStats={{ totalTasks: 0, completedTasks: 0, pendingTasks: 0, highPriorityTasks: 0, dueToday: 0, overdue: 0 }} />;
  }
}
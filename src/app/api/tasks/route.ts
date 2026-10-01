import { guard, jsonError } from "@/lib/api";
import { createTask, getStats, listTasks } from "@/lib/tasks-server";
import type { TaskFilter, SortKey } from "@/lib/types";

export async function GET(request: Request) {
  return guard(async () => {
    const url = new URL(request.url);
    const [tasks, stats] = await Promise.all([
      listTasks({ search: url.searchParams.get("search") ?? "", filter: (url.searchParams.get("filter") as TaskFilter) || "all", sort: (url.searchParams.get("sort") as SortKey) || "due" }),
      getStats(),
    ]);
    return Response.json({ tasks, stats });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const body = await request.json();
    if (!body?.title?.trim()) return jsonError("Title is required", 400);
    return Response.json(await createTask(body), { status: 201 });
  });
}
import { guard, jsonError } from "@/lib/api";
import { deleteTask, updateTask } from "@/lib/tasks-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return jsonError("Invalid task id", 400);
    const task = await updateTask(id, await request.json());
    return task ? Response.json(task) : jsonError("Task not found", 404);
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return jsonError("Invalid task id", 400);
    return deleteTask(id) ? Response.json({ ok: true }) : jsonError("Task not found", 404);
  });
}
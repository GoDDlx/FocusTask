import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, type TaskRow } from "@/db/schema";
import type { DashboardStats, Task, TaskFilter, SortKey, TaskInput } from "@/lib/types";

function serialize(row: TaskRow): Task {
  return {
    id: row.id, title: row.title, description: row.description, priority: row.priority,
    dueDate: row.dueDate ?? null, dueTime: row.dueTime ?? null,
    dueTimestamp: row.dueTimestamp?.toISOString() ?? null,
    reminderEnabled: row.reminderEnabled, isCompleted: row.isCompleted,
    completedAt: row.completedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(),
  };
}

const dueTimestamp = (date: string | null, time: string | null) => {
  if (!date) return null;
  const value = new Date(time ? `${date}T${time}:00` : `${date}T00:00:00`);
  return Number.isNaN(value.getTime()) ? null : value;
};

export async function listTasks(options: { search?: string; filter?: TaskFilter; sort?: SortKey }): Promise<Task[]> {
  const conditions = [];
  if (options.filter === "pending") conditions.push(eq(tasks.isCompleted, false));
  if (options.filter === "completed") conditions.push(eq(tasks.isCompleted, true));
  if (options.filter === "high") conditions.push(eq(tasks.priority, "HIGH"));
  if (options.filter === "medium") conditions.push(eq(tasks.priority, "MEDIUM"));
  if (options.filter === "low") conditions.push(eq(tasks.priority, "LOW"));
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(tasks.title, pattern), ilike(tasks.description, pattern)));
  }
  let query = db.select().from(tasks).where(and(...conditions));
  const rows = await query.orderBy(
    options.sort === "title" ? sql`lower(${tasks.title}) asc` :
    options.sort === "priority" ? sql`case ${tasks.priority} when 'HIGH' then 0 when 'MEDIUM' then 1 else 2 end` :
    options.sort === "created" ? desc(tasks.createdAt) :
    sql`${tasks.isCompleted} asc, ${tasks.dueTimestamp} asc nulls last, ${tasks.createdAt} desc`
  ).limit(500);
  return rows.map(serialize);
}

export async function getStats(): Promise<DashboardStats> {
  const [row] = await db.select({
    totalTasks: sql<number>`cast(count(*) as int)`,
    completedTasks: sql<number>`cast(count(*) filter (where ${tasks.isCompleted}) as int)`,
    highPriorityTasks: sql<number>`cast(count(*) filter (where ${tasks.priority} = 'HIGH' and not ${tasks.isCompleted}) as int)`,
    dueToday: sql<number>`cast(count(*) filter (where not ${tasks.isCompleted} and ${tasks.dueDate} = current_date) as int)`,
    overdue: sql<number>`cast(count(*) filter (where not ${tasks.isCompleted} and ${tasks.dueTimestamp} < now()) as int)`,
  }).from(tasks);
  const total = row?.totalTasks ?? 0, completed = row?.completedTasks ?? 0;
  return { totalTasks: total, completedTasks: completed, pendingTasks: total - completed,
    highPriorityTasks: row?.highPriorityTasks ?? 0, dueToday: row?.dueToday ?? 0, overdue: row?.overdue ?? 0 };
}

export async function createTask(input: Partial<TaskInput>) {
  const [row] = await db.insert(tasks).values({
    title: input.title || "Untitled task", description: input.description || "",
    priority: input.priority || "MEDIUM", dueDate: input.dueDate ?? null, dueTime: input.dueTime ?? null,
    dueTimestamp: dueTimestamp(input.dueDate ?? null, input.dueTime ?? null),
    reminderEnabled: input.reminderEnabled ?? true, isCompleted: false,
  }).returning();
  return serialize(row);
}

export async function updateTask(id: number, input: Partial<TaskInput>) {
  const patch: Partial<TaskRow> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.reminderEnabled !== undefined) patch.reminderEnabled = input.reminderEnabled;
  if (input.isCompleted !== undefined) { patch.isCompleted = input.isCompleted; patch.completedAt = input.isCompleted ? new Date() : null; }
  if (input.dueDate !== undefined || input.dueTime !== undefined) {
    patch.dueDate = input.dueDate ?? null; patch.dueTime = input.dueTime ?? null;
    patch.dueTimestamp = dueTimestamp(patch.dueDate ?? null, patch.dueTime ?? null);
  }
  const [row] = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning();
  return row ? serialize(row) : null;
}

export async function deleteTask(id: number) {
  const [row] = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
  return Boolean(row);
}
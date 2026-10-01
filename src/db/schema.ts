import { boolean, date, index, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const priorityEnum = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH"]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: priorityEnum("priority").notNull().default("MEDIUM"),
  dueDate: date("due_date", { mode: "string" }),
  dueTime: text("due_time"),
  dueTimestamp: timestamp("due_timestamp", { withTimezone: true }),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tasks_is_completed_idx").on(table.isCompleted),
  index("tasks_due_timestamp_idx").on(table.dueTimestamp),
  index("tasks_priority_idx").on(table.priority),
]);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
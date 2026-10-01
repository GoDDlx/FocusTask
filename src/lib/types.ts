export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskFilter = "all" | "pending" | "completed" | "high" | "medium" | "low";
export type SortKey = "due" | "priority" | "created" | "title";

export interface Task {
  id: number; title: string; description: string; priority: Priority;
  dueDate: string | null; dueTime: string | null; dueTimestamp: string | null;
  reminderEnabled: boolean; isCompleted: boolean; completedAt: string | null; createdAt: string;
}
export interface DashboardStats {
  totalTasks: number; completedTasks: number; pendingTasks: number;
  highPriorityTasks: number; dueToday: number; overdue: number;
}
export interface TaskListResponse { tasks: Task[]; stats: DashboardStats; }
export interface TaskInput {
  title: string; description: string; priority: Priority;
  dueDate: string | null; dueTime: string | null; dueTimestamp: string | null;
  reminderEnabled: boolean; isCompleted: boolean;
}
export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];
export const PRIORITY_LABEL: Record<Priority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };
export const FILTERS = [
  { key: "all", label: "All" }, { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" }, { key: "high", label: "High" },
  { key: "medium", label: "Medium" }, { key: "low", label: "Low" },
] as const;
export const SORTS = [
  { key: "due", label: "Due date" }, { key: "priority", label: "Priority" },
  { key: "created", label: "Newest" }, { key: "title", label: "A – Z" },
] as const;
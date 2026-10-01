"use client";

import { useState } from "react";
import type { DashboardStats, Task, Priority } from "@/lib/types";

export function TaskApp({ initialTasks, initialStats }: { initialTasks: Task[]; initialStats: DashboardStats }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [stats, setStats] = useState(initialStats);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const r = await fetch("/api/tasks?filter=all&sort=due", { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    setTasks(data.tasks); setStats(data.stats);
  }

  async function addTask() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, description: "", reminderEnabled: true }),
      });
      setTitle(""); setPriority("MEDIUM"); await refresh();
    } finally { setBusy(false); }
  }

  async function toggle(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    });
    await refresh();
  }

  async function remove(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="rounded-3xl bg-brand p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-80">FocusTask</p>
        <h1 className="mt-2 text-3xl font-bold">Your task dashboard</h1>
        <p className="mt-2 opacity-85">Plan it. Prioritize it. Finish it.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={stats.totalTasks} />
          <Stat label="Pending" value={stats.pendingTasks} />
          <Stat label="Completed" value={stats.completedTasks} />
          <Stat label="High priority" value={stats.highPriorityTasks} />
        </div>
      </header>

      <section className="mt-5 rounded-3xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="What needs to be done?" className="flex-1 rounded-2xl border border-line px-4 py-3 outline-none focus:border-brand" />
          <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
            className="rounded-2xl border border-line px-4 py-3">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
          <button onClick={addTask} disabled={busy}
            className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
            Add task
          </button>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-gray-500">
            No tasks yet. Add your first task above.
          </div>
        ) : tasks.map(task => (
          <article key={task.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
            <input type="checkbox" checked={task.isCompleted} onChange={() => toggle(task)} className="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <h2 className={`font-semibold ${task.isCompleted ? "text-gray-400 line-through" : ""}`}>{task.title}</h2>
              <p className="text-xs text-gray-500">{task.priority} priority</p>
            </div>
            <button onClick={() => remove(task.id)} className="rounded-xl px-3 py-2 text-sm font-semibold text-high hover:bg-red-50">Delete</button>
          </article>
        ))}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white/15 p-3"><p className="text-2xl font-bold">{value}</p><p className="text-xs opacity-80">{label}</p></div>;
}
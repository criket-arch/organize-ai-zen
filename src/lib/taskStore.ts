import { useEffect, useState, useCallback } from "react";
import type { Task, SortMode } from "@/types/task";

const STORAGE_KEY = "taiskmaster.tasks.v1";

const seedTasks = (): Task[] => {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const inThree = new Date(today); inThree.setDate(today.getDate() + 3);

  return [
    {
      id: crypto.randomUUID(),
      title: "Design review with Maya",
      description: "Walk through the new dashboard concepts and gather feedback.",
      date: iso(today),
      time: "10:30",
      location: "HQ — Studio 2",
      priority: "high",
      tags: ["design", "team"],
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "Pick up dry cleaning",
      date: iso(today),
      time: "17:00",
      location: "Downtown",
      priority: "low",
      tags: ["errand"],
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "Ship onboarding flow v2",
      description: "Final polish on copy and animations before release.",
      date: iso(tomorrow),
      time: "09:00",
      location: "Remote",
      priority: "high",
      tags: ["product"],
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "Coffee with Jordan",
      date: iso(tomorrow),
      time: "15:30",
      location: "Blue Bottle, Mission",
      priority: "medium",
      tags: ["personal"],
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "Q3 planning doc",
      description: "Draft outline for the leadership review.",
      date: iso(inThree),
      time: "11:00",
      location: "Remote",
      priority: "medium",
      tags: ["planning"],
      createdAt: new Date().toISOString(),
    },
  ];
};

const load = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedTasks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
};

const save = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

// Lightweight pub-sub so multiple components stay in sync.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => load());

  useEffect(() => {
    const fn = () => setTasks(load());
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const persist = useCallback((next: Task[]) => {
    save(next);
    setTasks(next);
    notify();
  }, []);

  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">) => {
    const next: Task = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    persist([...load(), next]);
    return next;
  }, [persist]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    persist(load().map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, [persist]);

  const deleteTask = useCallback((id: string) => {
    persist(load().filter((t) => t.id !== id));
  }, [persist]);

  const replaceAll = useCallback((next: Task[]) => persist(next), [persist]);

  const toggleComplete = useCallback((id: string) => {
    persist(load().map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, [persist]);

  return { tasks, addTask, updateTask, deleteTask, replaceAll, toggleComplete };
};

// ---------- Sorting & optimization ----------

const priorityWeight = { high: 0, medium: 1, low: 2 } as const;

export const sortTasks = (tasks: Task[], mode: SortMode): Task[] => {
  const arr = [...tasks];
  if (mode === "priority") {
    arr.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]
      || (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  } else if (mode === "datetime") {
    arr.sort((a, b) => (a.date + (a.time ?? "23:59")).localeCompare(b.date + (b.time ?? "23:59")));
  } else if (mode === "location") {
    arr.sort((a, b) => (a.location ?? "zzz").localeCompare(b.location ?? "zzz")
      || priorityWeight[a.priority] - priorityWeight[b.priority]);
  }
  return arr;
};

/**
 * Rule-based schedule optimization.
 * Strategy:
 *  1. Group by date.
 *  2. Within each day, cluster tasks that share a location (cuts travel).
 *  3. Within a cluster, order by priority then time.
 *  4. High-priority items without time get pulled to the morning.
 */
export const optimizeSchedule = (tasks: Task[]): Task[] => {
  const byDate = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const k = t.date;
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k)!.push(t);
  });

  const result: Task[] = [];
  const dates = [...byDate.keys()].sort();

  for (const date of dates) {
    const dayTasks = byDate.get(date)!;
    const groups = new Map<string, Task[]>();
    dayTasks.forEach((t) => {
      const loc = t.location?.trim() || "—";
      if (!groups.has(loc)) groups.set(loc, []);
      groups.get(loc)!.push(t);
    });

    // Order groups by highest-priority task they contain.
    const orderedGroups = [...groups.entries()].sort(([, a], [, b]) => {
      const pa = Math.min(...a.map((x) => priorityWeight[x.priority]));
      const pb = Math.min(...b.map((x) => priorityWeight[x.priority]));
      return pa - pb;
    });

    let cursor = 9 * 60; // start the day at 09:00 in minutes
    for (const [, group] of orderedGroups) {
      group.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]
        || (a.time ?? "23:59").localeCompare(b.time ?? "23:59"));
      for (const t of group) {
        let time = t.time;
        if (!time) {
          const h = Math.floor(cursor / 60).toString().padStart(2, "0");
          const m = (cursor % 60).toString().padStart(2, "0");
          time = `${h}:${m}`;
          cursor += 60; // assume 1h slot
        } else {
          // advance cursor past this fixed task
          const [h, m] = time.split(":").map(Number);
          cursor = Math.max(cursor, h * 60 + m + 60);
        }
        result.push({ ...t, time });
      }
      cursor += 15; // travel buffer between locations
    }
  }
  return result;
};

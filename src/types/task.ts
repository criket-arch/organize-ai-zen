export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date (yyyy-mm-dd)
  time?: string; // HH:mm
  duration?: number; // Minutes
  location?: string;
  priority: Priority;
  tags?: string[];
  completed?: boolean;
  createdAt: string;
}

export type SortMode = "priority" | "datetime" | "location";

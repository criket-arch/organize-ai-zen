import { useMemo, useState } from "react";
import { Sparkles, Search, ArrowDownUp, CheckCircle2, Calendar as CalIcon, MapPin, Flag } from "lucide-react";
import { Header } from "@/components/Header";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { MiniCalendar } from "@/components/MiniCalendar";
import { AIAssistant } from "@/components/AIAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasks, sortTasks, optimizeSchedule } from "@/lib/taskStore";
import type { SortMode, Task } from "@/types/task";
import { isSameDay, parseISO, isToday } from "date-fns";
import { toast } from "sonner";

const Index = () => {
  const { tasks, addTask, updateTask, deleteTask, replaceAll, toggleComplete } = useTasks();
  const [sort, setSort] = useState<SortMode>("priority");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const visible = useMemo(() => {
    let list = tasks;
    if (selectedDate) {
      // When a date is selected, filter to that day. Click again to clear.
      list = list.filter((t) => isSameDay(parseISO(t.date), selectedDate));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q)
        || t.description?.toLowerCase().includes(q)
        || t.location?.toLowerCase().includes(q)
        || t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return sortTasks(list, sort);
  }, [tasks, sort, query, selectedDate]);

  const stats = useMemo(() => {
    const todayTasks = tasks.filter((t) => isToday(parseISO(t.date)));
    return {
      total: tasks.length,
      today: todayTasks.length,
      high: tasks.filter((t) => t.priority === "high" && !t.completed).length,
      done: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  const handleSubmit = (data: Omit<Task, "id" | "createdAt"> & { id?: string }) => {
    if (data.id) {
      updateTask(data.id, data);
      toast.success("Task updated");
    } else {
      addTask(data);
      toast.success("Task created");
    }
  };

  const handleEdit = (t: Task) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleOptimize = () => {
    replaceAll(optimizeSchedule(tasks));
    toast.success("Schedule optimized", {
      description: "Tasks grouped by location and ordered by priority.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onOptimize={handleOptimize} onNewTask={handleNew} />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="container relative pt-12 pb-8">
          <div className="max-w-2xl animate-slide-up">
            <p className="mb-2 text-sm font-medium text-primary">Good to see you</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Your day, organized.
            </h1>
            <p className="mt-2 text-muted-foreground">
              {stats.today > 0
                ? `${stats.today} task${stats.today === 1 ? "" : "s"} on for today${stats.high > 0 ? ` · ${stats.high} high priority` : ""}.`
                : "No tasks scheduled today. A perfect time to plan ahead."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="hero" size="lg" onClick={handleOptimize}>
                <Sparkles className="h-4 w-4" />
                Optimize schedule
              </Button>
              <Button variant="outline" size="lg" onClick={handleNew}>
                Add task
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<CalIcon className="h-4 w-4" />} label="Today" value={stats.today} />
            <StatCard icon={<Flag className="h-4 w-4" />} label="High priority" value={stats.high} />
            <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.done} />
            <StatCard icon={<MapPin className="h-4 w-4" />} label="All tasks" value={stats.total} />
          </div>
        </div>
      </section>

      {/* Main grid */}
      <main className="container pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Tasks column */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, tags, locations…"
                  className="pl-9 h-10"
                />
              </div>

              <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                <SelectTrigger className="w-[170px] h-10">
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">By priority</SelectItem>
                  <SelectItem value="datetime">By date & time</SelectItem>
                  <SelectItem value="location">By location</SelectItem>
                </SelectContent>
              </Select>

              {selectedDate && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                  Clear date filter
                </Button>
              )}
            </div>

            {visible.length === 0 ? (
              <EmptyState onCreate={handleNew} hasFilters={!!query || !!selectedDate} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
                {visible.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={handleEdit}
                    onDelete={(id) => { deleteTask(id); toast.success("Task deleted"); }}
                    onToggle={toggleComplete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <MiniCalendar tasks={tasks} selected={selectedDate} onSelect={setSelectedDate} />
            <div className="rounded-lg border border-border bg-gradient-primary p-5 text-primary-foreground shadow-sm-soft">
              <Sparkles className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">Smart optimization</p>
              <p className="mt-1 text-xs text-primary-foreground/85 leading-relaxed">
                Group tasks by location, prioritize what matters, and fill open slots automatically.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOptimize}
                className="mt-3 w-full bg-card text-foreground hover:bg-card/90"
              >
                Run now
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AIAssistant />
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-xs transition-all duration-300 hover:shadow-sm-soft hover:-translate-y-0.5">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
  </div>
);

const EmptyState = ({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center animate-fade-in">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
      <CalIcon className="h-5 w-5" />
    </div>
    <h3 className="mt-4 text-base font-semibold">
      {hasFilters ? "No matching tasks" : "Nothing here yet"}
    </h3>
    <p className="mt-1 text-sm text-muted-foreground max-w-xs">
      {hasFilters ? "Try clearing your filters or adjusting the search." : "Create your first task to start organizing your day."}
    </p>
    {!hasFilters && (
      <Button variant="hero" size="sm" className="mt-4" onClick={onCreate}>
        Create a task
      </Button>
    )}
  </div>
);

export default Index;

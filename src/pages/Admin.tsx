import { Header } from "@/components/Header";
import { useTasks } from "@/lib/taskStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, ShieldCheck, Database, Download } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const Admin = () => {
  const { tasks, deleteTask, replaceAll } = useTasks();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taiskmaster-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported tasks");
  };

  const clearAll = () => {
    if (!confirm("Delete ALL tasks? This cannot be undone.")) return;
    replaceAll([]);
    toast.success("All tasks cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header showActions={false} />

      <main className="container py-10">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
              <ShieldCheck className="h-4 w-4" />
              Admin · Open access (MVP)
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Control panel</h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Inspect every task in the system. Authentication is intentionally disabled in this MVP — see SETUP_AND_NEXT_STEPS.md for how to add it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportJson}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="destructive" onClick={clearAll}>
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Tasks</span>
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          </div>

          {tasks.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(t.date), "MMM d, yyyy")}{t.time ? ` · ${t.time}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.priority === "high" ? "text-priority-high border-priority-high/30 bg-priority-high/10"
                          : t.priority === "medium" ? "text-priority-medium border-priority-medium/30 bg-priority-medium/10"
                          : "text-priority-low border-priority-low/30 bg-priority-low/10"
                        }
                      >
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.location ?? "—"}</TableCell>
                    <TableCell>
                      {t.completed ? (
                        <Badge className="bg-success/15 text-success border-success/20" variant="outline">Done</Badge>
                      ) : (
                        <Badge variant="outline">Open</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { deleteTask(t.id); toast.success("Task deleted"); }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;

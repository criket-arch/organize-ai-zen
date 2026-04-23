import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTasks, optimizeSchedule } from "@/lib/taskStore";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const greeting: Message = {
  id: "intro",
  role: "assistant",
  content:
    "Hi — I'm your scheduling assistant. Try things like:\n• \"What's on for today?\"\n• \"Add: Call dentist tomorrow at 3pm\"\n• \"Optimize my schedule\"",
};

/**
 * Rule-based assistant. Designed so an OpenAI call can be dropped into
 * `runAssistant()` later without touching the UI.
 *
 * To wire a real model later:
 *   1. Enable Lovable Cloud and create an edge function `chat` that proxies
 *      to OpenAI / Lovable AI Gateway.
 *   2. Replace the body of `runAssistant` with a fetch to that function.
 */
const runAssistant = (
  input: string,
  ctx: ReturnType<typeof useTasks>,
): string => {
  const text = input.trim().toLowerCase();
  const { tasks, addTask, replaceAll } = ctx;

  if (!text) return "Tell me what you'd like to do.";

  if (text.includes("optimize") || text.includes("reorganize")) {
    replaceAll(optimizeSchedule(tasks));
    return "Done — I grouped tasks by location, ordered by priority, and filled open slots starting at 9:00.";
  }

  if (text.startsWith("add") || text.startsWith("new task") || text.startsWith("create")) {
    // Ultra-light parser: "add: Title tomorrow at 3pm"
    const cleaned = input.replace(/^(add|new task|create)[:\s]+/i, "").trim();
    if (!cleaned) return "What should the task be? e.g. \"Add: Email Sam tomorrow at 10am\".";
    let date = new Date();
    if (/tomorrow/i.test(cleaned)) date.setDate(date.getDate() + 1);
    const timeMatch = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);
    let time: string | undefined;
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const mer = timeMatch[3]?.toLowerCase();
      if (mer === "pm" && h < 12) h += 12;
      if (mer === "am" && h === 12) h = 0;
      if (h <= 23) time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
    const title = cleaned.replace(/tomorrow|today/i, "").replace(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i, "").replace(/\s+at\s+$/i, "").replace(/\s+/g, " ").trim();
    addTask({
      title: title || "New task",
      date: date.toISOString().slice(0, 10),
      time,
      priority: /urgent|asap|high/i.test(cleaned) ? "high" : "medium",
    });
    return `Added "${title || "New task"}"${time ? ` at ${time}` : ""}.`;
  }

  if (text.includes("today")) {
    const iso = new Date().toISOString().slice(0, 10);
    const today = tasks.filter((t) => t.date === iso && !t.completed);
    if (today.length === 0) return "Nothing scheduled today — a clean slate.";
    return `You have ${today.length} task${today.length === 1 ? "" : "s"} today:\n` +
      today.map((t) => `• ${t.time ? t.time + " — " : ""}${t.title}`).join("\n");
  }

  if (text.includes("priority") || text.includes("important")) {
    const high = tasks.filter((t) => t.priority === "high" && !t.completed);
    if (high.length === 0) return "No high-priority items right now. 🎉";
    return "High priority:\n" + high.map((t) => `• ${t.title} — ${t.date}`).join("\n");
  }

  if (text.includes("help") || text.includes("?")) {
    return "I can help you:\n• Review what's on (\"What's on today?\")\n• Add tasks (\"Add: Coffee with Alex tomorrow at 9am\")\n• Optimize your schedule (\"Optimize my day\")";
  }

  return "I'm running in offline mode for now. Try \"optimize my schedule\", \"what's on today\", or \"add: <task>\".";
};

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const taskCtx = useTasks();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    const reply: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: runAssistant(input, taskCtx),
    };
    setMessages((m) => [...m, userMsg, reply]);
    setInput("");
    if (reply.content.startsWith("Done")) toast.success("Schedule updated");
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-all duration-300 ease-spring hover:scale-110 hover:shadow-lg-soft animate-scale-in"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex w-[min(380px,calc(100vw-3rem))] flex-col rounded-2xl border border-border bg-card shadow-lg-soft animate-scale-in overflow-hidden",
        minimized ? "h-14" : "h-[min(560px,calc(100vh-3rem))]",
        "transition-[height] duration-300 ease-smooth",
      )}
    >
      <header className="flex items-center justify-between border-b border-border bg-gradient-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Assistant</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Offline mode</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setMinimized((m) => !m)} aria-label="Minimize">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {!minimized && (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex animate-fade-in",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="h-10"
            />
            <Button type="submit" size="icon" variant="hero" disabled={!input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
};

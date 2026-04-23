import { Sparkles, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  onOptimize?: () => void;
  onNewTask?: () => void;
  showActions?: boolean;
}

export const Header = ({ onOptimize, onNewTask, showActions = true }: Props) => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-sm-soft transition-transform duration-300 ease-spring group-hover:scale-105">
            <ListTodo className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">Taiskmaster</p>
            <p className="text-[11px] text-muted-foreground">AI scheduling, refined</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !isAdmin ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            Dashboard
          </Link>
          <Link
            to="/admin"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isAdmin ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            Admin
          </Link>
        </nav>

        {showActions && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOptimize} className="hidden sm:inline-flex">
              <Sparkles className="h-4 w-4" />
              Optimize
            </Button>
            <Button variant="hero" size="sm" onClick={onNewTask}>
              New task
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

import { Sparkles, ListTodo, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  onOptimize?: () => void;
  onNewTask?: () => void;
  onRecommend?: () => void;
  showActions?: boolean;
}

export const Header = ({ onOptimize, onNewTask, onRecommend, showActions = true }: Props) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

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
            className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-foreground transition-colors"
          >
            Dashboard
          </Link>
        </nav>

        {showActions && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="hidden sm:inline-flex"
            >
              {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
            <Button variant="outline" size="sm" onClick={onOptimize} className="hidden sm:inline-flex">
              <Sparkles className="h-4 w-4" />
              Optimize
            </Button>
            <Button variant="outline" size="sm" onClick={onRecommend} className="hidden lg:inline-flex">
              <Sparkles className="h-4 w-4" />
              Recommend
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

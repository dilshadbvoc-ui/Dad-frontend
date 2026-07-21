import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  User,
  Building,
  Briefcase,
  CheckSquare,
  TrendingUp,
  Loader2,
  Command as CommandIcon,
  X,
  ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'account' | 'opportunity' | 'task';
  title: string;
  subtitle: string;
  description?: string;
  url: string;
}

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Track visual viewport (shrinks when keyboard opens on mobile)
  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      setViewportHeight(vv ? vv.height : window.innerHeight);
    };
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    update();
    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
    };
  }, []);

  // Toggle on Cmd+K (desktop) or custom event (mobile bottom nav)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const handleOpenEvent = () => setOpen(true);

    document.addEventListener("keydown", down);
    document.addEventListener("openCommandCenter", handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("openCommandCenter", handleOpenEvent);
    };
  }, []);

  // Focus input and reset on open/close
  useEffect(() => {
    if (open) {
      // Lock body scroll on mobile
      if (isMobile) document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open, isMobile]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/search/global?q=${encodeURIComponent(q)}&limit=10`);
      const searchData = response.data.data || response.data;
      const rawResults = searchData.results || [];
      setResults(Array.isArray(rawResults) ? rawResults.filter((r: unknown) => r && typeof r === 'object') as SearchResult[] : []);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleClose = () => setOpen(false);

  const handleSelect = (result: SearchResult) => {
    handleClose();
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead': return <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'contact': return <User className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'account': return <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      case 'task': return <CheckSquare className="h-4 w-4 text-red-600 dark:text-red-400" />
      default: return <Briefcase className="h-4 w-4 text-muted-foreground" />
    }
  };

  // --- Shared results JSX ---
  const ResultsContent = () => (
    <>
      {!query && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <CommandIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Type to search across the CRM</p>
          <div className="hidden sm:flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="p-1 px-1.5 border border-border rounded bg-muted border-b-2">↑↓</span>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="p-1 px-1.5 border border-border rounded bg-muted border-b-2">ENTER</span>
              <span>to select</span>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              className={cn(
                "w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left rounded-xl transition-all duration-150 outline-none active:scale-[0.98]",
                selectedIndex === index
                  ? "bg-accent text-accent-foreground ring-1 ring-primary/10"
                  : "hover:bg-muted/50 text-foreground"
              )}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={cn(
                "p-2 rounded-lg bg-card shadow-sm border border-border shrink-0",
                selectedIndex === index && "border-primary/50"
              )}>
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{result.title}</p>
                <p className="text-xs opacity-60 truncate">{result.subtitle} • {result.type}</p>
              </div>
              <div className="text-[10px] font-medium opacity-40 uppercase tracking-widest pl-2 shrink-0">
                {result.type}
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No results found for "{query}"
        </div>
      )}
    </>
  );

  // --- Mobile: full-screen portal overlay ---
  if (isMobile) {
    if (!open) return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex flex-col bg-background"
        style={{ height: `${viewportHeight}px` }}
      >
        {/* Header / Input row */}
        <div className="flex items-center gap-2 px-3 border-b border-border bg-background"
          style={{ minHeight: '56px' }}
        >
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors shrink-0 text-muted-foreground"
            aria-label="Close search"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Search className="h-4 w-4 shrink-0 opacity-40 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="flex-1 h-11 bg-transparent text-base outline-none border-none focus-visible:ring-0 placeholder:text-muted-foreground text-foreground"
            placeholder="Search leads, contacts, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="p-2 rounded-full hover:bg-muted transition-colors shrink-0 text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto p-2">
          <ResultsContent />
        </div>
      </div>,
      document.body
    );
  }

  // --- Desktop: centered Dialog ---
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 border-none shadow-2xl max-w-2xl bg-popover overflow-hidden rounded-2xl [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Command Center</DialogTitle>
        <DialogDescription className="sr-only">Quickly search for leads, contacts, and tasks.</DialogDescription>

        <div className="flex items-center border-b border-border px-4 gap-2">
          <Search className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 placeholder:text-muted-foreground text-foreground"
            placeholder="Search leads, contacts, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query ? (
            <button
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="p-1.5 rounded-full hover:bg-muted transition-colors shrink-0 text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium ml-auto text-muted-foreground shrink-0">
              <span className="text-xs">ESC</span>
            </div>
          )}
        </div>

        <div className="max-h-[450px] overflow-y-auto p-2 scroll-smooth">
          <ResultsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}

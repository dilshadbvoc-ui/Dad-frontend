import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

// Lightweight renderer for the small subset of markdown the assistant uses
// (bold, numbered/bulleted lists, paragraph breaks) — avoids pulling in a
// full markdown library just for chat-bubble formatting.
function renderBold(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

function formatAssistantText(text: string) {
  const lines = text.split('\n').filter((l, i, arr) => !(l.trim() === '' && arr[i - 1]?.trim() === ''));
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);

    if (orderedMatch) {
      return (
        <div key={i} className="flex gap-1.5 pl-0.5">
          <span className="text-muted-foreground shrink-0">{orderedMatch[1]}.</span>
          <span>{renderBold(orderedMatch[2], `l${i}`)}</span>
        </div>
      );
    }
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-1.5 pl-0.5">
          <span className="text-muted-foreground shrink-0">•</span>
          <span>{renderBold(bulletMatch[1], `l${i}`)}</span>
        </div>
      );
    }
    if (trimmed === '') {
      return <div key={i} className="h-1.5" />;
    }
    return <div key={i}>{renderBold(line, `l${i}`)}</div>;
  });
}

export function TrainingAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: "Hi! I'm your Training Assistant \u{1F44B} — ask me anything about the CRM, including how our integrations (Meta, WhatsApp, Twilio, and more) actually work.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/training/chat', { message: trimmed, history });
      const reply = res.data?.reply || "Sorry, I didn't get a response — please try again.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: "I couldn't reach the assistant right now — please try again in a moment." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          title="Training Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
            <Sparkles className="h-2 w-2 text-white" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2.5rem))] h-[min(520px,calc(100vh-6rem))] rounded-[14px] bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[hsl(var(--chart-5))] text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">Training Assistant</p>
                <p className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 inline-block" />
                  AI-powered — answers may occasionally be inaccurate
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-white/20 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-muted/20">
            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-[10px] px-3 py-2 text-xs leading-relaxed space-y-0.5',
                    m.role === 'user'
                      ? 'bg-[hsl(var(--chart-5))] text-white rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm'
                  )}
                >
                  {m.role === 'assistant' ? formatAssistantText(m.text) : m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-[10px] rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-border flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              disabled={isTyping}
              className="flex-1 h-9 rounded-[10px] border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--chart-5))]/30 disabled:opacity-60"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="h-9 w-9 shrink-0 rounded-[10px] bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/90 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

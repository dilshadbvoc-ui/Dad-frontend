import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

// Rotates through a couple of canned replies so it doesn't feel like the exact
// same string every time — still fully client-side/local, no backend call.
// This is a placeholder shell: swap `sendPlaceholderReply` for a real API call
// (e.g. to a support-bot endpoint) when that's ready, and everything else
// (message list, input, open/close state) stays the same.
const CANNED_REPLIES = [
  "Thanks for asking! I'm still in training myself \u{1F916} — full AI-powered answers are coming soon. In the meantime, check the FAQ tab below or use \"Submit Ticket\" for a real person.",
  "Good question! This assistant isn't connected to live answers yet, but it will be soon. Try the FAQ search above, or reach out to support for now.",
  "I've noted that down! Real-time answers from me are on the roadmap — for anything urgent right now, please contact support directly.",
];

let replyIndex = 0;

export function TrainingAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: "Hi! I'm your Training Assistant \u{1F44B} — ask me anything about the CRM. (Heads up: I'm a preview build right now, so my answers are canned while the real AI gets wired up.)",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Placeholder "thinking" delay — replace with the real request/response cycle later.
    setTimeout(() => {
      const reply = CANNED_REPLIES[replyIndex % CANNED_REPLIES.length];
      replyIndex += 1;
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 700);
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
                  Preview — canned replies
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
                    'max-w-[85%] rounded-[10px] px-3 py-2 text-xs leading-relaxed',
                    m.role === 'user'
                      ? 'bg-[hsl(var(--chart-5))] text-white rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm'
                  )}
                >
                  {m.text}
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
              className="flex-1 h-9 rounded-[10px] border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--chart-5))]/30"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
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

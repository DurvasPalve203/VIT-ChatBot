import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AnimatedRobot from "@/components/AnimatedRobot";
import FloatingParticles from "@/components/FloatingParticles";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; category: string; branch: string }[];
}

const suggestedQuestions = [
  "What are the exam rules for SE Computer Engineering?",
  "Show me the syllabus for TE IT branch",
  "What is the attendance policy at VIT?",
  "Tell me about the FE academic regulations",
];

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const robotState = isLoading
    ? "thinking"
    : messages.length > 0 && messages[messages.length - 1]?.role === "assistant"
      ? "talking"
      : messages.length === 0
        ? "greeting"
        : "idle";

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput("");

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      };
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.error || "Failed to get response");
        setIsLoading(false);
        return;
      }

      let sources: any[] = [];
      try {
        const sourcesHeader = resp.headers.get("X-Sources");
        if (sourcesHeader) sources = JSON.parse(sourcesHeader);
      } catch {}

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      const updateAssistant = (content: string, srcs: any[]) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content, sources: srcs } : m);
          }
          return [...prev, { role: "assistant", content, sources: srcs }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent, sources);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (user && assistantContent) {
        supabase.functions.invoke("save-query", {
          body: { question, response: assistantContent, sources, user_id: user.id },
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to AI. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <main className="relative flex h-[calc(100vh-4rem)] flex-col">
      <FloatingParticles count={20} />

      <div className="relative z-10 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="container flex h-full flex-col items-center justify-center py-12">
            <AnimatedRobot state={robotState} size="xl" className="mb-6" />

            <h1
              className="mb-2 text-2xl font-bold neon-glow-text"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Ask VIT Intel
            </h1>
            <p className="mb-10 max-w-md text-center text-muted-foreground">
              Get verified answers about academics, syllabi, regulations, and more from official VIT documents.
            </p>
            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="card-elevated flex items-start gap-3 rounded-lg neon-border bg-card p-4 text-left text-sm text-foreground transition-colors hover:border-accent/50"
                >
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="container max-w-3xl space-y-6 py-6">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="shrink-0 pt-1">
                      <AnimatedRobot
                        state={i === messages.length - 1 && isLoading ? "thinking" : "idle"}
                        size="sm"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "msg-bot glass-panel"
                    }`}
                  >
                    {msg.content}
                    {msg.role === "assistant" && i === messages.length - 1 && isLoading && (
                      <span className="typing-cursor" />
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
                      <span className="text-xs font-bold text-accent">U</span>
                    </div>
                  )}
                </div>
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="ml-[92px] mt-2 flex flex-wrap gap-2">
                    {msg.sources.map((s, si) => (
                      <span key={si} className="inline-flex items-center gap-1 rounded-md bg-accent/10 border border-accent/20 px-2 py-1 text-xs text-accent">
                        <BookOpen className="h-3 w-3" /> {s.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="shrink-0 pt-1">
                  <AnimatedRobot state="thinking" size="sm" />
                </div>
                <div className="flex items-center gap-2 rounded-xl glass-panel msg-bot px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" /> Searching documents...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="relative z-10 border-t border-border bg-card/80 backdrop-blur-md p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="container flex max-w-3xl gap-2 chat-input-glow rounded-lg border border-border bg-card p-1 transition-all"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about syllabi, regulations, campus info..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
          <Button variant="accent" size="icon" type="submit" disabled={!input.trim() || isLoading} className="glow-accent">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </main>
  );
};

export default Chat;

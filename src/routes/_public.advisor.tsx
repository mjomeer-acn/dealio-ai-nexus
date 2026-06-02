import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { aiService, vehiclesService } from "@/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, BookOpen, ArrowRight } from "lucide-react";
import type { Conversation, Message } from "@/api/types";
import { formatMUR } from "@/lib/formatters";

export const Route = createFileRoute("/_public/advisor")({
  head: () => ({
    meta: [
      { title: "Dealio AI Advisor" },
      { name: "description", content: "Conversational AI advisor that matches you to the right car in Mauritius." },
    ],
  }),
  component: AdvisorPage,
});

function AdvisorPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Start the conversation on mount
  useEffect(() => {
    let alive = true;
    aiService.startConversation().then((c) => {
      if (alive) setConversation(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation, streamingText]);

  const send = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation) throw new Error("No conversation");
      // optimistic user message
      const optimistic: Message = {
        id: `tmp-${Date.now()}`,
        conversationId: conversation.id,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversation({ ...conversation, messages: [...conversation.messages, optimistic] });
      const result = await aiService.sendMessage(conversation.id, content);
      // simulate streaming by progressively revealing tokens
      const fullText = result.assistantMessage.content;
      setStreamingText("");
      for (let i = 1; i <= fullText.length; i += 3) {
        await new Promise((r) => setTimeout(r, 18));
        setStreamingText(fullText.slice(0, i));
      }
      setStreamingText("");
      setConversation(result.conversation);
      return result;
    },
  });

  const handleSend = () => {
    if (!draft.trim() || send.isPending) return;
    const content = draft.trim();
    setDraft("");
    send.mutate(content);
  };

  const progress = conversation?.qualificationProgress ?? 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">AI Advisor</p>
          <h1 className="text-2xl font-semibold tracking-tight">Tell Dealio what you need</h1>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs text-muted-foreground">Match progress</span>
          <Progress value={progress * 100} className="w-32" />
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <div ref={scrollRef} className="flex h-[60vh] flex-col gap-4 overflow-y-auto p-6">
            <AnimatePresence initial={false}>
              {(conversation?.messages ?? []).map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </AnimatePresence>
            {send.isPending && streamingText && (
              <div className="flex gap-3">
                <Avatar />
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">
                  {streamingText}
                  <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-primary align-middle" />
                </div>
              </div>
            )}
            {send.isPending && !streamingText && (
              <div className="flex gap-3">
                <Avatar />
                <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "120ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="I'm looking for a hybrid SUV under 2.5M MUR…"
              disabled={!conversation || send.isPending}
            />
            <Button onClick={handleSend} disabled={!conversation || send.isPending || !draft.trim()} className="gap-1">
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {progress >= 0.85 && conversation && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>You're qualified. A dealer can take it from here.</span>
            </div>
            <Button asChild size="sm" className="gap-1">
              <Link to="/lead-capture">
                Finish & connect <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Avatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
      D
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={isUser ? "flex justify-end" : "flex gap-3"}
    >
      {!isUser && <Avatar />}
      <div className={"max-w-[78%] " + (isUser ? "" : "space-y-2")}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm"
              : "rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm"
          }
        >
          {message.content}
        </div>
        {message.recommendations && message.recommendations.length > 0 && (
          <RecommendationStrip ids={message.recommendations.map((r) => r.vehicleId)} />
        )}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <Badge key={c.documentId} variant="outline" className="gap-1 text-[10px]">
                <BookOpen className="h-3 w-3" /> {c.title}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RecommendationStrip({ ids }: { ids: string[] }) {
  const { data } = useQuery({
    queryKey: ["vehicles", "by-ids", ids],
    queryFn: () => vehiclesService.list(),
    select: (rows) => rows.filter((v) => ids.includes(v.id)).slice(0, 3),
  });
  if (!data || data.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {data.map((v) => (
        <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }}>
          <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-[var(--shadow-elegant)]">
            <div className="aspect-[4/3] bg-muted">
              <img src={v.images[0]} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
            </div>
            <CardContent className="space-y-0.5 p-3">
              <div className="text-xs text-muted-foreground">{v.year}</div>
              <div className="text-sm font-semibold">{v.make} {v.model}</div>
              <div className="text-xs font-medium text-primary">{formatMUR(v.priceMUR)}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
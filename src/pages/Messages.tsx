import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, MessageSquare } from "lucide-react";

type MessageRecord = {
  id: string;
  room_id: string;
  sender_id: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  } | string;
  body: string;
  created_at?: string;
};

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function load() {
    setLoading(true);
    try {
      // Fetch messages from global room 'general-board'
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", "general-board")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as any) ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load messages", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        room_id: "general-board",
        sender_id: user.id,
        body: messageText.trim(),
      });
      if (error) throw error;
      setMessageText("");
      void load();
    } catch (err: any) {
      toast({ title: "Failed to send message", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="Campus Messages Board">
      <div className="max-w-4xl mx-auto animate-fade-up">
        <Card className="h-[75vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-surface/50 flex items-center gap-3">
            <MessageSquare className="size-5 text-leaf-700" />
            <div>
              <h3 className="font-semibold text-sm">General Discussion Channel</h3>
              <p className="text-xs text-muted-foreground">Announcements and discussions open to all students and staff.</p>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-muted/10">
            {loading ? (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                <Loader2 className="size-6 animate-spin mr-2" /> Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <MessageSquare className="size-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No messages posted yet</p>
                <p className="text-xs">Be the first to post a message in this channel!</p>
              </div>
            ) : (
              messages.map((m) => {
                const sender = typeof m.sender_id === "object" ? m.sender_id : null;
                const isMe = sender?.id === user?.id;

                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {sender?.full_name ?? "User"}
                      </span>
                      <span className={`text-[9px] uppercase px-1 rounded font-medium ${
                        sender?.role === "admin"
                          ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/10"
                          : "bg-leaf-50 text-leaf-700 ring-1 ring-leaf-600/10"
                      }`}>
                        {sender?.role ?? "student"}
                      </span>
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? "bg-leaf-600 text-white rounded-tr-none"
                        : "bg-white text-foreground border border-border rounded-tl-none"
                    }`}>
                      <p>{m.body}</p>
                      <span className={`text-[9px] block text-right mt-1.5 ${
                        isMe ? "text-leaf-100" : "text-muted-foreground"
                      }`}>
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Message Input Form */}
          <div className="p-4 border-t border-border bg-white">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sending}
                className="flex-grow"
              />
              <Button type="submit" size="icon" disabled={sending || !messageText.trim()}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

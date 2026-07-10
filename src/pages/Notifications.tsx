import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Bell, Loader2, Trash2, CheckSquare } from "lucide-react";

type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  read: boolean;
  created_at?: string;
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) void load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications((data as any) ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load notifications", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
      void load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleMarkAllRead() {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user?.id)
        .eq("read", false);

      if (error) throw error;
      toast({ title: "All notifications marked as read" });
      void load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleClearAll() {
    if (!confirm("Are you sure you want to delete all notifications?")) return;
    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user?.id);
      if (error) throw error;
      toast({ title: "Notifications cleared" });
      void load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  return (
    <AppShell title="Notifications">
      <div className="max-w-3xl mx-auto animate-fade-up space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Inbox</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="flex items-center gap-1">
                <CheckSquare className="size-3.5" /> Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1"
              >
                <Trash2 className="size-3.5" /> Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Bell className="size-10 mb-3 opacity-30 text-leaf-600" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs">No new notifications at this time.</p>
            </Card>
          ) : (
            notifications.map((n) => (
              <Card
                key={n.id}
                className={`p-5 transition-all border flex gap-4 items-start ${
                  n.read ? "bg-white border-border" : "bg-leaf-50/20 border-leaf-100 ring-1 ring-leaf-50/30"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${n.read ? "bg-muted text-muted-foreground" : "bg-leaf-100 text-leaf-700"}`}>
                  <Bell className="size-4" />
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`text-sm font-medium ${n.read ? "text-foreground" : "text-leaf-950 font-semibold"}`}>{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>}
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)} className="text-xs text-leaf-700 hover:text-leaf-800 hover:bg-leaf-50 shrink-0 self-center">
                    Mark read
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

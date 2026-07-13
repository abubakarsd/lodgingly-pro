import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Bed, MessageSquare, Plus, Wrench } from "lucide-react";

type Allocation = {
  id: string; bed_label: string; term: string; status: string;
  rooms: { id: string; room_number: string; room_type: string; blocks: { name: string; hostels: { name: string } } } | null;
};

type Complaint = { id: string; title: string; category: string; status: string; priority: string; created_at: string };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComplaint, setOpenComplaint] = useState(false);

  // Roommates State
  const [roommates, setRoommates] = useState<any[]>([]);
  const [loadingRoommates, setLoadingRoommates] = useState(false);
  const [roommatesDialogOpen, setRoommatesDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  async function load() {
    setLoading(true);
    const [a, c] = await Promise.all([
      supabase.from("allocations")
        .select("id, bed_label, term, status, rooms(id, room_number, room_type, blocks(name, hostels(name)))")
        .eq("student_id", user!.id).eq("status", "active").maybeSingle(),
      supabase.from("complaints").select("id, title, category, status, priority, created_at")
        .eq("student_id", user!.id).order("created_at", { ascending: false }).limit(5),
    ]);
    setAllocation((a.data as any) ?? null);
    setComplaints(c.data ?? []);
    setLoading(false);
  }

  async function fetchRoommates() {
    if (!allocation || !allocation.rooms) return;
    setLoadingRoommates(true);
    setRoommates([]);
    
    const { data, error } = await supabase
      .from("allocations")
      .select("id, bed_label, student_id, room_id");
      
    setLoadingRoommates(false);
    if (error) {
      toast({ title: "Failed to load roommates", description: error.message, variant: "destructive" });
      return;
    }

    const activeRoomId = allocation.rooms.id;
    const mates = (data ?? [])
      .filter((a: any) => a.rooms?.id === activeRoomId && a.student_id?.id !== user?.id)
      .map((a: any) => ({
        id: a.id,
        bed_label: a.bed_label,
        name: a.student_id?.full_name || "Unknown Student",
        email: a.student_id?.email || "N/A",
        matric: a.student_id?.matric_number || "N/A",
        program: a.student_id?.program || "Unspecified Department"
      }));
      
    setRoommates(mates);
  }

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-12 gap-4 md:gap-6 animate-fade-up">
        {/* Allocation */}
        <Card className="col-span-12 lg:col-span-8 p-6 border-leaf-100 bg-leaf-50/60">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-semibold text-leaf-700 uppercase tracking-wider">Active Allocation</span>
              {loading ? (
                <p className="text-sm text-muted-foreground mt-2">Loading…</p>
              ) : allocation && allocation.rooms ? (
                <>
                  <h3 className="text-2xl font-semibold text-leaf-900 mt-1">{allocation.rooms.blocks.hostels.name}, {allocation.rooms.blocks.name}</h3>
                  <p className="text-sm text-leaf-700/80 mt-1">Room {allocation.rooms.room_number} • {allocation.rooms.room_type} • Bed {allocation.bed_label}</p>
                  <p className="text-xs text-leaf-700/60 mt-2">Term: {allocation.term}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRoommatesDialogOpen(true);
                      void fetchRoommates();
                    }}
                    className="mt-4 border-leaf-200 text-leaf-700 hover:bg-leaf-100/50 bg-white"
                  >
                    View Roommates
                  </Button>
                </>
              ) : (
                <div className="mt-3">
                  <h3 className="text-xl font-medium text-leaf-900">No accommodation yet</h3>
                  <p className="text-sm text-leaf-700/70 mt-1">Reserve a bed to get started.</p>
                  <Link to="/accommodation" className="mt-4 inline-flex items-center gap-2 bg-leaf-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-leaf-700">
                    <Plus className="size-4" /> New Accommodation
                  </Link>
                </div>
              )}
            </div>
            {allocation && <span className="bg-white px-3 py-1 rounded-full text-[11px] font-semibold text-leaf-700 ring-1 ring-leaf-100 whitespace-nowrap">Term Active</span>}
          </div>
        </Card>

        {/* Stats */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Clearance</span>
            <div className="mt-2 flex items-center gap-2">
              <div className="size-2 rounded-full bg-leaf-500"></div>
              <span className="text-sm font-medium">Pending review</span>
            </div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Complaints</span>
            <div className="mt-2 text-sm font-medium">{complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length} active</div>
          </Card>
        </div>

        {/* Complaints */}
        <Card className="col-span-12 lg:col-span-8 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Recent complaints</h3>
              <p className="text-sm text-muted-foreground">Maintenance and service requests</p>
            </div>
            <Dialog open={openComplaint} onOpenChange={setOpenComplaint}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="size-4" /> New</Button>
              </DialogTrigger>
              <NewComplaintDialog onDone={() => { setOpenComplaint(false); void load(); }} />
            </Dialog>
          </div>
          {complaints.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Wrench className="size-8 mx-auto mb-2 opacity-40" />
              No complaints yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {complaints.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.category} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      c.priority === "high" ? "bg-red-100 text-red-700" : c.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                    }`}>{c.priority}</span>
                    <span className="text-xs font-medium capitalize">{c.status.replace("_", " ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="col-span-12 lg:col-span-4 p-6">
          <h3 className="font-semibold">Quick actions</h3>
          <div className="mt-4 space-y-2">
            <Link to="/accommodation" className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface text-sm">
              <span className="flex items-center gap-2"><Bed className="size-4 text-leaf-700" /> Browse hostels</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface text-sm text-left" onClick={() => toast({ title: "Coming in Phase 2", description: "Roommate chat launches next." })}>
              <span className="flex items-center gap-2"><MessageSquare className="size-4 text-leaf-700" /> Roommate chat</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </Card>
      </div>

      {/* Roommates Directory Sheet */}
      <Sheet open={roommatesDialogOpen} onOpenChange={setRoommatesDialogOpen}>
        <SheetContent side="right" className="sm:max-w-[425px] overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Roommates Directory</SheetTitle>
            <SheetDescription>List of active peers assigned to your room.</SheetDescription>
          </SheetHeader>
          <div className="py-6 mt-4">
            {loadingRoommates ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-t-leaf-600 border-muted rounded-full animate-spin" />
              </div>
            ) : roommates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No roommates allocated to this room yet.</p>
            ) : (
              <div className="space-y-4">
                {roommates.map((m) => (
                  <div key={m.id} className="flex flex-col p-4 rounded-xl border bg-surface/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-leaf-500" />
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-zinc-900">{m.name}</p>
                      <span className="text-[10px] font-bold text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded ring-1 ring-leaf-100 uppercase">
                        Bed {m.bed_label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{m.matric !== "N/A" ? `Reg: ${m.matric}` : `Email: ${m.email}`}</p>
                      <p className="text-xs text-leaf-700 font-medium">{m.program}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function NewComplaintDialog({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("maintenance");
  const [priority, setPriority] = useState("medium");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("complaints").insert({
      student_id: user.id, title, description, category, priority: priority as any,
    });
    setBusy(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Complaint submitted" });
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New complaint</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label>Title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="cleanliness">Cleanliness</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2"><Label>Description</Label><Textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <Button type="submit" disabled={busy} className="w-full">Submit complaint</Button>
      </form>
    </DialogContent>
  );
}

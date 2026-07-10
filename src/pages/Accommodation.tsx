import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import heroEmerald from "@/assets/hostel-emerald.jpg";
import verdant from "@/assets/hostel-verdant.jpg";
import cedar from "@/assets/hostel-cedar.jpg";
import ivy from "@/assets/hostel-ivy.jpg";
import { Bed, Users } from "lucide-react";

const imgFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("umar") || n.includes("danfodio")) return heroEmerald;
  if (n.includes("amina") || n.includes("dangote")) return verdant;
  if (n.includes("ribadu")) return cedar;
  return ivy;
};

type Hostel = { id: string; name: string; description: string | null; campus: string | null; gender: string };
type Room = { id: string; room_number: string; capacity: number; room_type: string; price_per_term: number; block_id: string; taken: number };
type Block = { id: string; name: string; hostel_id: string; rooms: Room[] };

export default function Accommodation() {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [existing, setExisting] = useState<any>(null);
  const [busyRoom, setBusyRoom] = useState<string | null>(null);

  useEffect(() => { void load(); }, [user]);

  async function load() {
    const [hs, bs, rs, alloc] = await Promise.all([
      supabase.from("hostels").select("*").order("name"),
      supabase.from("blocks").select("id, name, hostel_id"),
      supabase.from("rooms").select("id, room_number, capacity, room_type, price_per_term, block_id"),
      user ? supabase.from("allocations").select("id, room_id, bed_label").eq("student_id", user.id).eq("status", "active").maybeSingle() : Promise.resolve({ data: null }),
    ]);
    // count active allocations per room
    const { data: taken } = await supabase.from("allocations").select("room_id").eq("status", "active");
    const takenMap = new Map<string, number>();
    (taken ?? []).forEach((t: any) => takenMap.set(t.room_id, (takenMap.get(t.room_id) ?? 0) + 1));

    setHostels(hs.data ?? []);
    setExisting((alloc as any).data ?? null);
    const blockList: Block[] = (bs.data ?? []).map((b: any) => ({
      ...b,
      rooms: (rs.data ?? []).filter((r: any) => r.block_id === b.id).map((r: any) => ({ ...r, taken: takenMap.get(r.id) ?? 0 })),
    }));
    setBlocks(blockList);
    if (!selected && hs.data?.length) setSelected(hs.data[0].id);
  }

  async function reserve(room: Room) {
    if (!user) return;
    if (existing) { toast({ title: "Already allocated", description: "Cancel your current allocation first." }); return; }
    if (room.taken >= room.capacity) { toast({ title: "Full", description: "This room has no free beds.", variant: "destructive" }); return; }
    setBusyRoom(room.id);
    const bed = String.fromCharCode(65 + room.taken); // A, B, C
    const { error } = await supabase.from("allocations").insert({
      student_id: user.id, room_id: room.id, bed_label: bed, term: "2026/27", status: "active",
    });
    setBusyRoom(null);
    if (error) { toast({ title: "Reservation failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Reserved!", description: `Bed ${bed} — Room ${room.room_number}` });
    void load();
  }

  const shown = blocks.filter((b) => b.hostel_id === selected);
  const active = hostels.find((h) => h.id === selected);

  return (
    <AppShell title="Accommodation">
      <div className="grid grid-cols-12 gap-6 animate-fade-up">
        <aside className="col-span-12 lg:col-span-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Residences</p>
          {hostels.map((h) => (
            <button key={h.id} onClick={() => setSelected(h.id)}
              className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                selected === h.id ? "border-leaf-500 ring-2 ring-leaf-100" : "border-border hover:border-leaf-200"
              }`}>
              <div className="aspect-[16/9] overflow-hidden bg-surface">
                <img src={imgFor(h.name)} alt={h.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{h.name}</h4>
                  <span className="text-[10px] uppercase font-semibold text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded">{h.gender}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{h.campus}</p>
              </div>
            </button>
          ))}
        </aside>

        <div className="col-span-12 lg:col-span-8">
          {active && (
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">{active.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
            </Card>
          )}

          <div className="space-y-6">
            {shown.map((b) => (
              <Card key={b.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{b.name}</h3>
                  <span className="text-xs text-muted-foreground">{b.rooms.length} rooms</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.rooms.map((r) => {
                    const free = r.capacity - r.taken;
                    const isFull = free <= 0;
                    return (
                      <div key={r.id} className={`rounded-xl border p-4 ${isFull ? "bg-muted/40 border-border" : "border-leaf-100 bg-leaf-50/40"}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground tracking-wider">Room</p>
                            <p className="text-lg font-semibold">{r.room_number}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isFull ? "bg-muted text-muted-foreground" : "bg-white text-leaf-700 ring-1 ring-leaf-100"}`}>
                            {isFull ? "Full" : `${free} free`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{r.room_type}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="size-3" /> {r.capacity}</span>
                          <span className="flex items-center gap-1"><Bed className="size-3" /> {r.taken}/{r.capacity}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-medium">${r.price_per_term.toFixed(0)}<span className="text-xs text-muted-foreground">/term</span></span>
                          <Button size="sm" disabled={isFull || !!existing || busyRoom === r.id} onClick={() => reserve(r)}>
                            {busyRoom === r.id ? "…" : "Reserve"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

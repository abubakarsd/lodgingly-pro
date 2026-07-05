import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bed, Building2, Users, Wrench } from "lucide-react";

type Stat = { label: string; value: string; hint?: string; Icon: any };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [occupancy, setOccupancy] = useState<{ hostel: string; occ: number; total: number }[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [rooms, alloc, hostels, blocks, comps] = await Promise.all([
      supabase.from("rooms").select("id, capacity, block_id"),
      supabase.from("allocations").select("id, room_id, status").eq("status", "active"),
      supabase.from("hostels").select("id, name"),
      supabase.from("blocks").select("id, hostel_id"),
      supabase.from("complaints").select("id, title, priority, status, created_at").order("created_at", { ascending: false }).limit(6),
    ]);

    const totalBeds = (rooms.data ?? []).reduce((s, r: any) => s + r.capacity, 0);
    const occupied = (alloc.data ?? []).length;
    const openTickets = (await supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"])).count ?? 0;

    setStats([
      { label: "Total Occupancy", value: `${totalBeds ? Math.round((occupied / totalBeds) * 100) : 0}%`, hint: `${occupied}/${totalBeds} beds`, Icon: Users },
      { label: "Hostels", value: String(hostels.data?.length ?? 0), Icon: Building2 },
      { label: "Beds", value: String(totalBeds), Icon: Bed },
      { label: "Open Tickets", value: String(openTickets), Icon: Wrench },
    ]);

    // occupancy per hostel
    const blockToHostel = new Map<string, string>();
    (blocks.data ?? []).forEach((b: any) => blockToHostel.set(b.id, b.hostel_id));
    const roomToHostel = new Map<string, string>();
    (rooms.data ?? []).forEach((r: any) => { const h = blockToHostel.get(r.block_id); if (h) roomToHostel.set(r.id, h); });

    const per = new Map<string, { occ: number; total: number }>();
    (hostels.data ?? []).forEach((h: any) => per.set(h.id, { occ: 0, total: 0 }));
    (rooms.data ?? []).forEach((r: any) => {
      const h = blockToHostel.get(r.block_id); if (!h) return;
      const p = per.get(h)!; p.total += r.capacity;
    });
    (alloc.data ?? []).forEach((a: any) => {
      const h = roomToHostel.get(a.room_id); if (!h) return;
      per.get(h)!.occ += 1;
    });
    setOccupancy((hostels.data ?? []).map((h: any) => ({ hostel: h.name, ...per.get(h.id)! })));
    setComplaints(comps.data ?? []);
  }

  return (
    <AppShell title="Admin Overview">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.Icon className="size-4 text-leaf-700" />
              </div>
              <p className="text-2xl font-semibold mt-2">{s.value}</p>
              {s.hint && <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Occupancy */}
          <Card className="col-span-12 lg:col-span-7 p-6">
            <h3 className="font-semibold">Occupancy by residence</h3>
            <p className="text-sm text-muted-foreground">Active bed allocations across hostels.</p>
            <div className="mt-6 space-y-4">
              {occupancy.map((o) => {
                const pct = o.total ? Math.round((o.occ / o.total) * 100) : 0;
                return (
                  <div key={o.hostel}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{o.hostel}</span>
                      <span className="text-muted-foreground">{o.occ}/{o.total} • {pct}%</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-leaf-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {occupancy.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            </div>
          </Card>

          {/* Recent complaints */}
          <Card className="col-span-12 lg:col-span-5 p-6">
            <h3 className="font-semibold">Recent complaints</h3>
            <ul className="mt-4 divide-y divide-border">
              {complaints.map((c) => (
                <li key={c.id} className="py-3 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.status.replace("_", " ")}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    c.priority === "high" ? "bg-red-100 text-red-700" : c.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                  }`}>{c.priority}</span>
                </li>
              ))}
              {complaints.length === 0 && <p className="text-sm text-muted-foreground py-4">No complaints yet.</p>}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

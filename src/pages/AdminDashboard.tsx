import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bed, Building2, Users, Wrench } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Stat = { label: string; value: string; hint?: string; Icon: any };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [occupancy, setOccupancy] = useState<{ name: string; Occupied: number; Available: number }[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => { if (user) void load(); }, [user]);

  async function load() {
    const [rooms, alloc, hostels, blocks, comps] = await Promise.all([
      supabase.from("rooms").select("*"),
      supabase.from("allocations").select("*").eq("status", "active"),
      supabase.from("hostels").select("*"),
      supabase.from("blocks").select("*"),
      supabase.from("complaints").select("id, title, priority, status, created_at").order("created_at", { ascending: false }).limit(6),
    ]);

    const totalBeds = (rooms.data ?? []).reduce((s, r: any) => s + r.capacity, 0);
    const occupied = (alloc.data ?? []).length;
    // @ts-ignore
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
    const occupancyData = (hostels.data ?? []).map((h: any) => {
      const o = per.get(h.id)!;
      return {
        name: h.name,
        Occupied: o.occ,
        Available: o.total - o.occ
      };
    });
    setOccupancy(occupancyData);
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
            <h3 className="font-semibold text-lg mb-4">Occupancy by Residence</h3>
            <div className="h-72 w-full">
              {occupancy.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancy} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Legend />
                    <Bar dataKey="Occupied" stackId="a" fill="#15803d" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Available" stackId="a" fill="#dcfce7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet.</div>
              )}
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

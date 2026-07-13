import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bed, Building2, Users, Wrench } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

type Stat = { label: string; value: string; hint?: string; Icon: any };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [occupancy, setOccupancy] = useState<{ name: string; Occupied: number; Available: number }[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  
  const [payments, setPayments] = useState<{ name: string; value: number }[]>([]);
  const [genders, setGenders] = useState<{ name: string; value: number }[]>([]);
  const [departments, setDepartments] = useState<{ name: string; value: number }[]>([]);

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

    // Calculate Payments, Genders, Departments
    let paid = 0, notPaid = 0;
    const genderCount: Record<string, number> = { male: 0, female: 0, mixed: 0 };
    const deptCount: Record<string, number> = {};

    (alloc.data ?? []).forEach((a: any) => {
      if (a.payment_status === 'paid') paid++;
      else notPaid++;

      const g = a.rooms?.blocks?.hostels?.gender || 'unknown';
      genderCount[g] = (genderCount[g] || 0) + 1;

      const p = a.student_id?.program || 'Unknown';
      deptCount[p] = (deptCount[p] || 0) + 1;
    });

    setPayments([
      { name: 'Paid', value: paid },
      { name: 'Unpaid', value: notPaid }
    ]);
    setGenders(Object.entries(genderCount).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })));
    setDepartments(Object.entries(deptCount).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value).slice(0, 5));
  }

  const COLORS = ['#15803d', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

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

        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Payment Status */}
          <Card className="col-span-12 md:col-span-4 p-6">
            <h3 className="font-semibold text-lg mb-4">Payment Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payments} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {payments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Paid' ? '#15803d' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Gender Demographics */}
          <Card className="col-span-12 md:col-span-4 p-6">
            <h3 className="font-semibold text-lg mb-4">Demographics by Gender</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genders} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {genders.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Departments */}
          <Card className="col-span-12 md:col-span-4 p-6">
            <h3 className="font-semibold text-lg mb-4">Top Departments</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" fill="#15803d" radius={[0, 4, 4, 0]}>
                    {departments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

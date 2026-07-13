import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bed, Building2, Users, Wrench } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Stat = { label: string; value: string; hint?: string; Icon: any };

export default function HallAdminDashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [myHostel, setMyHostel] = useState<any>(null);
  const [blockDistribution, setBlockDistribution] = useState<any[]>([]);

  useEffect(() => { if (user) void load(); }, [user, role]);

  async function load() {
    const [rooms, alloc, hostels, blocks] = await Promise.all([
      supabase.from("rooms").select("*"),
      supabase.from("allocations").select("*").eq("status", "active"),
      supabase.from("hostels").select("*"),
      supabase.from("blocks").select("*"),
    ]);

    const myHostelId = user?.user_metadata?.hostel_id || (user as any)?.hostel_id;
    const myHostelData = (hostels.data ?? []).find((h: any) => h.id === myHostelId);
    setMyHostel(myHostelData);

    const myBlocks = (blocks.data ?? []).filter((b: any) => b.hostel_id === myHostelId);
    const myBlockIds = new Set(myBlocks.map((b: any) => b.id));
    const myRooms = (rooms.data ?? []).filter((r: any) => myBlockIds.has(r.block_id));
    const myRoomIds = new Set(myRooms.map((r: any) => r.id));
    const myAllocations = (alloc.data ?? []).filter((a: any) => myRoomIds.has(a.room_id) || (a.rooms && a.rooms.blocks && a.rooms.blocks.hostels && a.rooms.blocks.hostels.id === myHostelId));

    const totalBeds = myRooms.reduce((s, r: any) => s + r.capacity, 0);
    const occupied = myAllocations.length;

    setStats([
      { label: "Total Occupancy", value: `${totalBeds ? Math.round((occupied / totalBeds) * 100) : 0}%`, hint: `${occupied}/${totalBeds} beds taken`, Icon: Users },
      { label: "Blocks", value: String(myBlocks.length), Icon: Building2 },
      { label: "Rooms", value: String(myRooms.length), Icon: Bed },
      { label: "Total Beds", value: String(totalBeds), Icon: Bed },
    ]);

    // Calculate chart data
    const distribution = myBlocks.map((b: any) => {
      const roomsInBlock = myRooms.filter((r: any) => r.block_id === b.id);
      const roomIdsInBlock = new Set(roomsInBlock.map((r: any) => r.id));
      const allocInBlock = myAllocations.filter((a: any) => roomIdsInBlock.has(a.room_id));
      const blockBeds = roomsInBlock.reduce((s, r: any) => s + r.capacity, 0);
      return {
         name: b.name,
         Occupied: allocInBlock.length,
         Available: blockBeds - allocInBlock.length,
      };
    });

    setBlockDistribution(distribution);
    setMyStudents(myAllocations);
  }

  return (
    <AppShell title="My Hostel Overview">
      <div className="space-y-6 animate-fade-up">
        {myHostel && (
          <div>
            <h2 className="text-2xl font-bold">{myHostel.name}</h2>
            <p className="text-muted-foreground">{myHostel.description}</p>
          </div>
        )}

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
          <Card className="col-span-12 lg:col-span-12 p-6">
            <h3 className="font-semibold text-lg mb-4">Occupancy by Block</h3>
            <div className="h-72 w-full">
              {blockDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={blockDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No block data available.</div>
              )}
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-12 p-6">
            <h3 className="font-semibold text-lg mb-4">Allocated Students</h3>
            {myStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students allocated yet.</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Matric No.</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Block</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myStudents.map((a: any) => (
                      <TableRow key={a.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{a.student_id?.full_name}</TableCell>
                        <TableCell>{a.student_id?.matric_number}</TableCell>
                        <TableCell>{a.rooms?.room_number}</TableCell>
                        <TableCell>{a.rooms?.blocks?.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, XCircle } from "lucide-react";
import { Navigate } from "react-router-dom";

type AllocationRecord = {
  id: string;
  student_id: {
    id: string;
    full_name: string;
    matric_number: string;
    email: string;
  } | string;
  rooms?: {
    id: string;
    room_number: string;
    room_type: string;
    price_per_term: number;
    capacity: number;
    blocks?: {
      id: string;
      name: string;
      hostels?: {
        id: string;
        name: string;
        campus: string;
      } | null;
    } | null;
  } | null;
  bed_label: string;
  term: string;
  status: "active" | "expired" | "cancelled";
  allocated_at?: string;
};

export default function Allocations() {
  const { role, user } = useAuth();
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Redirect if not admin or hall admin
  if (role !== "admin" && role !== "hall_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("allocations").select("*").order("allocated_at", { ascending: false });
      if (error) throw error;
      
      let items = (data as any) ?? [];
      
      if (role === "hall_admin") {
        const myHostelId = user?.user_metadata?.hostel_id || (user as any)?.hostel_id;
        items = items.filter((a: any) => a.rooms?.blocks?.hostels?.id === myHostelId);
      }
      
      setAllocations(items);
    } catch (err: any) {
      toast({ title: "Failed to load allocations", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to revoke this allocation? The bed space will be released immediately.")) return;
    try {
      const { error } = await supabase.from("allocations").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      toast({ title: "Allocation revoked successfully" });
      void load();
    } catch (err: any) {
      toast({ title: "Failed to revoke allocation", description: err.message, variant: "destructive" });
    }
  }

  const filteredAllocations = allocations.filter((a) => {
    const student = typeof a.student_id === "object" ? a.student_id : null;
    const room = a.rooms;
    const hostel = room?.blocks?.hostels;
    
    const matchesSearch =
      (student?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student?.matric_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room?.room_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hostel?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell title="Allocations Management">
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student, room, or hostel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              size="sm"
            >
              Cancelled
            </Button>
          </div>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : filteredAllocations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No allocations found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Matric No.</TableHead>
                  <TableHead>Hostel / Block</TableHead>
                  <TableHead>Room / Bed</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((a) => {
                  const student = typeof a.student_id === "object" ? a.student_id : null;
                  const room = a.rooms;
                  const block = room?.blocks;
                  const hostel = block?.hostels;

                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{student?.full_name ?? "Unknown Student"}</TableCell>
                      <TableCell>{student?.matric_number ?? "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {hostel?.name ?? "N/A"}
                          <span className="text-xs text-muted-foreground block">{block?.name ?? ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">Room {room?.room_number ?? "N/A"}</span>
                        <span className="text-xs text-muted-foreground block">Bed {a.bed_label}</span>
                      </TableCell>
                      <TableCell className="text-xs">{a.term}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                          a.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1 ml-auto"
                            onClick={() => handleRevoke(a.id)}
                          >
                            <XCircle className="size-3.5" /> Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";

type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  role: "student" | "admin" | "hall_admin";
  hostel_id?: string | null;
  hostel_name?: string; // resolved mapped name
};

type Hostel = {
  id: string;
  name: string;
};

export default function HallAdmins() {
  const { role } = useAuth();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track assigning state per user
  const [assigningId, setAssigningId] = useState<string | null>(null);

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [profilesRes, hostelsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "hall_admin"),
        supabase.from("hostels").select("id, name")
      ]);
      
      if (profilesRes.error) throw profilesRes.error;
      if (hostelsRes.error) throw hostelsRes.error;
      
      const hs = (hostelsRes.data as any) || [];
      const ps = ((profilesRes.data as any) || []).map((p: any) => ({
        ...p,
        hostel_name: hs.find((h: any) => h.id === p.hostel_id)?.name || "Unassigned"
      }));

      setHostels(hs);
      setAdmins(ps);
    } catch (err: any) {
      toast({ title: "Failed to load hall admins", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignHostel(adminId: string, newHostelId: string) {
    if (newHostelId === "unassign") newHostelId = ""; // allow unassigning
    
    setAssigningId(adminId);
    try {
      const { error } = await supabase.from("profiles").update({ hostel_id: newHostelId || null }).eq("id", adminId);
      if (error) throw error;
      
      toast({ title: "Assignment Updated", description: "The Hall Admin's hostel has been updated successfully." });
      void loadData();
    } catch (err: any) {
      toast({ title: "Failed to assign hostel", description: err.message, variant: "destructive" });
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <AppShell title="Hall Admins">
      <div className="space-y-6 animate-fade-up max-w-5xl mx-auto">
        
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="size-5 text-leaf-600" />
            <h3 className="font-semibold text-lg">Manage Hall Admins</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Assign hostels to your active Hall Admins. Hall Admins only see data (clearances, complaints) related to their assigned hostel.
          </p>
          
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-surface">
              No Hall Admins found. Create a Hall Admin from the Users Settings page first.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Admin Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Assignment</TableHead>
                    <TableHead className="w-64">Assign to Hostel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                          a.hostel_id ? "bg-leaf-100 text-leaf-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {a.hostel_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={a.hostel_id || "unassign"} 
                          onValueChange={(v) => handleAssignHostel(a.id, v)}
                          disabled={assigningId === a.id}
                        >
                          <SelectTrigger className="w-[200px]">
                            {assigningId === a.id ? (
                              <div className="flex items-center text-muted-foreground"><Loader2 className="size-3 mr-2 animate-spin" /> Updating...</div>
                            ) : (
                              <SelectValue placeholder="Assign a hostel..." />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassign" className="text-rose-600">No Assignment (Unassign)</SelectItem>
                            {hostels.map(h => (
                              <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

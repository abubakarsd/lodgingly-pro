import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, Lock, Users, Trash } from "lucide-react";

type Hostel = { id: string; name: string };
type Profile = { id: string; full_name: string; email: string; matric_number: string; role: string; hostel_id?: string };

export default function AdminSettings() {
  const { user, role } = useAuth();
  
  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // RBAC / Hall Admin State
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedHostel, setSelectedHostel] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (user) void loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("hostels").select("id, name")
      ]);
      if (pRes.error) throw pRes.error;
      if (hRes.error) throw hRes.error;
      
      setProfiles(pRes.data as any[]);
      setHostels(hRes.data as any[]);
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast({ title: "Password Updated", description: "Your password has been successfully changed." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    if (!searchEmail.trim() || !selectedHostel) return;
    setAssigning(true);
    
    try {
      const targetUser = profiles.find(p => 
        p.email?.toLowerCase() === searchEmail.toLowerCase() || 
        p.matric_number?.toLowerCase() === searchEmail.toLowerCase()
      );
      
      if (!targetUser) {
        throw new Error("User not found matching email or matric number.");
      }

      if (targetUser.role === "admin") {
        throw new Error("Cannot modify the Ultimate Admin role.");
      }

      const { error } = await supabase.from("profiles").update({
        role: "hall_admin",
        hostel_id: selectedHostel
      }).eq("id", targetUser.id);
      
      if (error) throw error;
      
      toast({ title: "Role Assigned", description: `${targetUser.full_name} is now a Hall Admin.` });
      setSearchEmail("");
      setSelectedHostel("");
      void loadData();
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  }

  async function handleRevokeRole(profileId: string) {
    try {
      const { error } = await supabase.from("profiles").update({
        role: "student",
        hostel_id: null
      }).eq("id", profileId);
      
      if (error) throw error;
      toast({ title: "Role Revoked", description: "User has been demoted to student." });
      void loadData();
    } catch (err: any) {
      toast({ title: "Revoke Failed", description: err.message, variant: "destructive" });
    }
  }

  const hallAdmins = profiles.filter(p => p.role === "hall_admin");

  return (
    <AppShell title="System Settings">
      <div className="grid grid-cols-12 gap-6 animate-fade-up">
        
        {/* Security Settings */}
        <Card className="col-span-12 md:col-span-5 p-6 self-start">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-leaf-600" />
            <h3 className="font-semibold text-lg">Security Settings</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Update your account password. Ensure it is strong and secure.</p>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={updatingPassword}>
              {updatingPassword && <Loader2 className="size-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </form>
        </Card>

        {/* RBAC Settings */}
        {role === "admin" && (
          <div className="col-span-12 md:col-span-7 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="size-5 text-leaf-600" />
                <h3 className="font-semibold text-lg">Assign Hall Admin</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Promote a student to manage a specific hostel. They will only have access to data within that hostel.</p>
              
              <form onSubmit={handleAssignRole} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>User Email or Matric No.</Label>
                  <Input placeholder="e.g. U16CSC206" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Assign to Hostel</Label>
                  <Select value={selectedHostel} onValueChange={setSelectedHostel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hostel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map(h => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="sm:col-span-2" disabled={assigning}>
                  {assigning && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Assign Hall Admin Role
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-leaf-600" />
                  <h3 className="font-semibold text-lg">Active Hall Admins</h3>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
              ) : hallAdmins.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No hall admins assigned yet.</div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Assigned Hostel</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hallAdmins.map((admin) => {
                        const h = hostels.find(x => x.id === admin.hostel_id);
                        return (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div className="font-medium">{admin.full_name}</div>
                              <div className="text-xs text-muted-foreground">{admin.email}</div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-leaf-50 text-leaf-700 ring-1 ring-leaf-600/20">
                                {h?.name || "Unknown"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8" onClick={() => handleRevokeRole(admin.id)}>
                                <Trash className="size-3.5 mr-1.5" /> Revoke
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

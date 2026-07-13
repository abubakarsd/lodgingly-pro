import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase, API_URL } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, ShieldCheck, KeyRound, Search, Plus, Pencil, Trash } from "lucide-react";
import { Navigate } from "react-router-dom";

type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  matric_number?: string;
  role: "student" | "admin" | "hall_admin";
  hostel_id?: string | null;
};

export default function AdminSettings() {
  const { role, user } = useAuth();
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // Users Management State
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userListTab, setUserListTab] = useState<"students" | "admins">("students");

  // User Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "hall_admin">("hall_admin");

  if (role !== "admin" && role !== "hall_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: pData, error: pErr } = await supabase.from("profiles").select("*").order("full_name");
      if (pErr) throw pErr;
      setUsers((pData as any) || []);
    } catch (err: any) {
      toast({ title: "Failed to load data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }

  function generatePassword(role: string) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return role === "admin" ? `admin${rand}` : `hall${rand}`;
  }

  function handleOpenCreate() {
    setEditingId(null);
    setEmail("");
    setUserRole("hall_admin");
    setPassword(generatePassword("hall_admin"));
    setFullName("");
    setDialogOpen(true);
  }

  function handleRoleChange(newRole: "admin" | "hall_admin") {
    setUserRole(newRole);
    if (!editingId) {
      setPassword(generatePassword(newRole));
    }
  }

  function handleOpenEdit(userRecord: Profile) {
    setEditingId(userRecord.id);
    setEmail(userRecord.email || "");
    setPassword(""); // Keep blank to not modify
    setFullName(userRecord.full_name || "");
    setUserRole(userRecord.role === "student" ? "hall_admin" : userRecord.role);
    setDialogOpen(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        // Edit User Profiles
        const payload: any = {
          email,
          full_name: fullName,
          role: userRole,
        };
        // Update password if present
        if (password) payload.password = password; // Note: In reality this should hit an API to hash

        const { error } = await supabase.from("profiles").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "User updated successfully" });
      } else {
        // Create User (Calls secure endpoint on backend)
        const res = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`
          },
          body: JSON.stringify({ 
            email, 
            fullName, 
            password, 
            role: userRole
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        toast({ title: "User created successfully" });
      }
      setDialogOpen(false);
      void loadData();
    } catch (err: any) {
      toast({ title: "Failed to save user", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "User deleted" });
      void loadData();
    } catch (err: any) {
      toast({ title: "Failed to delete user", description: err.message, variant: "destructive" });
    }
  }

  const filteredUsers = users.filter((u) => {
    // apply role filter
    if (userListTab === "students" && u.role !== "student") return false;
    if (userListTab === "admins" && u.role === "student") return false;

    // apply search filter
    const term = searchQuery.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(term) ||
      (u.matric_number || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <AppShell title="System Settings">
      <div className="space-y-6 animate-fade-up max-w-5xl mx-auto">
        <Tabs defaultValue={role === "admin" ? "users" : "security"}>
          <TabsList className="mb-4">
            {role === "admin" && <TabsTrigger value="users">Users Management</TabsTrigger>}
            <TabsTrigger value="security">Security & Password</TabsTrigger>
          </TabsList>
          
          {role === "admin" && (
            <TabsContent value="users">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b pb-4">
                  <Tabs value={userListTab} onValueChange={(v: any) => setUserListTab(v)}>
                    <TabsList>
                      <TabsTrigger value="students">Students</TabsTrigger>
                      <TabsTrigger value="admins">Admins & Staff</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Button onClick={handleOpenCreate} className="flex items-center gap-2 self-start">
                    <Plus className="size-4" /> Create Admin Account
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={userListTab === "students" ? "Search students by name, email, or matric no..." : "Search staff by name or email..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Card className="p-6">
                  {loading ? (
                    <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Matric No.</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.full_name}</TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>{u.matric_number || "-"}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                  u.role === "admin" ? "bg-purple-100 text-purple-800" : 
                                  u.role === "hall_admin" ? "bg-amber-100 text-amber-800" :
                                  "bg-leaf-100 text-leaf-800"
                                }`}>
                                  {u.role.replace("_", " ")}
                                </span>
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(u)}>
                                  <Pencil className="size-3.5" />
                                </Button>
                                {u.id !== user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={() => handleDelete(u.id)}
                                  >
                                    <Trash className="size-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
          )}

          <TabsContent value="security">
            <Card className="p-6 max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="size-5 text-leaf-600" />
                <h3 className="font-semibold text-lg">Change Password</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Update your account password. Use a strong password to ensure your account remains secure.</p>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password (Optional if forced reset)</Label>
                  <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={updating}>
                  {updating && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </Card>
          </TabsContent>

        </Tabs>

        {/* User Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveUser}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit User Account" : "Create New Account"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Modify user details below." : "Enter details for the new user account."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label>Password {editingId ? "(leave blank to keep current)" : "(auto-generated)"}</Label>
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingId}
                    readOnly={!editingId}
                    className={!editingId ? "bg-muted font-mono" : ""}
                  />
                  {!editingId && (
                    <p className="text-xs text-muted-foreground">Copy this temporary password and give it to the user.</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Account Role</Label>
                  <Select value={userRole} onValueChange={(v: any) => handleRoleChange(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hall_admin">Hall Admin</SelectItem>
                      <SelectItem value="admin">Ultimate Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Save user
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

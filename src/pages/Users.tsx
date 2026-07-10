import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash, Search, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

type UserRecord = {
  id: string;
  email?: string;
  full_name?: string;
  matric_number?: string;
  role: "student" | "admin";
};

export default function Users() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit / Create Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [userRole, setUserRole] = useState<"student" | "admin">("student");

  // Redirect if not admin
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      setUsers((data as any) ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setMatricNumber("");
    setUserRole("student");
    setDialogOpen(true);
  }

  function handleOpenEdit(user: UserRecord) {
    setEditingId(user.id);
    setEmail(user.email || "");
    setPassword(""); // Keep blank to not modify
    setFullName(user.full_name || "");
    setMatricNumber(user.matric_number || "");
    setUserRole(user.role);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        // Edit User Profiles
        const payload: any = {
          email,
          full_name: fullName,
          matric_number: matricNumber || null,
          role: userRole,
        };
        // Only update password if input is not empty
        if (password) payload.password = password;

        const { error } = await supabase.from("profiles").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "User updated successfully" });
      } else {
        // Create User (Calls sign up / creation endpoint on backend)
        const { error } = await supabase.from("profiles").insert({
          email,
          password,
          full_name: fullName,
          matric_number: matricNumber || null,
          role: userRole,
        });
        if (error) throw error;
        toast({ title: "User created successfully" });
      }
      setDialogOpen(false);
      void load();
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
      void load();
    } catch (err: any) {
      toast({ title: "Failed to delete user", description: err.message, variant: "destructive" });
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(term) ||
      (u.matric_number || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <AppShell title="Users Management">
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, matric no, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 self-start">
            <Plus className="size-4" /> Add New User
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Matric Number</TableHead>
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
                        u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-leaf-100 text-leaf-800"
                      }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(u)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDelete(u.id)}
                      >
                        <Trash className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit User Account" : "Create New Account"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Modify user details below." : "Enter details for the new registration account."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="uName">Full Name</Label>
                  <Input id="uName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="uEmail">Email Address</Label>
                  <Input id="uEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="uPassword">Password {editingId && "(leave blank to keep current)"}</Label>
                  <Input
                    id="uPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingId}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="uMatric">Matric Number</Label>
                  <Input
                    id="uMatric"
                    placeholder="e.g. U16CSC206"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="uRole">Account Role</Label>
                  <Select value={userRole} onValueChange={(v: any) => setUserRole(v)}>
                    <SelectTrigger id="uRole">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

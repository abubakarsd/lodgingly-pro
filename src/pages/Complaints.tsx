import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, CheckCircle2, MessageSquare, Clock } from "lucide-react";

type ComplaintRecord = {
  id: string;
  student_id: {
    id: string;
    full_name: string;
    matric_number: string;
  } | string;
  category: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at?: string;
};

export default function Complaints() {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Form States (for students)
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (user) void load();
  }, [user, role]);

  async function load() {
    setLoading(true);
    try {
      let query = supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (role !== "admin") {
        query = query.eq("student_id", user?.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setComplaints((data as any) ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load complaints", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("complaints").insert({
        student_id: user?.id,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: "open",
      });
      if (error) throw error;
      toast({ title: "Complaint filed", description: "Your complaint has been submitted successfully." });
      setTitle("");
      setDescription("");
      void load();
    } catch (err: any) {
      toast({ title: "Failed to file complaint", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const { error } = await supabase.from("complaints").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast({ title: "Status updated", description: `Complaint marked as ${newStatus.replace("_", " ")}.` });
      void load();
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/10 uppercase">High</span>;
      case "low":
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-600/10 uppercase">Low</span>;
      default:
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/10 uppercase">Medium</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
            <CheckCircle2 className="size-3" /> Resolved
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 ring-1 ring-blue-600/10">
            <Clock className="size-3 animate-spin" style={{ animationDuration: "3s" }} /> In Progress
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 ring-1 ring-amber-600/10">
            <AlertTriangle className="size-3" /> Open
          </span>
        );
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  return (
    <AppShell title="Complaints & Maintenance">
      <div className="space-y-6 animate-fade-up">
        {role !== "admin" ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Student left: File new complaint */}
            <Card className="col-span-12 md:col-span-4 p-6 self-start">
              <h3 className="font-semibold text-lg">File a Complaint</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Report hostel issues, electrical problems, or roommate conflicts.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title</Label>
                  <Input id="title" placeholder="e.g. Broken fan, Water leakage" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">General Maintenance</SelectItem>
                      <SelectItem value="Electrical">Electrical Issue</SelectItem>
                      <SelectItem value="Plumbing">Plumbing Issue</SelectItem>
                      <SelectItem value="Cleaning">Cleaning & Janitorial</SelectItem>
                      <SelectItem value="Roommates">Roommate Conflict</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pri">Severity/Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger id="pri">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Non-urgent)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Urgent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Detailed Description</Label>
                  <Textarea id="desc" placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  File Complaint
                </Button>
              </form>
            </Card>

            {/* Student Right: History */}
            <Card className="col-span-12 md:col-span-8 p-6">
              <h3 className="font-semibold text-lg">My Complaints</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Review the status and resolutions of your submitted tickets.</p>

              {loading ? (
                <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No complaints filed yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue / Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.category} • {c.description}</div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(c.priority)}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        ) : (
          /* Admin View */
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-lg">Complaints Board</h3>
                <p className="text-sm text-muted-foreground mt-1">Review and manage student maintenance and code violations tickets.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No complaints match filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Complaint / Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((c) => {
                    const student = typeof c.student_id === "object" ? c.student_id : null;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{student?.full_name ?? "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{student?.matric_number ?? "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{c.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.category} • {c.description}</div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(c.priority)}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={c.status}
                            onValueChange={(val) => handleStatusChange(c.id, val)}
                          >
                            <SelectTrigger className="w-[120px] h-8 ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

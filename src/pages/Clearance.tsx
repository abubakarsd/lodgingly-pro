import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ClearanceItem = {
  id: string;
  student_id: {
    id: string;
    full_name: string;
    matric_number: string;
    email: string;
  } | string;
  item: string;
  status: "pending" | "verified" | "rejected";
  verified_by?: {
    id: string;
    full_name: string;
  } | string | null;
  created_at?: string;
};

export default function Clearance() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<ClearanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  useEffect(() => {
    if (user) void load();
  }, [user, role]);

  async function load() {
    setLoading(true);
    try {
      let query = supabase.from("clearance_items").select("*").order("created_at", { ascending: false });
      
      if (role !== "admin") {
        query = query.eq("student_id", user?.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setItems((data as any) ?? []);
    } catch (err: any) {
      toast({ title: "Error loading clearance", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("clearance_items").insert({
        student_id: user?.id,
        item: newItemName.trim(),
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Request submitted", description: "Your clearance request has been filed successfully." });
      setNewItemName("");
      void load();
    } catch (err: any) {
      toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(id: string, action: "verified" | "rejected") {
    try {
      const { error } = await supabase.from("clearance_items").update({
        status: action,
        verified_by: user?.id,
      }).eq("id", id);
      if (error) throw error;
      toast({ title: `Clearance ${action === "verified" ? "Approved" : "Rejected"}` });
      void load();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
            <CheckCircle2 className="size-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-600/10">
            <AlertCircle className="size-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/10 animate-pulse">
            <HelpCircle className="size-3" /> Pending
          </span>
        );
    }
  };

  return (
    <AppShell title="Clearance System">
      <div className="space-y-6 animate-fade-up">
        {role !== "admin" ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Student Left: Request Form */}
            <Card className="col-span-12 md:col-span-4 p-6 self-start">
              <h3 className="font-semibold text-lg">Submit Clearance Request</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Request clearance for items such as dues, equipment, etc.</p>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item">Clearance Item/Office</Label>
                  <Input
                    id="item"
                    placeholder="e.g. Library Dues, Sports Equipment"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </form>
            </Card>

            {/* Student Right: Request History */}
            <Card className="col-span-12 md:col-span-8 p-6">
              <h3 className="font-semibold text-lg">My Clearance Checklist</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Track approval statuses for your clearance offices.</p>

              {loading ? (
                <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No clearance requests submitted yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clearance Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.item}</TableCell>
                        <TableCell>{getStatusBadge(i.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {i.verified_by && typeof i.verified_by === "object"
                            ? i.verified_by.full_name
                            : "System Auto"}
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
            <h3 className="font-semibold text-lg">Clearance Request Queue</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Review, approve, and reject students' clearance requests.</p>

            {loading ? (
              <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No pending clearance items in the queue.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Matric No.</TableHead>
                    <TableHead>Office/Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Filed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => {
                    const student = typeof i.student_id === "object" ? i.student_id : null;
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{student?.full_name ?? "Unknown Student"}</TableCell>
                        <TableCell>{student?.matric_number ?? "N/A"}</TableCell>
                        <TableCell>{i.item}</TableCell>
                        <TableCell>{getStatusBadge(i.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {i.created_at ? new Date(i.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {i.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleVerify(i.id, "rejected")}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleVerify(i.id, "verified")}
                              >
                                Approve
                              </Button>
                            </>
                          )}
                          {i.status !== "pending" && (
                            <span className="text-xs text-muted-foreground">
                              Verified by: {typeof i.verified_by === "object" && i.verified_by ? i.verified_by.full_name : "Admin"}
                            </span>
                          )}
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

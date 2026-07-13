import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, HelpCircle, Loader2, Plus, FileText, Image as ImageIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

type ClearanceRequirement = {
  id: string;
  name: string;
  description: string;
  requires_file: boolean;
  file_type: "image" | "pdf" | "any";
};

type ClearanceItem = {
  id: string;
  student_id: {
    id: string;
    full_name: string;
    matric_number: string;
    email: string;
  } | string;
  requirement_id?: {
    id: string;
    name: string;
    requires_file: boolean;
    file_type: string;
  } | string | null;
  item: string;
  attachment_url?: string;
  status: "pending" | "verified" | "rejected";
  verified_by?: {
    id: string;
    full_name: string;
  } | string | null;
  created_at?: string;
};

export default function Clearance() {
  const { user, role } = useAuth();
  
  // Data states
  const [items, setItems] = useState<ClearanceItem[]>([]);
  const [requirements, setRequirements] = useState<ClearanceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Student form states
  const [submitting, setSubmitting] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string>("");
  const [attachmentBase64, setAttachmentBase64] = useState<string>("");
  
  // Admin add requirement states
  const [addingReq, setAddingReq] = useState(false);
  const [newReqName, setNewReqName] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [newReqRequiresFile, setNewReqRequiresFile] = useState(false);
  const [newReqFileType, setNewReqFileType] = useState<"image" | "pdf" | "any">("any");

  // Admin view item states
  const [selectedItem, setSelectedItem] = useState<ClearanceItem | null>(null);

  useEffect(() => {
    if (user) void load();
  }, [user, role]);

  async function load() {
    setLoading(true);
    try {
      // 1. Fetch requirements
      const reqRes = await supabase.from("clearance_requirements").select("*").order("created_at", { ascending: false });
      if (reqRes.error) throw reqRes.error;
      setRequirements((reqRes.data as any) ?? []);

      // 2. Fetch submissions
      let query = supabase.from("clearance_items").select("*").order("created_at", { ascending: false });
      if (role !== "admin") {
        query = query.eq("student_id", user?.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setItems((data as any) ?? []);
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Handle file select for student
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setAttachmentBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReqId) return;
    
    const req = requirements.find(r => r.id === selectedReqId);
    if (!req) return;

    if (req.requires_file && !attachmentBase64) {
      toast({ title: "Missing Attachment", description: "Please upload the required file.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("clearance_items").insert({
        student_id: user?.id,
        requirement_id: req.id,
        item: req.name, // Fallback property
        attachment_url: attachmentBase64,
        status: "pending",
      });
      if (error) throw error;
      
      toast({ title: "Request submitted", description: "Your clearance request has been filed successfully." });
      setSelectedReqId("");
      setAttachmentBase64("");
      void load();
    } catch (err: any) {
      toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddRequirement(e: React.FormEvent) {
    e.preventDefault();
    if (!newReqName.trim()) return;
    setAddingReq(true);
    try {
      const { error } = await supabase.from("clearance_requirements").insert({
        name: newReqName.trim(),
        description: newReqDesc.trim(),
        requires_file: newReqRequiresFile,
        file_type: newReqRequiresFile ? newReqFileType : "any"
      });
      if (error) throw error;
      
      toast({ title: "Requirement added" });
      setNewReqName("");
      setNewReqDesc("");
      setNewReqRequiresFile(false);
      setNewReqFileType("any");
      void load();
    } catch (err: any) {
      toast({ title: "Failed to add requirement", description: err.message, variant: "destructive" });
    } finally {
      setAddingReq(false);
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
      
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: action, verified_by: { id: user?.id || "", full_name: "Admin" } });
      }
      
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

  const activeReq = requirements.find(r => r.id === selectedReqId);

  return (
    <AppShell title="Clearance System">
      <div className="space-y-6 animate-fade-up">
        {role !== "admin" ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Student Left: Request Form */}
            <Card className="col-span-12 md:col-span-5 lg:col-span-4 p-6 self-start">
              <h3 className="font-semibold text-lg">Submit Clearance Request</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Select an active clearance requirement to submit.</p>
              
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label>Clearance Requirement</Label>
                  <Select value={selectedReqId} onValueChange={setSelectedReqId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a requirement..." />
                    </SelectTrigger>
                    <SelectContent>
                      {requirements.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeReq && (
                  <div className="p-3 bg-muted rounded-md text-sm border">
                    <p className="font-medium">{activeReq.name}</p>
                    {activeReq.description && <p className="text-muted-foreground mt-1 text-xs">{activeReq.description}</p>}
                    
                    {activeReq.requires_file && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <Label>Attachment Required ({activeReq.file_type})</Label>
                        <Input 
                          type="file" 
                          accept={activeReq.file_type === "image" ? "image/*" : activeReq.file_type === "pdf" ? "application/pdf" : "*/*"} 
                          onChange={handleFileChange}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting || !selectedReqId}>
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </form>
            </Card>

            {/* Student Right: Request History */}
            <Card className="col-span-12 md:col-span-7 lg:col-span-8 p-6">
              <h3 className="font-semibold text-lg">My Clearance Checklist</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Track approval statuses for your clearance requests.</p>

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
                        <TableCell className="font-medium">
                          {typeof i.requirement_id === "object" && i.requirement_id ? i.requirement_id.name : i.item}
                        </TableCell>
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
          <div className="grid grid-cols-12 gap-6">
            
            {/* Admin Left: Manage Requirements */}
            <Card className="col-span-12 md:col-span-5 lg:col-span-4 p-6 self-start">
              <h3 className="font-semibold text-lg">Add Requirement</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Define a new clearance rule.</p>
              
              <form onSubmit={handleAddRequirement} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Identity Card Return" value={newReqName} onChange={e => setNewReqName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Explain what the student needs to do..." value={newReqDesc} onChange={e => setNewReqDesc(e.target.value)} rows={2} />
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <Switch id="req-file" checked={newReqRequiresFile} onCheckedChange={setNewReqRequiresFile} />
                  <Label htmlFor="req-file">Requires File Upload</Label>
                </div>
                
                {newReqRequiresFile && (
                  <div className="space-y-2 pb-2">
                    <Label>Allowed File Type</Label>
                    <Select value={newReqFileType} onValueChange={(v: any) => setNewReqFileType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Document</SelectItem>
                        <SelectItem value="image">Image (Picture)</SelectItem>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={addingReq}>
                  {addingReq ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
                  Create Requirement
                </Button>
              </form>

              {requirements.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-medium text-sm mb-3">Active Requirements</h4>
                  <div className="space-y-2">
                    {requirements.map(r => (
                      <div key={r.id} className="p-3 bg-surface border rounded-lg text-sm">
                        <div className="font-medium flex justify-between items-start">
                          <span>{r.name}</span>
                          {r.requires_file && <span className="text-[10px] uppercase font-bold text-leaf-600 bg-leaf-50 px-1.5 py-0.5 rounded tracking-wide">Upload ({r.file_type})</span>}
                        </div>
                        {r.description && <p className="text-muted-foreground mt-1 text-xs">{r.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Admin Right: Submissions Queue */}
            <Card className="col-span-12 md:col-span-7 lg:col-span-8 p-6">
              <h3 className="font-semibold text-lg">Clearance Submissions</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Click on a submission to view details and attachments.</p>

              {loading ? (
                <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No submissions yet.</div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((i) => {
                        const student = typeof i.student_id === "object" ? i.student_id : null;
                        const req = typeof i.requirement_id === "object" ? i.requirement_id : null;
                        const itemName = req ? req.name : i.item;
                        
                        return (
                          <TableRow 
                            key={i.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedItem(i)}
                          >
                            <TableCell>
                              <div className="font-medium">{student?.full_name ?? "Unknown"}</div>
                              <div className="text-xs text-muted-foreground">{student?.matric_number ?? "N/A"}</div>
                            </TableCell>
                            <TableCell className="font-medium">{itemName}</TableCell>
                            <TableCell>{getStatusBadge(i.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {i.created_at ? new Date(i.created_at).toLocaleDateString() : "-"}
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

      {/* Admin Review Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Clearance Review</SheetTitle>
            <SheetDescription>Review student submission and uploaded attachments.</SheetDescription>
          </SheetHeader>
          
          {selectedItem && (
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                {getStatusBadge(selectedItem.status)}
              </div>

              {/* Student Details */}
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h4 className="font-semibold text-sm mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{typeof selectedItem.student_id === "object" ? selectedItem.student_id?.full_name : "-"}</div>
                  <div className="text-muted-foreground">Matric No.</div>
                  <div className="font-medium">{typeof selectedItem.student_id === "object" ? selectedItem.student_id?.matric_number : "-"}</div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{typeof selectedItem.student_id === "object" ? selectedItem.student_id?.email : "-"}</div>
                </div>
              </div>

              {/* Requirement Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Requirement Details</h4>
                <div className="text-sm">
                  <span className="font-medium text-leaf-700">
                    {typeof selectedItem.requirement_id === "object" && selectedItem.requirement_id ? selectedItem.requirement_id.name : selectedItem.item}
                  </span>
                  {typeof selectedItem.requirement_id === "object" && selectedItem.requirement_id && selectedItem.requirement_id.requires_file && (
                    <span className="ml-2 inline-flex items-center text-xs text-muted-foreground"><Paperclip className="size-3 mr-1" /> Attachment Required</span>
                  )}
                </div>
              </div>

              {/* Attachment */}
              {selectedItem.attachment_url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Uploaded Attachment</h4>
                  {selectedItem.attachment_url.startsWith('data:image') ? (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={selectedItem.attachment_url} alt="Attachment" className="w-full h-auto" />
                    </div>
                  ) : selectedItem.attachment_url.startsWith('data:application/pdf') ? (
                    <div className="p-4 bg-muted border rounded-lg flex items-center justify-center">
                      <a href={selectedItem.attachment_url} download="clearance_document.pdf" className="text-sm font-medium text-leaf-600 hover:underline flex items-center">
                        <FileText className="size-4 mr-2" /> Download PDF Document
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted border rounded-lg flex items-center justify-center">
                      <a href={selectedItem.attachment_url} download="attachment" className="text-sm font-medium text-leaf-600 hover:underline flex items-center">
                        <Paperclip className="size-4 mr-2" /> Download Attachment
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedItem.status === "pending" && (
                <div className="pt-4 border-t flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleVerify(selectedItem.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleVerify(selectedItem.id, "verified")}
                  >
                    Approve
                  </Button>
                </div>
              )}
              
              {selectedItem.status !== "pending" && typeof selectedItem.verified_by === "object" && selectedItem.verified_by && (
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  Verified by: <span className="font-medium text-foreground">{selectedItem.verified_by.full_name}</span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

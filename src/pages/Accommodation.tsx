import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import heroEmerald from "@/assets/hostel-emerald.jpg";
import verdant from "@/assets/hostel-verdant.jpg";
import cedar from "@/assets/hostel-cedar.jpg";
import ivy from "@/assets/hostel-ivy.jpg";
import { Bed, Users, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Hostel = {
  id: string;
  name: string;
  description: string | null;
  campus: string | null;
  gender: string;
  image_url?: string | null;
};
type Room = { id: string; room_number: string; capacity: number; room_type: string; price_per_term: number; block_id: string; taken: number };
type Block = { id: string; name: string; hostel_id: string; rooms: Room[] };

const imgFor = (hostel: Hostel) => {
  if (hostel.image_url) return hostel.image_url;
  const name = hostel.name;
  const n = name.toLowerCase();
  if (n.includes("umar") || n.includes("danfodio")) return heroEmerald;
  if (n.includes("amina") || n.includes("dangote")) return verdant;
  if (n.includes("ribadu")) return cedar;
  return ivy;
};

export default function Accommodation() {
  const { user, role } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [existing, setExisting] = useState<any>(null);
  const [busyRoom, setBusyRoom] = useState<string | null>(null);

  // Edit Hostel State
  const [hostelDialogOpen, setHostelDialogOpen] = useState(false);
  const [hName, setHName] = useState("");
  const [hCampus, setHCampus] = useState("");
  const [hGender, setHGender] = useState("");
  const [hDescription, setHDescription] = useState("");
  const [hImageUrl, setHImageUrl] = useState("");

  // Add Hostel State
  const [hostelAddDialogOpen, setHostelAddDialogOpen] = useState(false);
  const [newHName, setNewHName] = useState("");
  const [newHCampus, setNewHCampus] = useState("");
  const [newHGender, setNewHGender] = useState("mixed");
  const [newHDescription, setNewHDescription] = useState("");
  const [newHImageUrl, setNewHImageUrl] = useState("");

  // Add Block State
  const [blockAddDialogOpen, setBlockAddDialogOpen] = useState(false);
  const [newBName, setNewBName] = useState("");
  const [newBFloors, setNewBFloors] = useState<number>(1);

  // Add Room State
  const [roomAddDialogOpen, setRoomAddDialogOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [newRNumber, setNewRNumber] = useState("");
  const [newRType, setNewRType] = useState("Shared");
  const [newRCapacity, setNewRCapacity] = useState<number>(2);
  const [newRPrice, setNewRPrice] = useState<number>(0);

  // Edit Room State
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rNumber, setRNumber] = useState("");
  const [rType, setRType] = useState("");
  const [rCapacity, setRCapacity] = useState<number>(2);
  const [rPrice, setRPrice] = useState<number>(0);

  // Allocate Room to Student State
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [allocateRoom, setAllocateRoom] = useState<Room | null>(null);
  const [studentSearchKey, setStudentSearchKey] = useState("");
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);

  // Paystack Checkout State
  const [paystackDialogOpen, setPaystackDialogOpen] = useState(false);
  const [paystackRoom, setPaystackRoom] = useState<Room | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | "bank">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paystackStage, setPaystackStage] = useState<"idle" | "loading" | "otp" | "success">("idle");
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => { void load(); }, [user]);

  async function load() {
    const [hs, bs, rs, alloc] = await Promise.all([
      supabase.from("hostels").select("*").order("name"),
      supabase.from("blocks").select("id, name, hostel_id"),
      supabase.from("rooms").select("id, room_number, capacity, room_type, price_per_term, block_id"),
      user ? supabase.from("allocations").select("id, room_id, bed_label").eq("student_id", user.id).eq("status", "active").maybeSingle() : Promise.resolve({ data: null }),
    ]);
    // count active allocations per room
    const { data: taken } = await supabase.from("allocations").select("room_id").eq("status", "active");
    const takenMap = new Map<string, number>();
    (taken ?? []).forEach((t: any) => takenMap.set(t.room_id, (takenMap.get(t.room_id) ?? 0) + 1));

    setHostels(hs.data ?? []);
    setExisting((alloc as any).data ?? null);
    const blockList: Block[] = (bs.data ?? []).map((b: any) => ({
      ...b,
      rooms: (rs.data ?? []).filter((r: any) => r.block_id === b.id).map((r: any) => ({ ...r, taken: takenMap.get(r.id) ?? 0 })),
    }));
    setBlocks(blockList);
    if (!selected && hs.data?.length) setSelected(hs.data[0].id);
  }

  async function reserve(room: Room) {
    if (!user) return;
    
    // If Admin, open student allocation dialog instead of reserving for himself
    if (role === "admin") {
      setAllocateRoom(room);
      setFoundStudent(null);
      setStudentSearchKey("");
      setAllocateDialogOpen(true);
      return;
    }

    if (existing) { toast({ title: "Already allocated", description: "Cancel your current allocation first." }); return; }
    if (room.taken >= room.capacity) { toast({ title: "Full", description: "This room has no free beds.", variant: "destructive" }); return; }
    
    // Open Paystack dialog instead of inserting immediately
    setPaystackRoom(room);
    setPaymentMethod("card");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setPaystackStage("idle");
    setOtpCode("");
    setPaystackDialogOpen(true);
  }

  async function completeReservationAfterPayment(room: Room) {
    setBusyRoom(room.id);
    const bed = String.fromCharCode(65 + room.taken); // A, B, C
    const { error } = await supabase.from("allocations").insert({
      student_id: user!.id, room_id: room.id, bed_label: bed, term: "2026/27", status: "active",
    });
    setBusyRoom(null);
    if (error) {
      toast({ title: "Reservation failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reserved & Paid!", description: `Bed ${bed} — Room ${room.room_number}` });
    void load();
  }

  const shown = blocks.filter((b) => b.hostel_id === selected);
  const active = hostels.find((h) => h.id === selected);

  // Initialize Hostel form fields when active changes or dialog opens
  useEffect(() => {
    if (active && hostelDialogOpen) {
      setHName(active.name || "");
      setHCampus(active.campus || "");
      setHGender(active.gender || "mixed");
      setHDescription(active.description || "");
      setHImageUrl(active.image_url || "");
    }
  }, [active, hostelDialogOpen]);

  // Initialize Room form fields when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      setRNumber(selectedRoom.room_number || "");
      setRType(selectedRoom.room_type || "");
      setRCapacity(selectedRoom.capacity || 2);
      setRPrice(selectedRoom.price_per_term || 0);
    }
  }, [selectedRoom]);

  async function handleSaveHostel() {
    if (!active) return;
    const { error } = await supabase
      .from("hostels")
      .update({
        name: hName,
        campus: hCampus,
        gender: hGender,
        description: hDescription,
        image_url: hImageUrl || null,
      })
      .eq("id", active.id);

    if (error) {
      toast({ title: "Failed to update hostel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hostel updated successfully!" });
      setHostelDialogOpen(false);
      void load();
    }
  }

  async function handleCreateHostel() {
    if (!newHName.trim()) { toast({ title: "Name required" }); return; }
    const { error } = await supabase.from("hostels").insert({
      name: newHName,
      campus: newHCampus,
      gender: newHGender,
      description: newHDescription,
      image_url: newHImageUrl || null
    });
    if (error) {
      toast({ title: "Failed to create hostel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hostel created successfully!" });
      setHostelAddDialogOpen(false);
      setNewHName("");
      setNewHCampus("");
      setNewHGender("mixed");
      setNewHDescription("");
      setNewHImageUrl("");
      void load();
    }
  }

  async function handleCreateBlock() {
    if (!selected) return;
    if (!newBName.trim()) { toast({ title: "Name required" }); return; }
    const { error } = await supabase.from("blocks").insert({
      hostel_id: selected,
      name: newBName,
      floors: Number(newBFloors)
    });
    if (error) {
      toast({ title: "Failed to create block", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Block created successfully!" });
      setBlockAddDialogOpen(false);
      setNewBName("");
      setNewBFloors(1);
      void load();
    }
  }

  async function handleCreateRoom() {
    if (!activeBlockId) return;
    if (!newRNumber.trim()) { toast({ title: "Room number required" }); return; }
    const { error } = await supabase.from("rooms").insert({
      block_id: activeBlockId,
      room_number: newRNumber,
      room_type: newRType,
      capacity: Number(newRCapacity),
      price_per_term: Number(newRPrice)
    });
    if (error) {
      toast({ title: "Failed to create room", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Room created successfully!" });
      setRoomAddDialogOpen(false);
      setNewRNumber("");
      setNewRType("Shared");
      setNewRCapacity(2);
      setNewRPrice(0);
      void load();
    }
  }

  async function handleSearchStudent() {
    if (!studentSearchKey.trim()) return;
    setSearchingStudent(true);
    setFoundStudent(null);
    const { data: profiles, error } = await supabase.from("profiles").select("*");
    setSearchingStudent(false);
    
    if (error) {
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
      return;
    }
    
    const key = studentSearchKey.trim().toLowerCase();
    const student = (profiles ?? []).find(
      (p: any) => p.email?.toLowerCase() === key || p.matric_number?.toLowerCase() === key
    );
    
    if (!student) {
      toast({ title: "Not found", description: "No student user found matching that registration number or email.", variant: "destructive" });
    } else if (student.role !== "student") {
      toast({ title: "Invalid role", description: "The user found is an Administrator, not a student.", variant: "destructive" });
    } else {
      setFoundStudent(student);
      // Check if student already has active allocation
      const { data: activeAlloc } = await supabase
        .from("allocations")
        .select("id")
        .eq("student_id", student.id)
        .eq("status", "active")
        .maybeSingle();
      if (activeAlloc) {
        toast({ title: "Already allocated", description: "This student already has an active room allocation." });
      }
    }
  }

  async function handleAllocateToStudent() {
    if (!allocateRoom || !foundStudent) return;
    setBusyRoom(allocateRoom.id);
    const bed = String.fromCharCode(65 + allocateRoom.taken);
    const { error } = await supabase.from("allocations").insert({
      student_id: foundStudent.id,
      room_id: allocateRoom.id,
      bed_label: bed,
      term: "2026/27",
      status: "active"
    });
    setBusyRoom(null);
    if (error) {
      toast({ title: "Allocation failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Allocation successful!", description: `Room ${allocateRoom.room_number} Bed ${bed} allocated to ${foundStudent.full_name}.` });
      setAllocateDialogOpen(false);
      setFoundStudent(null);
      setStudentSearchKey("");
      setAllocateRoom(null);
      void load();
    }
  }

  async function handlePaystackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (paymentMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        toast({ title: "Form incomplete", description: "Please fill out card details.", variant: "destructive" });
        return;
      }
      setPaystackStage("loading");
      setTimeout(() => {
        setPaystackStage("otp");
      }, 1500);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode) return;
    setPaystackStage("loading");
    setTimeout(() => {
      setPaystackStage("success");
      setTimeout(() => {
        setPaystackDialogOpen(false);
        if (paystackRoom) {
          void completeReservationAfterPayment(paystackRoom);
        }
      }, 1500);
    }, 1500);
  }

  async function handleTransferConfirm() {
    setPaystackStage("loading");
    setTimeout(() => {
      setPaystackStage("success");
      setTimeout(() => {
        setPaystackDialogOpen(false);
        if (paystackRoom) {
          void completeReservationAfterPayment(paystackRoom);
        }
      }, 1500);
    }, 2000);
  }

  async function handleSaveRoom() {
    if (!selectedRoom) return;
    const { error } = await supabase
      .from("rooms")
      .update({
        room_number: rNumber,
        room_type: rType,
        capacity: Number(rCapacity),
        price_per_term: Number(rPrice),
      })
      .eq("id", selectedRoom.id);

    if (error) {
      toast({ title: "Failed to update room", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Room updated successfully!" });
      setRoomDialogOpen(false);
      setSelectedRoom(null);
      void load();
    }
  }

  return (
    <AppShell title="Accommodation">
      <div className="grid grid-cols-12 gap-6 animate-fade-up">
        <aside className="col-span-12 lg:col-span-4 space-y-3 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Residences</p>
            {role === "admin" && (
              <Button size="sm" variant="outline" onClick={() => setHostelAddDialogOpen(true)} className="h-7 text-xs px-2.5">
                + Add Hostel
              </Button>
            )}
          </div>
          {hostels.map((h) => (
            <button key={h.id} onClick={() => setSelected(h.id)}
              className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                selected === h.id ? "border-leaf-500 ring-2 ring-leaf-100" : "border-border hover:border-leaf-200"
              }`}>
              <div className="aspect-[16/9] overflow-hidden bg-surface">
                <img src={imgFor(h)} alt={h.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{h.name}</h4>
                  <span className="text-[10px] uppercase font-semibold text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded">{h.gender}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{h.campus}</p>
              </div>
            </button>
          ))}
        </aside>

        <div className="col-span-12 lg:col-span-8">
          {active && (
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">{active.name}</h2>
                  <p className="text-sm text-muted-foreground">{active.description}</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    <span className="font-semibold text-leaf-700">Campus:</span> {active.campus} &nbsp;|&nbsp; 
                    <span className="font-semibold text-leaf-700">Gender restriction:</span> <span className="capitalize">{active.gender}</span>
                  </p>
                </div>
                {role === "admin" && (
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setBlockAddDialogOpen(true)} className="flex items-center gap-1">
                      + Add Block
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setHostelDialogOpen(true)} className="flex items-center gap-1.5">
                      <Pencil className="size-3.5" /> Edit Hostel
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {shown.map((b) => (
              <Card key={b.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{b.name}</h3>
                    {role === "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveBlockId(b.id);
                          setRoomAddDialogOpen(true);
                        }}
                        className="text-xs h-6 px-1.5 text-leaf-600 hover:text-leaf-700 hover:bg-leaf-50"
                      >
                        + Add Room
                      </Button>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{b.rooms.length} rooms</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.rooms.map((r) => {
                    const free = r.capacity - r.taken;
                    const isFull = free <= 0;
                    return (
                      <div key={r.id} className={`rounded-xl border p-4 ${isFull ? "bg-muted/40 border-border" : "border-leaf-100 bg-leaf-50/40"}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground tracking-wider">Room</p>
                            <p className="text-lg font-semibold">{r.room_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {role === "admin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-leaf-700 hover:bg-leaf-50"
                                onClick={() => {
                                  setSelectedRoom(r);
                                  setRoomDialogOpen(true);
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isFull ? "bg-muted text-muted-foreground" : "bg-white text-leaf-700 ring-1 ring-leaf-100"}`}>
                              {isFull ? "Full" : `${free} free`}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{r.room_type}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="size-3" /> {r.capacity}</span>
                          <span className="flex items-center gap-1"><Bed className="size-3" /> {r.taken}/{r.capacity}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-medium">₦{r.price_per_term.toLocaleString()}<span className="text-xs text-muted-foreground">/term</span></span>
                          <Button size="sm" disabled={isFull || (role !== "admin" && !!existing) || busyRoom === r.id} onClick={() => reserve(r)}>
                            {busyRoom === r.id ? "…" : role === "admin" ? "Allocate" : "Reserve"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Hostel Dialog */}
      <Dialog open={hostelDialogOpen} onOpenChange={setHostelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Hostel Details</DialogTitle>
            <DialogDescription>
              Modify name, location parameters, and the image of {active?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hName">Hostel Name</Label>
              <Input id="hName" value={hName} onChange={(e) => setHName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hCampus">Campus</Label>
              <Input id="hCampus" value={hCampus} onChange={(e) => setHCampus(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hGender">Gender Category</Label>
              <Select value={hGender} onValueChange={setHGender}>
                <SelectTrigger id="hGender">
                  <SelectValue placeholder="Select Gender Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hImageUrl">Custom Image URL</Label>
              <Input id="hImageUrl" placeholder="https://example.com/hostel.jpg" value={hImageUrl} onChange={(e) => setHImageUrl(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hDesc">Description</Label>
              <Textarea id="hDesc" rows={3} value={hDescription} onChange={(e) => setHDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHostelDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveHostel}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hostel Dialog */}
      <Dialog open={hostelAddDialogOpen} onOpenChange={setHostelAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Hostel</DialogTitle>
            <DialogDescription>
              Create a new hostel building in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newHName">Hostel Name</Label>
              <Input id="newHName" placeholder="e.g. Umar Sulaim Hostel" value={newHName} onChange={(e) => setNewHName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newHCampus">Campus Location</Label>
              <Input id="newHCampus" placeholder="e.g. North Campus" value={newHCampus} onChange={(e) => setNewHCampus(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newHGender">Gender Category</Label>
              <Select value={newHGender} onValueChange={setNewHGender}>
                <SelectTrigger id="newHGender">
                  <SelectValue placeholder="Select Gender Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newHImageUrl">Custom Image URL (Optional)</Label>
              <Input id="newHImageUrl" placeholder="https://example.com/hostel.jpg" value={newHImageUrl} onChange={(e) => setNewHImageUrl(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newHDesc">Description</Label>
              <Textarea id="newHDesc" placeholder="Brief details about facilities, lounges, etc." rows={3} value={newHDescription} onChange={(e) => setNewHDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHostelAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateHostel}>Add Hostel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={blockAddDialogOpen} onOpenChange={setBlockAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Block to {active?.name}</DialogTitle>
            <DialogDescription>
              Create a new hostel block/section.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newBName">Block Name</Label>
              <Input id="newBName" placeholder="e.g. Block A" value={newBName} onChange={(e) => setNewBName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newBFloors">Number of Floors</Label>
              <Input id="newBFloors" type="number" min={1} value={newBFloors} onChange={(e) => setNewBFloors(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBlock}>Add Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={roomAddDialogOpen} onOpenChange={setRoomAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Create a new room in the selected block.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newRNumber">Room Number</Label>
              <Input id="newRNumber" placeholder="e.g. 101" value={newRNumber} onChange={(e) => setNewRNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newRType">Room Type</Label>
              <Input id="newRType" placeholder="e.g. Shared Ensuite" value={newRType} onChange={(e) => setNewRType(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newRCapacity">Capacity (Beds)</Label>
              <Input id="newRCapacity" type="number" min={1} value={newRCapacity} onChange={(e) => setNewRCapacity(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newRPrice">Price per Term (₦)</Label>
              <Input id="newRPrice" type="number" min={0} value={newRPrice} onChange={(e) => setNewRPrice(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRoomAddDialogOpen(false);
              setActiveBlockId(null);
            }}>Cancel</Button>
            <Button onClick={handleCreateRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Room to Student Dialog */}
      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Allocate Room {allocateRoom?.room_number} to Student</DialogTitle>
            <DialogDescription>
              Search for a student using their registration/matric number or email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentSearch">Student Reg Number or Email</Label>
              <div className="flex gap-2">
                <Input
                  id="studentSearch"
                  placeholder="e.g. U16CSC206 or student@abu.edu.ng"
                  value={studentSearchKey}
                  onChange={(e) => setStudentSearchKey(e.target.value)}
                />
                <Button disabled={searchingStudent} onClick={handleSearchStudent} size="sm">
                  {searchingStudent ? "..." : "Search"}
                </Button>
              </div>
            </div>

            {foundStudent && (
              <div className="rounded-xl border p-4 bg-muted/30 space-y-2 mt-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Student Profile Found</p>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {foundStudent.full_name}</p>
                  <p><span className="font-medium">Email:</span> {foundStudent.email || "N/A"}</p>
                  <p><span className="font-medium">Reg Number:</span> {foundStudent.matric_number || "N/A"}</p>
                  {foundStudent.phone && <p><span className="font-medium">Phone:</span> {foundStudent.phone}</p>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAllocateDialogOpen(false);
              setFoundStudent(null);
              setStudentSearchKey("");
              setAllocateRoom(null);
            }}>Cancel</Button>
            <Button disabled={!foundStudent || busyRoom === allocateRoom?.id} onClick={handleAllocateToStudent}>
              {busyRoom === allocateRoom?.id ? "..." : "Allocate Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paystack Payment Checkout Simulation Dialog */}
      <Dialog open={paystackDialogOpen} onOpenChange={paystackStage !== "loading" ? setPaystackDialogOpen : undefined}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-zinc-950 text-white rounded-2xl">
          <div className="grid grid-cols-12 min-h-[380px]">
            {/* Sidebar info */}
            <div className="col-span-4 bg-zinc-900 p-6 flex flex-col justify-between border-r border-zinc-800">
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Checkout</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-zinc-400 font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-zinc-500">Pay ABU Zaria</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase">Amount</span>
                <p className="text-xl font-bold text-[#3bb75e]">₦{paystackRoom ? paystackRoom.price_per_term.toLocaleString() : "0"}</p>
              </div>
            </div>

            {/* Main Checkout Panel */}
            <div className="col-span-8 p-6 flex flex-col justify-between bg-zinc-950 relative">
              {paystackStage === "loading" && (
                <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center space-y-4 z-50">
                  <div className="w-10 h-10 border-4 border-t-[#3bb75e] border-zinc-800 rounded-full animate-spin" />
                  <p className="text-xs font-medium text-zinc-400">Processing secure transaction...</p>
                </div>
              )}

              {paystackStage === "success" && (
                <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-3 z-50 animate-fade-in">
                  <div className="size-12 rounded-full bg-[#3bb75e]/25 flex items-center justify-center ring-4 ring-[#3bb75e]/10 animate-bounce">
                    <svg className="size-6 text-[#3bb75e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-[#3bb75e] text-base">Payment Successful</h4>
                  <p className="text-[11px] text-zinc-500">Allocation confirmed instantly</p>
                </div>
              )}

              {paystackStage === "otp" && (
                <form onSubmit={handleOtpSubmit} className="flex-1 flex flex-col justify-between z-10">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm">Verify Card Transaction</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">A one-time passcode has been sent to your phone. Enter passcode below to authorize.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">One-Time PIN (OTP)</Label>
                      <Input
                        required
                        placeholder="e.g. 12345"
                        maxLength={5}
                        className="bg-zinc-900 border-zinc-800 text-white text-center text-lg tracking-widest focus-visible:ring-[#3bb75e]"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <Button type="submit" className="w-full bg-[#3bb75e] hover:bg-[#3bb75e]/95 text-white font-semibold text-sm">
                      Authorize Payment
                    </Button>
                    <p className="text-[9px] text-center text-zinc-600">Secure transaction certified by Paystack SSL network.</p>
                  </div>
                </form>
              )}

              {paystackStage === "idle" && (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Select Payment Method Tabs */}
                  <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-lg">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 text-center py-1.5 text-[10px] font-semibold rounded-md transition-all ${
                        paymentMethod === "card" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod("transfer")}
                      className={`flex-1 text-center py-1.5 text-[10px] font-semibold rounded-md transition-all ${
                        paymentMethod === "transfer" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Bank Transfer
                    </button>
                  </div>

                  {paymentMethod === "card" && (
                    <form onSubmit={handlePaystackSubmit} className="flex-1 flex flex-col justify-between pt-4">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-[10px] uppercase font-semibold">Card Number</Label>
                          <Input
                            required
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-[#3bb75e] text-sm"
                            value={cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                              setCardNumber(val);
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-[10px] uppercase font-semibold">Expiry Date</Label>
                            <Input
                              required
                              placeholder="MM/YY"
                              maxLength={5}
                              className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-[#3bb75e] text-sm text-center"
                              value={cardExpiry}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val.length >= 2) {
                                  setCardExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
                                } else {
                                  setCardExpiry(val);
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-[10px] uppercase font-semibold">CVV</Label>
                            <Input
                              required
                              type="password"
                              placeholder="123"
                              maxLength={3}
                              className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-[#3bb75e] text-sm text-center"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4">
                        <Button type="submit" className="w-full bg-[#3bb75e] hover:bg-[#3bb75e]/90 text-white font-semibold text-sm">
                          Pay ₦{paystackRoom ? paystackRoom.price_per_term.toLocaleString() : "0"}
                        </Button>
                        <div className="flex justify-between items-center text-[8px] text-zinc-600">
                          <span>Secured by Paystack SSL</span>
                          <span className="flex items-center gap-0.5">🔒 Certified PCI-DSS</span>
                        </div>
                      </div>
                    </form>
                  )}

                  {paymentMethod === "transfer" && (
                    <div className="flex-1 flex flex-col justify-between pt-4">
                      <div className="space-y-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Transfer instructions</p>
                        <p className="text-zinc-400">Transfer the exact amount below to this dynamic bank account:</p>
                        <div className="space-y-1.5 pt-1.5 text-sm">
                          <p><span className="text-zinc-500 text-xs">Bank Name:</span> Titan Trust Bank</p>
                          <p><span className="text-zinc-500 text-xs">Account Number:</span> <span className="font-mono font-semibold text-white">9928172651</span></p>
                          <p><span className="text-zinc-500 text-xs">Amount:</span> <span className="font-semibold text-[#3bb75e]">₦{paystackRoom ? paystackRoom.price_per_term.toLocaleString() : "0"}</span></p>
                        </div>
                        <p className="text-[10px] text-zinc-500 pt-1.5 italic">This account number expires in 20:00 minutes.</p>
                      </div>
                      <div className="space-y-3 pt-4">
                        <Button onClick={handleTransferConfirm} className="w-full bg-[#3bb75e] hover:bg-[#3bb75e]/90 text-white font-semibold text-sm">
                          I've sent the money
                        </Button>
                        <div className="flex justify-between items-center text-[8px] text-zinc-600">
                          <span>Secured by Paystack SSL</span>
                          <span>🔒 Encrypted</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Edit Room Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Room {selectedRoom?.room_number}</DialogTitle>
            <DialogDescription>
              Update room pricing, capacity, and classification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rNumber">Room Number</Label>
              <Input id="rNumber" value={rNumber} onChange={(e) => setRNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rType">Room Type</Label>
              <Input id="rType" value={rType} onChange={(e) => setRType(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rCapacity">Capacity</Label>
              <Input id="rCapacity" type="number" value={rCapacity} onChange={(e) => setRCapacity(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rPrice">Price per Term (₦)</Label>
              <Input id="rPrice" type="number" value={rPrice} onChange={(e) => setRPrice(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRoomDialogOpen(false);
              setSelectedRoom(null);
            }}>Cancel</Button>
            <Button onClick={handleSaveRoom}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

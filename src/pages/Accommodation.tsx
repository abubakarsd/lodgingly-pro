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

  // Edit Room State
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rNumber, setRNumber] = useState("");
  const [rType, setRType] = useState("");
  const [rCapacity, setRCapacity] = useState<number>(2);
  const [rPrice, setRPrice] = useState<number>(0);


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
    if (existing) { toast({ title: "Already allocated", description: "Cancel your current allocation first." }); return; }
    if (room.taken >= room.capacity) { toast({ title: "Full", description: "This room has no free beds.", variant: "destructive" }); return; }
    setBusyRoom(room.id);
    const bed = String.fromCharCode(65 + room.taken); // A, B, C
    const { error } = await supabase.from("allocations").insert({
      student_id: user.id, room_id: room.id, bed_label: bed, term: "2026/27", status: "active",
    });
    setBusyRoom(null);
    if (error) { toast({ title: "Reservation failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Reserved!", description: `Bed ${bed} — Room ${room.room_number}` });
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
        <aside className="col-span-12 lg:col-span-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Residences</p>
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
                  <Button variant="outline" size="sm" onClick={() => setHostelDialogOpen(true)} className="flex items-center gap-1.5 shrink-0">
                    <Pencil className="size-3.5" /> Edit Hostel
                  </Button>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {shown.map((b) => (
              <Card key={b.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{b.name}</h3>
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
                          <Button size="sm" disabled={isFull || !!existing || busyRoom === r.id} onClick={() => reserve(r)}>
                            {busyRoom === r.id ? "…" : "Reserve"}
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

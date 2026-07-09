import { Link } from "react-router-dom";
import { ArrowRight, Check, MapPin, MessagesSquare, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import heroEmerald from "@/assets/hostel-emerald.jpg";
import verdant from "@/assets/hostel-verdant.jpg";
import cedar from "@/assets/hostel-cedar.jpg";
import ivy from "@/assets/hostel-ivy.jpg";

const blocks = [
  { name: "Umar Sulaim Hostel", meta: "North Campus • Male", img: heroEmerald },
  { name: "Amina Hostel", meta: "South Campus • Female", img: verdant },
  { name: "Ribadu Hostel", meta: "Central Campus • Male", img: cedar },
  { name: "Sakawa Hostel", meta: "East Campus • Male", img: ivy },
  { name: "Danfodio Hostel", meta: "West Campus • Male", img: heroEmerald },
  { name: "Dangote Hostel", meta: "North Campus • Mixed", img: verdant },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="hidden md:flex gap-6">
              <a href="#residences" className="text-sm font-medium text-muted-foreground hover:text-leaf-600 transition-colors">Accommodation</a>
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-leaf-600 transition-colors">Student Life</a>
              <a href="#admin" className="text-sm font-medium text-muted-foreground hover:text-leaf-600 transition-colors">Support</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hidden sm:inline">Help</Link>
            <Link to="/auth" className="bg-leaf-600 text-white px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-leaf-600 hover:bg-leaf-700 transition-colors">Portal Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 md:pt-20 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center animate-fade-up">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground max-w-[24ch] text-balance leading-tight">
              University living, managed with digital precision.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-[56ch] text-pretty">
              A centralized platform for student housing. Browse modern hostel blocks, manage your residency, and resolve maintenance requests in a single interface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/auth" className="bg-leaf-600 text-white py-2.5 pr-4 pl-3.5 rounded-lg text-sm font-medium ring-1 ring-leaf-600 flex items-center gap-2 hover:bg-leaf-700 transition-colors">
                <ArrowRight className="size-4" /> Browse Hostels
              </Link>
              <a href="#residences" className="bg-white text-foreground py-2.5 px-4 rounded-lg text-sm font-medium ring-1 ring-border hover:bg-surface transition-colors">View Residences</a>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 md:mt-20 relative mx-auto max-w-5xl rounded-t-2xl ring-1 ring-black/5 shadow-2xl bg-surface p-3 md:p-4 pb-0 animate-fade-up">
            <div className="bg-white rounded-t-xl overflow-hidden border border-border">
              <div className="h-12 border-b border-border bg-surface/70 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-muted"></div>
                  <div className="size-2.5 rounded-full bg-muted"></div>
                  <div className="size-2.5 rounded-full bg-muted"></div>
                </div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Student Portal / Dashboard</div>
                <div className="size-4"></div>
              </div>
              <div className="p-4 md:p-6 grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 md:col-span-8 space-y-4 md:space-y-6">
                  <div className="bg-leaf-50 rounded-xl p-5 border border-leaf-100">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-semibold text-leaf-700 uppercase tracking-wider">Active Allocation</span>
                        <h3 className="text-xl font-medium text-leaf-900 mt-1">Emerald Hall, Block A</h3>
                        <p className="text-sm text-leaf-700/70 mt-1">Room 402 • Shared Ensuite • Bed A</p>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full text-[11px] font-semibold text-leaf-700 ring-1 ring-leaf-100 whitespace-nowrap">Term Active</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">Clearance</span>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="size-2 rounded-full bg-leaf-500"></div>
                        <span className="text-sm font-medium">Fully Cleared</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-border">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">Maintenance</span>
                      <div className="mt-2 text-sm font-medium">0 Active Tickets</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-4 space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-surface/40">
                    <h4 className="text-xs font-semibold">Roommates</h4>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3"><div className="size-7 rounded-full bg-muted"></div><div className="text-xs font-medium">Marcus Chen</div></div>
                      <div className="flex items-center gap-3"><div className="size-7 rounded-full bg-muted"></div><div className="text-xs font-medium">Julian Vane</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {[
              { Icon: MapPin, t: "Smart Allocation", d: "Our algorithm pairs roommates based on lifestyle preferences and academic discipline for a harmonious living environment." },
              { Icon: ShieldCheck, t: "Digital Clearance", d: "Skip the administrative queues. Complete move-in and move-out clearance forms directly from your dashboard." },
              { Icon: MessagesSquare, t: "Instant Communication", d: "Direct chat channels with your floor wardens and roommates. Stay updated with real-time housing notifications." },
            ].map(({ Icon, t, d }) => (
              <div key={t}>
                <div className="size-10 bg-leaf-100 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="size-5 text-leaf-700" />
                </div>
                <h3 className="text-lg font-medium">{t}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-pretty">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Residences */}
      <section id="residences" className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-10 md:mb-12">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Available Residences</h2>
              <p className="text-muted-foreground mt-2">Explore modern blocks designed for academic success.</p>
            </div>
            <Link to="/auth" className="text-sm font-medium text-leaf-600 flex items-center gap-1 hover:underline">View all blocks →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blocks.map((b) => (
              <div key={b.name} className="group cursor-pointer">
                <div className="w-full aspect-[4/5] bg-surface rounded-xl outline-1 -outline-offset-1 outline-black/5 overflow-hidden mb-4">
                  <img src={b.img} alt={b.name} width={800} height={1000} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h4 className="font-medium">{b.name}</h4>
                <p className="text-sm text-muted-foreground">{b.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin section */}
      <section id="admin" className="py-20 md:py-24 bg-zinc-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <span className="text-leaf-500 font-medium text-sm">Administrative Control</span>
            <h2 className="text-3xl font-semibold mt-4 text-balance leading-tight">Visibility into every corner of the housing ecosystem.</h2>
            <p className="mt-6 text-zinc-400 text-pretty">Manage occupancy rates, process maintenance requests, and analyze student satisfaction trends with powerful administrative tools.</p>
            <div className="mt-10 space-y-4">
              {["Real-time occupancy tracking across residential blocks.", "Automated billing and clearance management systems."].map((line) => (
                <div key={line} className="flex items-start gap-4">
                  <div className="size-6 rounded bg-leaf-600/20 flex items-center justify-center shrink-0">
                    <Check className="size-3.5 text-leaf-500" />
                  </div>
                  <p className="text-sm text-zinc-300">{line}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 ring-1 ring-white/10 shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Occupancy</p>
                <p className="text-2xl font-semibold mt-1">92.4%</p>
                <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-leaf-500 w-[92%]"></div>
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Pending Tickets</p>
                <p className="text-2xl font-semibold mt-1">18</p>
                <p className="text-[10px] text-leaf-500 mt-2">-4 from yesterday</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
              <p className="text-xs font-semibold mb-4">Recent Complaints</p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Leak in C402</span>
                  <span className="bg-leaf-900/40 text-leaf-500 px-2 py-0.5 rounded text-[10px] font-medium">High</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Wi-Fi Outage — Hall B</span>
                  <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-medium">Resolved</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Furniture Request</span>
                  <span className="bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded text-[10px] font-medium">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-leaf-600"></div>
            <span className="text-sm font-semibold">ABU Hostel — Hostel Management System</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">University Guidelines</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Contact Support</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 ABU Hostel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

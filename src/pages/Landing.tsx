import { Link } from "react-router-dom";
import { ArrowRight, Check, MapPin, MessagesSquare, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import heroEmerald from "@/assets/hostel-emerald.jpg";
import verdant from "@/assets/hostel-verdant.jpg";
import cedar from "@/assets/hostel-cedar.jpg";
import ivy from "@/assets/hostel-ivy.jpg";
import bgImage from "@/assets/bg-image.jpeg";

const blocks = [
  { name: "Umar Sulaim Hostel", meta: "North Campus • Male", img: heroEmerald },
  { name: "Amina Hostel", meta: "South Campus • Female", img: verdant },
  { name: "Ribadu Hostel", meta: "Central Campus • Female", img: cedar },
  { name: "Sakawa Hostel", meta: "East Campus • Female", img: ivy },
  { name: "Danfodio Hostel", meta: "West Campus • Male", img: heroEmerald },
  { name: "Dangote Hostel", meta: "North Campus • Male", img: verdant },
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
      <section className="relative pt-24 md:pt-32 pb-20 overflow-hidden bg-black text-white">
        {/* Sliding Background */}
        <div 
          className="absolute inset-0 z-0 animate-slide-bg opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        
        {/* Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={i} 
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 10 + 15}s`
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center animate-fade-up">
            <div className="inline-flex items-center rounded-full border border-leaf-500/30 bg-leaf-500/10 px-3 py-1 text-sm text-leaf-300 backdrop-blur-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-leaf-500 mr-2"></span>
              Computer Science Final Year Project — Diploma Iya Abubakar
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-[20ch] text-balance leading-tight drop-shadow-md">
              Ahmadu Bello University Hostel Management System
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-[56ch] text-pretty drop-shadow">
              A centralized digital platform for ABU students. Browse hostels, pay securely for your room, lodge maintenance complaints, and print clearance forms online.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link to="/auth" className="bg-leaf-600 text-white py-3 pr-5 pl-4 rounded-xl text-base font-medium ring-1 ring-leaf-500 flex items-center gap-2 hover:bg-leaf-500 transition-colors shadow-lg shadow-leaf-600/20">
                <ArrowRight className="size-5" /> Get Started
              </Link>
              <a href="#how-it-works" className="bg-white/10 text-white py-3 px-6 rounded-xl text-base font-medium ring-1 ring-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight">Accommodation Process</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Follow these simple steps to secure your room at ABU Zaria hostels.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-leaf-100 z-0"></div>
            
            {[
              { step: "01", title: "Select a Hostel", desc: "Browse available ABU hostels (e.g., Umar Sulaiman, Amina) and check room capacities." },
              { step: "02", title: "Reserve & Pay", desc: "Choose your preferred block and room. Securely pay online to own your bed space." },
              { step: "03", title: "Print Forms", desc: "Instantly generate and print your official accommodation form from your dashboard." },
              { step: "04", title: "Move In & Clear", desc: "Settle into your room. At the end of the session, print your clearance form online." }
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white border-4 border-leaf-50 text-leaf-600 font-bold text-xl flex items-center justify-center shadow-sm mb-6">
                  {s.step}
                </div>
                <h3 className="text-lg font-medium mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground text-pretty">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {[
              { Icon: MapPin, t: "Real-time Accommodation", d: "View exactly how many people are in a room and available bed spaces before you make a payment." },
              { Icon: ShieldCheck, t: "Printable Forms", d: "Generate your accommodation form instantly after payment, and print your clearance form at the end of the session." },
              { Icon: MessagesSquare, t: "Online Complaints", d: "Experiencing an issue? Lodge a maintenance complaint online and track its resolution status from your dashboard." },
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

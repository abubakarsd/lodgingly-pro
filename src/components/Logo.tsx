import abuLogo from "@/assets/ABU_Zaria_logo.jpg";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={abuLogo} alt="ABU Zaria" className="h-8 w-auto object-contain" />
      <span className="font-semibold tracking-tight text-leaf-700">ABU Hostel</span>
    </div>
  );
}

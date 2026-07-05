export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="size-6 rounded-md bg-leaf-600 grid place-items-center">
        <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" strokeWidth="2.2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V10l8-6 8 6v11M9 21v-7h6v7" />
        </svg>
      </div>
      <span className="font-semibold tracking-tight text-leaf-700">CampusStay</span>
    </div>
  );
}

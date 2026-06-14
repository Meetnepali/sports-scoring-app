export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const ring: Record<string, string> = {
    sm: "h-8 w-8 border-2",
    default: "h-10 w-10 border-2",
    lg: "h-14 w-14 border-[3px]",
  }

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
      <div className={`${ring[size]} rounded-full border-slate-200 border-t-slate-900 animate-spin`} />
      <span className="text-xs font-medium text-slate-400 tracking-wide">Loading…</span>
    </div>
  )
}

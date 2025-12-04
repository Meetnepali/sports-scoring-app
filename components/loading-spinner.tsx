import type { CSSProperties } from "react"

const ringDimensions: Record<"sm" | "default" | "lg", string> = {
  sm: "h-12 w-12",
  default: "h-16 w-16",
  lg: "h-24 w-24",
}

const innerGap: Record<"sm" | "default" | "lg", string> = {
  sm: "inset-[6px]",
  default: "inset-[8px]",
  lg: "inset-[10px]",
}

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-6">
      <div className={`relative ${ringDimensions[size]}`}>
        <div
          className="absolute inset-0 animate-spin-slow rounded-full"
          style={{
            background:
              "conic-gradient(var(--tw-gradient-stops))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 4px))",
            mask:
              "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 4px))",
            "--tw-gradient-from": "#4f46e5",
            "--tw-gradient-stops": "#4f46e5, #8b5cf6, #14b8a6, #4f46e5",
          } as CSSProperties}
        />
        <div
          className={`absolute ${innerGap[size]} rounded-full bg-white shadow-inner dark:bg-slate-900`}
        />
        <span className="absolute inset-0 animate-pulse-slow rounded-full border border-white/40 dark:border-white/10" />
      </div>
      <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
        <span className="font-medium text-slate-600 dark:text-slate-200">Getting things ready</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">This will just take a moment.</span>
      </div>
    </div>
  )
}

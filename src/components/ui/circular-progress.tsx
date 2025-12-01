import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  valueClassName?: string
  labelClassName?: string
  label?: string
  animate?: boolean
  color?: string
  trackColor?: string
  children?: React.ReactNode
}

const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(({
  value,
  max = 100,
  size = 200,
  strokeWidth = 12,
  className,
  showValue = true,
  valueClassName,
  labelClassName,
  label,
  animate = true,
  color = "hsl(var(--primary))",
  trackColor = "hsl(var(--muted))",
  children
}, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            animate && "transition-all duration-500 ease-out"
          )}
          style={{
            filter: "drop-shadow(0 0 6px currentColor)"
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? (
          children
        ) : (
          <>
            {showValue && (
              <span className={cn(
                "text-4xl font-bold tabular-nums tracking-tight",
                valueClassName
              )}>
                {Math.round(value)}
              </span>
            )}
            {label && (
              <span className={cn(
                "text-sm text-muted-foreground mt-1",
                labelClassName
              )}>
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
})

CircularProgress.displayName = "CircularProgress"

export { CircularProgress }


import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "small" | "default" | "large"
  className?: string
  tip?: React.ReactNode
}

const sizeClasses = {
  small: "h-4 w-4",
  default: "h-8 w-8",
  large: "h-12 w-12",
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "default",
  className,
  tip
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <svg
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {tip && (
        <div className="text-sm text-muted-foreground">{tip}</div>
      )}
    </div>
  )
}

// Full page loading spinner
export const PageSpinner: React.FC<{ tip?: React.ReactNode }> = ({ tip }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Spinner size="large" tip={tip} />
    </div>
  )
}

// Inline loading spinner
export const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => {
  return <Spinner size="small" className={className} />
}
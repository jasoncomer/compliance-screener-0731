import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input bg-background text-foreground focus-visible:ring-ring",
        ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
        outline: "border-input bg-transparent text-foreground focus-visible:ring-ring",
      },
      size: {
        sm: "h-8 px-2 py-1 text-sm",
        default: "h-10 px-3 py-2",
        lg: "h-12 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size = 'default', type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, size }),
          // Ensure proper dark mode styling without !important
          "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400",
          "dark:focus-visible:ring-orange-500 dark:focus-visible:ring-offset-gray-900",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }

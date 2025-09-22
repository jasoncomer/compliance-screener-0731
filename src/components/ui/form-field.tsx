import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { Input, type InputProps } from "./input"

export interface FormFieldProps extends InputProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || `field-${generatedId}`

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={cn(
            error && "border-danger focus-visible:ring-danger"
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

export { FormField }
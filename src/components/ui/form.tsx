import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

// Form Context for managing form state
interface FormContextValue {
  errors: Record<string, string>
  values: Record<string, any>
  touched: Record<string, boolean>
  setFieldValue: (name: string, value: any) => void
  setFieldError: (name: string, error: string) => void
  setFieldTouched: (name: string, touched: boolean) => void
  registerField: (name: string) => void
  unregisterField: (name: string) => void
}

const FormContext = React.createContext<FormContextValue | undefined>(undefined)

export const useFormContext = () => {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error("useFormContext must be used within a Form")
  }
  return context
}

// Form Component
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onFinish?: (values: Record<string, any>) => void | Promise<void>
  initialValues?: Record<string, any>
  layout?: "vertical" | "horizontal" | "inline"
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({
    className,
    onFinish,
    initialValues = {},
    layout = "vertical",
    children,
    ...props
  }, ref) => {
    const [values, setValues] = React.useState<Record<string, any>>(initialValues)
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [touched, setTouched] = React.useState<Record<string, boolean>>({})
    const [, setIsSubmitting] = React.useState(false)
    const registeredFields = React.useRef<Set<string>>(new Set())

    const setFieldValue = React.useCallback((name: string, value: any) => {
      setValues(prev => ({ ...prev, [name]: value }))
      // Clear error when field is modified
      setErrors(prev => ({ ...prev, [name]: "" }))
    }, [])

    const setFieldError = React.useCallback((name: string, error: string) => {
      setErrors(prev => ({ ...prev, [name]: error }))
    }, [])

    const setFieldTouched = React.useCallback((name: string, touched: boolean) => {
      setTouched(prev => ({ ...prev, [name]: touched }))
    }, [])

    const registerField = React.useCallback((name: string) => {
      registeredFields.current.add(name)
    }, [])

    const unregisterField = React.useCallback((name: string) => {
      registeredFields.current.delete(name)
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!onFinish) return

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {}
      registeredFields.current.forEach(field => {
        allTouched[field] = true
      })
      setTouched(allTouched)

      // Check for errors
      const hasErrors = Object.values(errors).some(error => error !== "")
      if (hasErrors) return

      setIsSubmitting(true)
      try {
        await onFinish(values)
      } finally {
        setIsSubmitting(false)
      }
    }

    const contextValue: FormContextValue = {
      errors,
      values,
      touched,
      setFieldValue,
      setFieldError,
      setFieldTouched,
      registerField,
      unregisterField,
    }

    return (
      <FormContext.Provider value={contextValue}>
        <form
          ref={ref}
          className={cn(
            layout === "inline" && "flex flex-wrap gap-4 items-end",
            className
          )}
          onSubmit={handleSubmit}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    )
  }
)

Form.displayName = "Form"

// Form Item Component
export interface FormItemProps {
  name: string
  label?: string
  rules?: Array<{
    required?: boolean
    message?: string
    pattern?: RegExp
    min?: number
    max?: number
    validator?: (value: any) => string | undefined
  }>
  children: React.ReactElement
  className?: string
  help?: string
}

export const FormItem: React.FC<FormItemProps> = ({
  name,
  label,
  rules = [],
  children,
  className,
  help,
}) => {
  const form = useFormContext()
  const fieldId = `field-${name}`

  React.useEffect(() => {
    form.registerField(name)
    return () => form.unregisterField(name)
  }, [name, form])

  const validate = React.useCallback((value: any) => {
    for (const rule of rules) {
      if (rule.required && !value) {
        return rule.message || `${label || name} is required`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${label || name} format is invalid`
      }
      if (rule.min !== undefined && value.length < rule.min) {
        return rule.message || `${label || name} must be at least ${rule.min} characters`
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return rule.message || `${label || name} must be at most ${rule.max} characters`
      }
      if (rule.validator) {
        const error = rule.validator(value)
        if (error) return error
      }
    }
    return ""
  }, [rules, label, name])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    form.setFieldValue(name, value)

    // Validate on change if field has been touched
    if (form.touched[name]) {
      const error = validate(value)
      form.setFieldError(name, error)
    }
  }

  const handleBlur = () => {
    form.setFieldTouched(name, true)
    const error = validate(form.values[name])
    form.setFieldError(name, error)
  }

  const error = form.touched[name] ? form.errors[name] : ""
  const value = form.values[name] || ""

  const childElement = React.cloneElement(children, {
    id: fieldId,
    name,
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${fieldId}-error` : help ? `${fieldId}-help` : undefined,
  })

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}
          {rules.some(r => r.required) && (
            <span className="text-danger ml-1">*</span>
          )}
        </Label>
      )}
      {childElement}
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
      {help && !error && (
        <p id={`${fieldId}-help`} className="text-sm text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  )
}

// Form Actions Component
export interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className,
  align = "right",
}) => {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 pt-4",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

// Convenience hook for form handling
export const useForm = (initialValues: Record<string, any> = {}) => {
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  const setFieldValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const setFieldError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const setFieldTouched = (name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }))
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  const validateForm = (rules: Record<string, any>) => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field]
      const value = values[field]

      if (fieldRules.required && !value) {
        newErrors[field] = `${field} is required`
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateForm,
  }
}
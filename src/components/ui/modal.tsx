import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { SPACING_STANDARDS, BORDER_RADIUS, Z_INDEX, ANIMATIONS } from "@/design-system/constants"

export interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  centered?: boolean
  className?: string
  bodyClassName?: string
  destroyOnClose?: boolean
  afterClose?: () => void
  afterOpen?: () => void
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  full: "max-w-full mx-4",
}

export const Modal: React.FC<ModalProps> = ({
  open = false,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closable = true,
  maskClosable = true,
  keyboard = true,
  centered = true,
  className,
  bodyClassName,
  destroyOnClose = false,
  afterClose,
  afterOpen,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)
  const modalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open) {
      setShouldRender(true)
      // Small delay for animation
      requestAnimationFrame(() => {
        setIsVisible(true)
        afterOpen?.()
      })
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
        afterClose?.()
      }, 200) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [open, afterClose, afterOpen])

  React.useEffect(() => {
    if (!open || !keyboard) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, keyboard, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onClose?.()
    }
  }

  if (!shouldRender && destroyOnClose) {
    return null
  }

  if (!shouldRender) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity",
          Z_INDEX.modalBackdrop,
          ANIMATIONS.duration.base,
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed inset-0 overflow-y-auto",
          Z_INDEX.modal,
          "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "flex min-h-full items-center justify-center p-4",
            !centered && "items-start pt-16"
          )}
        >
          <div
            ref={modalRef}
            className={cn(
              "pointer-events-auto relative w-full transform transition-all",
              ANIMATIONS.duration.base,
              sizeClasses[size],
              isVisible
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-95",
              "bg-background border shadow-lg",
              BORDER_RADIUS.lg,
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {/* Header */}
            {(title || closable) && (
              <div
                className={cn(
                  "flex items-center justify-between border-b",
                  SPACING_STANDARDS.modal.header
                )}
              >
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {title}
                  </h2>
                )}
                {closable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div
              className={cn(
                SPACING_STANDARDS.modal.body,
                "text-foreground",
                bodyClassName
              )}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className={cn(
                  "flex items-center justify-end gap-2 border-t",
                  SPACING_STANDARDS.modal.footer
                )}
              >
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Convenience components for common modal patterns
export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("text-lg font-semibold", className)}>
    {children}
  </div>
)

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("text-foreground", className)}>
    {children}
  </div>
)

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("flex items-center justify-end gap-2", className)}>
    {children}
  </div>
)

// Confirm modal helper
export interface ConfirmModalProps extends Omit<ModalProps, "children" | "footer"> {
  content: React.ReactNode
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  confirmButtonProps?: React.ComponentProps<typeof Button>
  cancelButtonProps?: React.ComponentProps<typeof Button>
  type?: "info" | "success" | "warning" | "danger"
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  content,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonProps,
  cancelButtonProps,
  type = "info",
  onClose,
  ...modalProps
}) => {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    if (!onConfirm) return

    setLoading(true)
    try {
      await onConfirm()
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onClose?.()
  }

  const confirmVariant = type === "danger" ? "destructive" : "default"

  return (
    <Modal
      {...modalProps}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
            {...confirmButtonProps}
          >
            {loading ? "Loading..." : confirmText}
          </Button>
        </>
      }
    >
      {content}
    </Modal>
  )
}
import * as React from "react"

import { AlertCircle, CheckCircle, Info, X,XCircle } from "lucide-react"

import { ANIMATIONS, Z_INDEX } from "@/design-system/constants"
import { cn } from "@/lib/utils"

// Message types
type MessageType = "success" | "error" | "warning" | "info" | "loading"

interface MessageOptions {
  content: React.ReactNode
  type?: MessageType
  duration?: number // in seconds, 0 means no auto-close
  onClose?: () => void
  key?: string | number
}

interface MessageInstance {
  id: string
  content: React.ReactNode
  type: MessageType
  duration: number
  onClose?: () => void
}

// Icons for different message types
const icons: Record<MessageType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertCircle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-info" />,
  loading: (
    <svg
      className="h-5 w-5 animate-spin text-primary"
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
  ),
}

// Message Container Component
const MessageContainer: React.FC = () => {
  const [messages, setMessages] = React.useState<MessageInstance[]>([])

  React.useEffect(() => {
    const handleMessage = (event: CustomEvent<MessageOptions>) => {
      const { content, type = "info", duration = 3, onClose, key } = event.detail
      const id = key?.toString() || Date.now().toString()

      setMessages((prev) => {
        // If key exists, replace the existing message
        const existing = prev.find((msg) => msg.id === id)
        if (existing) {
          return prev.map((msg) =>
            msg.id === id ? { ...msg, content, type, duration, onClose } : msg
          )
        }
        // Otherwise add new message
        return [...prev, { id, content, type, duration, onClose }]
      })

      // Auto-remove message after duration
      if (duration > 0) {
        setTimeout(() => {
          removeMessage(id)
          onClose?.()
        }, duration * 1000)
      }
    }

    const removeMessage = (id: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id))
    }

    // Listen for message events
    window.addEventListener("show-message" as any, handleMessage)

    return () => {
      window.removeEventListener("show-message" as any, handleMessage)
    }
  }, [])

  const handleClose = (id: string, onClose?: () => void) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
    onClose?.()
  }

  if (messages.length === 0) return null

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2",
        Z_INDEX.notification
      )}
      style={{ maxWidth: "90vw" }}
    >
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          onClose={() => handleClose(msg.id, msg.onClose)}
        />
      ))}
    </div>
  )
}

// Individual Message Item
const MessageItem: React.FC<{
  message: MessageInstance
  onClose: () => void
}> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200) // Wait for exit animation
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 bg-background border rounded-lg shadow-lg",
        "transition-all",
        ANIMATIONS.duration.base,
        isVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "-translate-y-2 opacity-0 scale-95",
        "dark:bg-gray-800 dark:border-gray-700"
      )}
      role="alert"
    >
      {icons[message.type]}
      <span className="flex-1 text-sm font-medium">{message.content}</span>
      {message.type !== "loading" && (
        <button
          onClick={handleClose}
          className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Message API
class MessageApi {
  private dispatch(options: MessageOptions) {
    const event = new CustomEvent("show-message", { detail: options })
    window.dispatchEvent(event)
  }

  success(content: React.ReactNode, duration?: number) {
    this.dispatch({ content, type: "success", duration })
  }

  error(content: React.ReactNode, duration?: number) {
    this.dispatch({ content, type: "error", duration })
  }

  warning(content: React.ReactNode, duration?: number) {
    this.dispatch({ content, type: "warning", duration })
  }

  info(content: React.ReactNode, duration?: number) {
    this.dispatch({ content, type: "info", duration })
  }

  loading(content: React.ReactNode, key?: string | number) {
    this.dispatch({ content, type: "loading", duration: 0, key })
    return () => this.destroy(key)
  }

  open(options: MessageOptions) {
    this.dispatch(options)
  }

  destroy(key?: string | number) {
    if (key) {
      // Send a destroy event for specific key
      const event = new CustomEvent("destroy-message", { detail: { key } })
      window.dispatchEvent(event)
    }
  }
}

// Create singleton instance
const message = new MessageApi()

// Hook for using message in components
export const useMessage = () => {
  return message
}

// Export the container component that needs to be added to App
export { message,MessageContainer }

// Notification API (similar to message but positioned differently)
export interface NotificationOptions {
  message: React.ReactNode
  description?: React.ReactNode
  type?: MessageType
  duration?: number
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
  onClose?: () => void
  key?: string | number
  btn?: React.ReactNode
}

interface NotificationInstance extends NotificationOptions {
  id: string
}

// Notification Container Component
const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = React.useState<NotificationInstance[]>([])

  React.useEffect(() => {
    const handleNotification = (event: CustomEvent<NotificationOptions>) => {
      const {
        message,
        description,
        type = "info",
        duration = 4.5,
        placement = "topRight",
        onClose,
        key,
        btn,
      } = event.detail
      const id = key?.toString() || Date.now().toString()

      setNotifications((prev) => {
        const existing = prev.find((notif) => notif.id === id)
        if (existing) {
          return prev.map((notif) =>
            notif.id === id
              ? { ...notif, message, description, type, duration, placement, onClose, btn }
              : notif
          )
        }
        return [
          ...prev,
          { id, message, description, type, duration, placement, onClose, btn },
        ]
      })

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
          onClose?.()
        }, duration * 1000)
      }
    }

    const removeNotification = (id: string) => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    }

    window.addEventListener("show-notification" as any, handleNotification)

    return () => {
      window.removeEventListener("show-notification" as any, handleNotification)
    }
  }, [])

  const handleClose = (id: string, onClose?: () => void) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    onClose?.()
  }

  // Group notifications by placement
  const grouped = React.useMemo(() => {
    const groups: Record<string, NotificationInstance[]> = {}
    notifications.forEach((notif) => {
      const placement = notif.placement || "topRight"
      if (!groups[placement]) groups[placement] = []
      groups[placement].push(notif)
    })
    return groups
  }, [notifications])

  const placementClasses = {
    topLeft: "top-4 left-4",
    topRight: "top-4 right-4",
    bottomLeft: "bottom-4 left-4",
    bottomRight: "bottom-4 right-4",
  }

  if (notifications.length === 0) return null

  return (
    <>
      {Object.entries(grouped).map(([placement, notifs]) => (
        <div
          key={placement}
          className={cn(
            "fixed flex flex-col gap-2",
            placementClasses[placement as keyof typeof placementClasses],
            Z_INDEX.notification
          )}
          style={{ maxWidth: "384px" }}
        >
          {notifs.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClose={() => handleClose(notif.id, notif.onClose)}
            />
          ))}
        </div>
      ))}
    </>
  )
}

// Individual Notification Item
const NotificationItem: React.FC<{
  notification: NotificationInstance
  onClose: () => void
}> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <div
      className={cn(
        "w-96 p-4 bg-background border rounded-lg shadow-lg",
        "transition-all",
        ANIMATIONS.duration.base,
        isVisible
          ? "translate-x-0 opacity-100 scale-100"
          : notification.placement?.includes("Right")
          ? "translate-x-2 opacity-0 scale-95"
          : "-translate-x-2 opacity-0 scale-95",
        "dark:bg-gray-800 dark:border-gray-700"
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[notification.type || "info"]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="font-medium text-foreground">{notification.message}</div>
            <button
              onClick={handleClose}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {notification.description && (
            <div className="mt-1 text-sm text-muted-foreground">
              {notification.description}
            </div>
          )}
          {notification.btn && <div className="mt-3">{notification.btn}</div>}
        </div>
      </div>
    </div>
  )
}

// Notification API
class NotificationApi {
  private dispatch(options: NotificationOptions) {
    const event = new CustomEvent("show-notification", { detail: options })
    window.dispatchEvent(event)
  }

  success(options: NotificationOptions | string) {
    if (typeof options === "string") {
      this.dispatch({ message: options, type: "success" })
    } else {
      this.dispatch({ ...options, type: "success" })
    }
  }

  error(options: NotificationOptions | string) {
    if (typeof options === "string") {
      this.dispatch({ message: options, type: "error" })
    } else {
      this.dispatch({ ...options, type: "error" })
    }
  }

  warning(options: NotificationOptions | string) {
    if (typeof options === "string") {
      this.dispatch({ message: options, type: "warning" })
    } else {
      this.dispatch({ ...options, type: "warning" })
    }
  }

  info(options: NotificationOptions | string) {
    if (typeof options === "string") {
      this.dispatch({ message: options, type: "info" })
    } else {
      this.dispatch({ ...options, type: "info" })
    }
  }

  open(options: NotificationOptions) {
    this.dispatch(options)
  }

  destroy(key?: string | number) {
    if (key) {
      const event = new CustomEvent("destroy-notification", { detail: { key } })
      window.dispatchEvent(event)
    }
  }
}

// Create singleton instance
const notification = new NotificationApi()

// Hook for using notification in components
export const useNotification = () => {
  return notification
}

// Export the notification components
export { notification,NotificationContainer }
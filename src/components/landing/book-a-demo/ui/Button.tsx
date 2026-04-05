import * as React from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"
type ButtonRounded = "md" | "full"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  rounded?: ButtonRounded
  // kept for API compatibility; ignored in this no-lib implementation
  // asChild?: boolean
}

const base =
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-900 hover:bg-slate-100",
  link: "text-emerald-700 underline-offset-4 hover:underline bg-transparent",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
  lg: "h-11 px-6",
  icon: "h-10 w-10 p-0",
}

const roundedClasses: Record<ButtonRounded, string> = {
  md: "rounded-md",
  full: "rounded-full",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // add asChild = false to the destructured props to use it in the future if needed
  ({ className, variant = "default", size = "default", rounded = "full", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variantClasses[variant], sizeClasses[size], roundedClasses[rounded], className)}
        {...props}

      />
    )
  },
)
Button.displayName = "Button"

export { variantClasses as buttonVariantClasses }

import * as React from "react"
import { cn } from "@/lib/utils"

export type Props = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, Props>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 outline-none ring-offset-background transition focus:border-slate-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

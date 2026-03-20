"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RGContext = {
  name: string
  value?: string
  setValue?: (v: string) => void
  onValueChange?: (v: string) => void
}
const RadioGroupCtx = React.createContext<RGContext | null>(null)

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, name, ...props }, ref) => {
    if (!name) {
      throw new Error("RadioGroup: 'name' prop is required to avoid hydration mismatch.")
    }
    const [internal, setInternal] = React.useState<string | undefined>(defaultValue)
    const actualValue = value !== undefined ? value : internal

    const setValue = (v: string) => {
      if (value === undefined) setInternal(v)
      onValueChange?.(v)
    }

    return (
      <RadioGroupCtx.Provider value={{ name, value: actualValue, setValue, onValueChange }}>
        <div ref={ref} role="radiogroup" className={cn("grid gap-3", className)} {...props} />
      </RadioGroupCtx.Provider>
    )
  },
)
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupCtx)
    return (
      <input
        ref={ref}
        id={id}
        type="radio"
        name={ctx?.name}
        value={value}
        checked={ctx?.value === value}
        onChange={() => ctx?.setValue?.(value)}
        className={cn(
          "h-4 w-4 rounded-full border border-slate-400 accent-emerald-600",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    )
  },
)
RadioGroupItem.displayName = "RadioGroupItem"

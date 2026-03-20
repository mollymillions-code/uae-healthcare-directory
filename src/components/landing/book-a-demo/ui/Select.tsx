"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Utility to collect SelectItem children anywhere in the tree
function collectItems(children: React.ReactNode): { value: string; label: React.ReactNode }[] {
  const items: { value: string; label: React.ReactNode }[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    // Now TypeScript knows child.props is not unknown
    if (
      child.type &&
      typeof child.type === "function" &&
      "displayName" in child.type &&
      (child.type as { displayName?: string }).displayName === "SelectItem"
    ) {
      const { value, children: label } = (child.props as { value: string; children: React.ReactNode })
      items.push({ value, label })
    } else if (child.props && (child.props as { children?: React.ReactNode }).children) {
      items.push(...collectItems((child.props as { children?: React.ReactNode }).children))
    }
  })
  return items
}

type OnValueChange = (value: string) => void

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: OnValueChange
  className?: string
  children?: React.ReactNode
}

export const Select: React.FC<SelectProps> = ({ value, defaultValue, onValueChange, className, children }) => {
  const items = React.useMemo(() => collectItems(children), [children])
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue)
  const actualValue = value !== undefined ? value : internal

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const v = event.target.value
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
  }

  return (
    <select
      value={actualValue}
      onChange={handleChange}
      className={cn(
        "flex h-11 w-full items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-base text-slate-900",
        "transition focus:border-slate-400 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {/* Optional placeholder if no value is set */}
      {actualValue === undefined && (
        <option value="" disabled hidden>
          Select an option
        </option>
      )}
      {items.map((it) => (
        <option key={String(it.value)} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  )
}

// Compatibility components: structural only, render nothing visually.
// They allow using the same composition API as Radix Select.
export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>
SelectTrigger.displayName = "SelectTrigger"

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>
SelectContent.displayName = "SelectContent"

export const SelectValue: React.FC<{ placeholder?: string; className?: string }> = () => null
SelectValue.displayName = "SelectValue"

export const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = () => null
SelectItem.displayName = "SelectItem"

// Optional compatibility exports (not required by your imports)
export const SelectGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>
export const SelectLabel: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children }) => (
  <>{children}</>
)
export const SelectSeparator: React.FC = () => null

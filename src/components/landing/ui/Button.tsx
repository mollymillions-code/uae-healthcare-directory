"use client";
import React from "react";
import { gtag_report_conversion } from "@/lib/gtag";

const variantClasses: Record<string, string> = {
  primary: "bg-[#25D465] text-white  border border-[#34A853]",

  outline:
    "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50", // added outline
};

const sizeClasses: Record<string, string> = {
  small: "px-2 py-1 text-lg",
  medium: "px-4 py-2 text-lg",
  large: "px-6 py-3 text-2xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "link" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      className={` ${className} ${
        isDisabled ? "" : "cursor-pointer"
      } flex justify-center items-center gap-2 transition font-inter ${
        variantClasses[variant]
      } ${sizeClasses[size]}`}
      disabled={isDisabled}
      {...props}
      onClick={() => {
        gtag_report_conversion();
      }}
    >
      {loading && (
        <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full" />
      )}
      {icon && <span>{icon}</span>}
      {label || children}
    </button>
  );
};

export default Button;

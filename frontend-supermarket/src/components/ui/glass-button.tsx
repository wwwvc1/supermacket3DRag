"use client";

/**
 * 21st.dev @jahed/components/glass-button
 * 具备多层内嵌折射阴影、conic-gradient 旋转流光边框、mix-blend-mode: screen 表面斜向反光与 3D 按压倾斜 (rotateX(25deg))
 */
import * as React from "react";

export type GlassButtonSize = "sm" | "default" | "lg" | "icon";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: GlassButtonSize;
  contentClassName?: string;
  wrapClassName?: string;
}

const SIZE_TEXT_CLASSES: Record<GlassButtonSize, string> = {
  sm: "px-4 py-2 text-xs font-medium",
  default: "px-6 py-3 text-xs sm:text-sm font-semibold",
  lg: "px-8 py-4 text-sm sm:text-base font-semibold",
  icon: "p-2.5 text-sm font-medium",
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      size = "default",
       className = "",
      contentClassName = "",
      wrapClassName = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={`glass-button-wrap rounded-full ${
          disabled ? "opacity-45 pointer-events-none" : "cursor-pointer"
        } ${wrapClassName}`}
      >
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          className={`glass-button relative isolate cursor-pointer rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C8C3F2] ${className}`}
          {...props}
        >
          <span
            className={`glass-button-text pointer-events-none relative flex items-center justify-center gap-2 select-none tracking-tight ${SIZE_TEXT_CLASSES[size]} ${contentClassName}`}
          >
            {children}
          </span>
        </button>
        <div aria-hidden="true" className="glass-button-shadow pointer-events-none rounded-full" />
      </div>
    );
  }
);

GlassButton.displayName = "GlassButton";

export default GlassButton;

import React from "react"

import { cn } from "@shared/lib/utils"

type SwitchProps = React.HTMLAttributes<HTMLSpanElement> & {
  checked?: boolean
  disabled?: boolean
}

function Switch({
  checked = false,
  className,
  disabled = false,
  ...props
}: SwitchProps): React.JSX.Element {
  return (
    <span
      data-slot="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      className={cn(
        "inline-flex h-4 w-7 shrink-0 items-center rounded-full border border-transparent bg-input shadow-xs transition-colors aria-checked:bg-primary aria-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-3 rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-3" : "translate-x-0.5"
        )}
      />
    </span>
  )
}

export { Switch }

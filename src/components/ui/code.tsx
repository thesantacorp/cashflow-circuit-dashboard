
import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
}

const Code = React.forwardRef<HTMLPreElement, CodeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn(
          "rounded-md border px-4 py-3 font-mono text-sm bg-slate-950 text-slate-50 overflow-auto",
          className
        )}
        {...props}
      >
        {children}
      </pre>
    )
  }
)
Code.displayName = "Code"

export { Code }

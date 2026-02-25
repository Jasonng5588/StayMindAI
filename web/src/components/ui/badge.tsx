import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
    }
>(({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border-secondary',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        outline: 'text-foreground border-border',
        success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    }

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    )
})
Badge.displayName = "Badge"

export { Badge }

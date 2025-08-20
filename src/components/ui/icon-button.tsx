import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary-hover active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover active:scale-95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-95"
      },
      size: {
        sm: "h-8 w-8 [&_svg]:size-3.5",
        default: "h-9 w-9 [&_svg]:size-4",
        lg: "h-10 w-10 [&_svg]:size-5",
        xl: "h-12 w-12 [&_svg]:size-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        role="button"
        {...props}
      >
        {children}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
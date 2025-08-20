import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toolbarVariants = cva(
  "flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col"
      },
      size: {
        sm: "gap-0.5 p-0.5",
        default: "gap-1 p-1",
        lg: "gap-1.5 p-1.5"
      }
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "default"
    }
  }
)

export interface ToolbarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toolbarVariants> {}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, orientation, size, ...props }, ref) => (
    <div
      ref={ref}
      role="toolbar"
      className={cn(toolbarVariants({ orientation, size, className }))}
      {...props}
    />
  )
)
Toolbar.displayName = "Toolbar"

const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("mx-1 h-4 w-px bg-border", className)}
    {...props}
  />
))
ToolbarSeparator.displayName = "ToolbarSeparator"

const ToolbarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
ToolbarItem.displayName = "ToolbarItem"

export { Toolbar, ToolbarSeparator, ToolbarItem, toolbarVariants }
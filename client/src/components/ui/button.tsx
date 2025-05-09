import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] font-semibold",
  {
    variants: {
      variant: {
        default: "bg-royal-purple text-snow hover:bg-royal-purple/90 hover:scale-[1.02] shadow-sm hover:shadow-md",
        destructive:
          "bg-error text-snow hover:bg-error/90 hover:scale-[1.02] shadow-sm hover:shadow-md",
        outline:
          "border border-input bg-background hover:bg-amber/10 hover:text-amber hover:border-amber shadow-sm hover:shadow hover:scale-[1.02]",
        secondary:
          "bg-teal text-snow hover:bg-teal/90 hover:scale-[1.02] shadow-sm hover:shadow-md",
        ghost: "hover:bg-amber/10 hover:text-amber hover:scale-[1.02]",
        link: "text-royal-purple hover:text-royal-purple/80 underline-offset-4 hover:underline",
        accent: "bg-amber text-deep-indigo hover:bg-amber/90 hover:scale-[1.02] shadow-sm hover:shadow-md",
        teach: "bg-royal-purple text-snow hover:bg-royal-purple/90 hover:scale-[1.02] shadow-sm hover:shadow-md",
        learn: "bg-teal text-snow hover:bg-teal/90 hover:scale-[1.02] shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-md px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 [&_svg]:size-3.5",
        "icon-lg": "h-12 w-12 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

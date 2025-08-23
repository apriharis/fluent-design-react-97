import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  children: ReactNode;
  className?: string;
}

export const BottomSheet = ({ children, className = "" }: BottomSheetProps) => {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-fixed",
      "bg-background/95 backdrop-blur-sm border-t shadow-lg",
      "transform transition-transform duration-300 ease-out",
      className
    )}>
      <div className="container mx-auto px-4 py-3 sm:py-4">
        {children}
      </div>
    </div>
  );
};
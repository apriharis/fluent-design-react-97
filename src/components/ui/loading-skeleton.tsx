import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  variant?: 'frame-picker' | 'camera-view' | 'canvas-composer' | 'page';
  className?: string;
}

export const LoadingSkeleton = ({ variant = 'page', className = '' }: LoadingSkeletonProps) => {
  switch (variant) {
    case 'frame-picker':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto ${className}`}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="text-center">
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
      
    case 'camera-view':
      return (
        <div className={`space-y-6 ${className}`}>
          <Skeleton className="w-full aspect-[4/3] rounded-lg" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      );
      
    case 'canvas-composer':
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="flex justify-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
        </div>
      );
      
    case 'page':
    default:
      return (
        <div className={`min-h-screen bg-gradient-subtle ${className}`}>
          <div className="container mx-auto px-4 py-8 space-y-8">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      );
  }
};
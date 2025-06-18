"use client"

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const SharedChatSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-20 bg-app-main-background/80 backdrop-blur-sm border-b border-app-main-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* User message skeleton */}
          <div className="flex gap-4 justify-end">
            <div className="max-w-3xl">
              <Skeleton className="h-20 w-80 rounded-2xl rounded-br-md" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
          </div>

          {/* Assistant message skeleton */}
          <div className="flex gap-4 justify-start">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            <div className="max-w-3xl space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          </div>

          {/* User message skeleton */}
          <div className="flex gap-4 justify-end">
            <div className="max-w-3xl">
              <Skeleton className="h-16 w-64 rounded-2xl rounded-br-md" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
          </div>

          {/* Assistant message skeleton */}
          <div className="flex gap-4 justify-start">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            <div className="max-w-3xl space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="mt-12 pt-8 border-t border-app-main-border text-center">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
};

'use client';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import React, { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ProjectProvider } from "@/contexts/ProjectContext";

// Lazy load devtools to reduce bundle size and potential issues
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(module => ({
    default: module.ReactQueryDevtools
  }))
);

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <WorkspaceProvider>
                        <ProjectProvider>
                            <ThemeProvider
                                attribute="class"
                                defaultTheme="dark"
                                enableSystem={false}
                                disableTransitionOnChange
                            >
                                <TooltipProvider>
                                    <>
                                        <Toaster />
                                        <Sonner />
                                        {children}
                                    </>
                                </TooltipProvider>
                            </ThemeProvider>
                        </ProjectProvider>
                    </WorkspaceProvider>
                </AuthProvider>
                {process.env.NODE_ENV === 'development' && (
                    <Suspense fallback={null}>
                        <ReactQueryDevtools initialIsOpen={false} />
                    </Suspense>
                )}
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
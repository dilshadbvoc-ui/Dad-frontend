import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in component ${this.props.name || 'Unknown'}:`, error, errorInfo);

    // Auto-reload for Vite chunk loading errors (happens when deploying new version while users have app open)
    const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                             error?.message?.includes('Failed to fetch dynamically imported module') ||
                             error?.message?.includes('Importing a module script failed');

    if (isChunkLoadError) {
      const lastReload = parseInt(sessionStorage.getItem('chunkLoadReloadTime') || '0', 10);
      const now = Date.now();
      // Only auto-reload if we haven't done so in the last 10 seconds to prevent infinite loops
      if (now - lastReload > 10000) {
        sessionStorage.setItem('chunkLoadReloadTime', now.toString());
        // Force hard reload from server
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="h-full min-h-[200px] flex items-center justify-center bg-destructive/10 border-destructive/20">
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h3 className="font-semibold text-destructive">Component Error</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {this.props.name ? `Failed to load ${this.props.name}` : 'Something went wrong'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

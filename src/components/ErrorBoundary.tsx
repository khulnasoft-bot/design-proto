import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore Error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
          <div className="max-w-md w-full p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-center">
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isFirestoreError 
                  ? "A database operation failed. This could be due to permission restrictions or a connection issue."
                  : "The application encountered an error. We've been notified and are working on it."}
              </p>
            </div>

            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50 text-left">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Error Details</p>
              <p className="text-xs font-mono text-red-400 break-words line-clamp-3">
                {errorMessage}
              </p>
            </div>

            <Button 
              onClick={this.handleReset}
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-xl py-6"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Restart Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

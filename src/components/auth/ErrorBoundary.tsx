import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('FSM Application Error Boundary caught an exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="glass-panel-glow max-w-md w-full p-8 rounded-3xl border border-rose-500/40 text-center space-y-4 shadow-2xl">
            <div className="inline-flex p-4 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Dashboard Render Fallback</h2>
            <p className="text-xs text-slate-400 font-medium">
              An unexpected error occurred while loading dashboard telemetry streams. You can refresh or return to login.
            </p>
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" /> Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

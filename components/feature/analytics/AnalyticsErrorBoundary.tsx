'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { trackException } from '@/lib/analytics';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

/** Catches React render errors and reports them to analytics / client-error API. */
export class AnalyticsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    trackException(error.message || 'React render error', true, {
      type: 'react_boundary',
      component_stack: info.componentStack?.slice(0, 300),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-lg p-8 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page. If this keeps happening, contact support.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

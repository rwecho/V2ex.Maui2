import { Component } from "react";
import ErrorDebugScreen, { CapturedError } from "./ErrorDebugScreen";

type Props = {
  children: React.ReactNode;
  onFatal?: (error: CapturedError) => void;
};

type State = {
  error: CapturedError | null;
};

export default class FatalErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const e = error as any;
    return {
      error: {
        name: e?.name,
        message: String(e?.message ?? e ?? "Unknown error"),
        stack: e?.stack,
        timestamp: Date.now(),
        source: "react-error-boundary",
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
    };
  }

  componentDidCatch(error: unknown, info: any) {
    const componentStack = info?.componentStack;
    this.setState((s) => {
      if (!s.error) return s;
      const next = { ...s.error, componentStack };
      try {
        this.props.onFatal?.(next);
      } catch {
        // ignore
      }
      return { error: next };
    });
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorDebugScreen
          error={this.state.error}
          onReload={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react";

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
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#faf7f5",
          fontFamily: "'Poppins', sans-serif",
          color: "#2a1e1e",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.75rem", color: "#8a1c1c" }}>
            Império Açaí
          </h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "#666" }}>
            Ocorreu um problema ao renderizar a página.
          </p>
          <div style={{
            background: "#fff",
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            maxWidth: "480px",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            color: "#8a1c1c"
          }}>
            {this.state.error?.message || "Erro desconhecido"}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#8a1c1c",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.75rem",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(138, 28, 28, 0.3)"
            }}
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

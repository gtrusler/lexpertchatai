import React from 'react';
import ErrorDisplay from '../common/ErrorDisplay';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class DocumentsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('[DocumentsErrorBoundary] Error caught:', error);
    console.error('[DocumentsErrorBoundary] Error info:', errorInfo);
  }
  
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  }
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render fallback UI with detailed error information
      return <ErrorDisplay error={this.state.error} resetError={this.resetError} />;
    }
    
    return this.props.children;
  }
}

export default DocumentsErrorBoundary; 
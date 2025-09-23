import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-5 text-center">
          <div className={cn(
            "relative rounded-lg border p-4",
            "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
          )}>
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Something went wrong
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>An error occurred while rendering this component.</p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-2.5 text-left">
                      <summary className="cursor-pointer hover:underline">
                        Error Details
                      </summary>
                      <pre className={cn(
                        "mt-2 overflow-auto rounded",
                        "bg-gray-100 dark:bg-gray-900",
                        "p-2.5 text-xs",
                        "border border-gray-200 dark:border-gray-800"
                      )}>
                        {this.state.error.toString()}
                        {this.state.errorInfo && (
                          <>
                            <br />
                            <br />
                            {this.state.errorInfo.componentStack}
                          </>
                        )}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={this.handleReload}
                    className="inline-flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo } = this.state;

            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={error!} reset={() => this.setState({ hasError: false, error: null, errorInfo: null })} />;
            }

            return (
                <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
                    <Card className="max-w-2xl w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-destructive" />
                                <CardTitle className="text-destructive">Something went wrong!</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <h3 className="font-semibold text-destructive mb-2">Error Details:</h3>
                                <p className="text-sm font-mono break-all">{error?.message}</p>
                            </div>

                            {error?.stack && (
                                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-64">
                                    <h4 className="text-white mb-2">Stack Trace:</h4>
                                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                                </div>
                            )}

                            {errorInfo && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Component Stack:</h4>
                                    <pre className="text-xs text-blue-700 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const errorText = `Error: ${error?.message}\n\nStack Trace:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
                                        navigator.clipboard.writeText(errorText);
                                        alert('Error details copied to clipboard!');
                                    }}
                                    className="gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Error
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
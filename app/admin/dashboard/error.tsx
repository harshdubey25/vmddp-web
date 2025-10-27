'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    AlertTriangle,
    RefreshCw,
    Home,
    Bug,
    Clock,
    Code,
    ExternalLink,
    Copy,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
    error: Error & {
        digest?: string;
        exception?: any;
        exc_type?: string;
        exc?: any;
        _server_messages?: any;
        httpStatus?: number;
        httpStatusText?: string;
        [key: string]: any; // Allow any additional properties
    };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [showFullErrorObject, setShowFullErrorObject] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{
        timestamp: string;
        userAgent: string;
        url: string;
        stack: string;
        name: string;
        message: string;
        digest?: string;
        fullErrorObject: any;
        parsedErrorData?: any;
        rawErrorString?: string;
    } | null>(null);

    useEffect(() => {
        // Gather comprehensive error information
        let parsedErrorData = null;
        let rawErrorString = '';

        // Try to parse the error message as JSON if it's a stringified object
        try {
            if (error.message && error.message.startsWith('{')) {
                parsedErrorData = JSON.parse(error.message);
                rawErrorString = error.message;
            }
        } catch (e) {
            // If parsing fails, just use the original error
        }

        const errorDetails = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            stack: error.stack || 'No stack trace available',
            name: error.name || 'Unknown Error',
            message: error.message || 'No error message available',
            digest: error.digest,
            fullErrorObject: error, // Store the complete error object
            parsedErrorData: parsedErrorData, // Store parsed JSON if available
            rawErrorString: rawErrorString // Store raw JSON string
        };

        setErrorInfo(errorDetails);

        // Log error to console for debugging
        console.group('🚨 Error Details');
        console.error('Full Error Object:', error);
        console.error('Error Message (raw):', error.message);
        if (parsedErrorData) {
            console.error('Parsed Error Data:', parsedErrorData);
        }
        console.error('Error Properties:', Object.keys(error));
        console.table(errorDetails);
        console.groupEnd();

        // Optional: Send error to logging service
        // logErrorToService(errorDetails);
    }, [error]);

    const copyErrorToClipboard = async () => {
        if (!errorInfo) return;

        // Create comprehensive error report including full object
        const fullErrorReport = JSON.stringify(errorInfo.fullErrorObject, null, 2);

        const errorText = `
ERROR REPORT
============
Timestamp: ${errorInfo.timestamp}
URL: ${errorInfo.url}
Error Name: ${errorInfo.name}
Error Message: ${errorInfo.message}
Digest: ${errorInfo.digest || 'N/A'}

User Agent: ${errorInfo.userAgent}

Stack Trace:
${errorInfo.stack}

FULL ERROR OBJECT:
${fullErrorReport}
        `.trim();

        try {
            await navigator.clipboard.writeText(errorText);
            alert('Error details copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const getErrorSeverity = (errorName: string) => {
        const criticalErrors = ['ChunkLoadError', 'SyntaxError', 'ReferenceError'];
        const warningErrors = ['TypeError', 'RangeError'];

        if (criticalErrors.includes(errorName)) return 'critical';
        if (warningErrors.includes(errorName)) return 'warning';
        return 'error';
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'warning': return 'secondary';
            default: return 'outline';
        }
    };

    if (!errorInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const severity = getErrorSeverity(errorInfo.name);

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-destructive mb-2">
                            Something went wrong!
                        </h1>
                        <p className="text-muted-foreground">
                            An unexpected error occurred in the dashboard. Our team has been notified.
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={reset} className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Button>
                            <Link href="/admin/dashboard">
                                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                    <Home className="w-4 h-4" />
                                    Go to Dashboard
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={copyErrorToClipboard}
                                className="gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy Error Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Summary */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bug className="w-5 h-5" />
                                <CardTitle>Error Summary</CardTitle>
                                <Badge variant={getSeverityColor(severity)}>
                                    {severity.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {new Date(errorInfo.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{errorInfo.name}</AlertTitle>
                            <AlertDescription className="mt-2">
                                {errorInfo.message}
                            </AlertDescription>
                        </Alert>

                        {errorInfo.digest && (
                            <div className="flex items-center gap-2 text-sm">
                                <Code className="w-4 h-4" />
                                <span className="text-muted-foreground">Error Digest:</span>
                                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                    {errorInfo.digest}
                                </code>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Error Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ExternalLink className="w-5 h-5" />
                                Technical Details
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDetails(!showDetails)}
                                className="gap-2"
                            >
                                {showDetails ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        Hide Details
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        Show Details
                                    </>
                                )}
                            </Button>
                        </div>
                        <CardDescription>
                            Technical information for debugging and support
                        </CardDescription>
                    </CardHeader>

                    {showDetails && (
                        <CardContent className="space-y-4">
                            {/* Environment Info */}
                            <div>
                                <h4 className="font-semibold mb-2">Environment</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">URL:</span>
                                        <p className="font-mono text-xs break-all">{errorInfo.url}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Timestamp:</span>
                                        <p className="font-mono text-xs">{errorInfo.timestamp}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* User Agent */}
                            <div>
                                <h4 className="font-semibold mb-2">Browser Information</h4>
                                <p className="font-mono text-xs bg-muted p-3 rounded break-all">
                                    {errorInfo.userAgent}
                                </p>
                            </div>

                            <Separator />

                            {/* Stack Trace */}
                            <div>
                                <h4 className="font-semibold mb-2">Stack Trace</h4>
                                <div className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-96">
                                    <pre className="whitespace-pre-wrap">{errorInfo.stack}</pre>
                                </div>
                            </div>

                            <Separator />

                            {/* Full Error Object */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Full Error Object</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowFullErrorObject(!showFullErrorObject)}
                                        className="gap-2"
                                    >
                                        {showFullErrorObject ? (
                                            <>
                                                <ChevronUp className="w-4 h-4" />
                                                Hide Object
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4" />
                                                Show Object
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {showFullErrorObject && (
                                    <>
                                        {/* Raw Error Message (if it's a JSON string) */}
                                        {errorInfo.rawErrorString && (
                                            <div className="mb-4">
                                                <h5 className="text-sm font-medium mb-2">Raw Error Message (JSON String):</h5>
                                                <div className="bg-red-900 text-red-100 p-4 rounded font-mono text-xs overflow-auto max-h-64">
                                                    <pre className="whitespace-pre-wrap">{errorInfo.rawErrorString}</pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* Parsed Error Data */}
                                        {errorInfo.parsedErrorData && (
                                            <div className="mb-4">
                                                <h5 className="text-sm font-medium mb-2">Parsed Frappe Error Data:</h5>

                                                {/* Key Frappe properties overview */}
                                                <div className="grid grid-cols-1 gap-2 text-xs mb-4">
                                                    {errorInfo.parsedErrorData.exception && (
                                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-500">
                                                            <strong className="text-red-700 dark:text-red-300">Exception:</strong>
                                                            <div className="mt-1 font-mono text-red-600 dark:text-red-200">
                                                                {errorInfo.parsedErrorData.exception}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {errorInfo.parsedErrorData.exc_type && (
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
                                                            <strong className="text-orange-700 dark:text-orange-300">Exception Type:</strong>
                                                            <div className="mt-1 font-mono text-orange-600 dark:text-orange-200">
                                                                {errorInfo.parsedErrorData.exc_type}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {errorInfo.parsedErrorData.exc && (
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
                                                            <strong className="text-yellow-700 dark:text-yellow-300">Stack Trace:</strong>
                                                            <div className="mt-1 font-mono text-xs text-yellow-600 dark:text-yellow-200 max-h-32 overflow-auto">
                                                                <pre className="whitespace-pre-wrap">
                                                                    {Array.isArray(errorInfo.parsedErrorData.exc)
                                                                        ? errorInfo.parsedErrorData.exc.join('\n')
                                                                        : errorInfo.parsedErrorData.exc}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {errorInfo.parsedErrorData._server_messages && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-500">
                                                            <strong className="text-blue-700 dark:text-blue-300">Server Messages:</strong>
                                                            <div className="mt-1 font-mono text-xs text-blue-600 dark:text-blue-200 max-h-32 overflow-auto">
                                                                <pre className="whitespace-pre-wrap">
                                                                    {errorInfo.parsedErrorData._server_messages}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(errorInfo.parsedErrorData.httpStatus || errorInfo.parsedErrorData.httpStatusText) && (
                                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border-l-4 border-purple-500">
                                                            <strong className="text-purple-700 dark:text-purple-300">HTTP Status:</strong>
                                                            <div className="mt-1 font-mono text-purple-600 dark:text-purple-200">
                                                                {errorInfo.parsedErrorData.httpStatus} - {errorInfo.parsedErrorData.httpStatusText}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Complete parsed JSON */}
                                                <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-auto max-h-96">
                                                    <pre className="whitespace-pre-wrap">
                                                        {JSON.stringify(errorInfo.parsedErrorData, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* Original error object properties */}
                                        {!errorInfo.parsedErrorData && (
                                            <>
                                                {/* Quick properties overview */}
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-medium mb-2">Key Properties:</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                        {errorInfo.fullErrorObject.exception && (
                                                            <div className="bg-red-50 p-2 rounded">
                                                                <strong>exception:</strong> {String(errorInfo.fullErrorObject.exception)}
                                                            </div>
                                                        )}
                                                        {errorInfo.fullErrorObject.exc_type && (
                                                            <div className="bg-orange-50 p-2 rounded">
                                                                <strong>exc_type:</strong> {errorInfo.fullErrorObject.exc_type}
                                                            </div>
                                                        )}
                                                        {errorInfo.fullErrorObject.exc && (
                                                            <div className="bg-yellow-50 p-2 rounded">
                                                                <strong>exc:</strong> {String(errorInfo.fullErrorObject.exc)}
                                                            </div>
                                                        )}
                                                        {errorInfo.fullErrorObject._server_messages && (
                                                            <div className="bg-blue-50 p-2 rounded">
                                                                <strong>_server_messages:</strong> {String(errorInfo.fullErrorObject._server_messages)}
                                                            </div>
                                                        )}
                                                        {errorInfo.fullErrorObject.httpStatus && (
                                                            <div className="bg-purple-50 p-2 rounded">
                                                                <strong>httpStatus:</strong> {errorInfo.fullErrorObject.httpStatus}
                                                            </div>
                                                        )}
                                                        {errorInfo.fullErrorObject.httpStatusText && (
                                                            <div className="bg-green-50 p-2 rounded">
                                                                <strong>httpStatusText:</strong> {errorInfo.fullErrorObject.httpStatusText}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Complete original error object */}
                                        <div className="mb-4">
                                            <h5 className="text-sm font-medium mb-2">Complete Error Object:</h5>
                                            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-auto max-h-96">
                                                <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(errorInfo.fullErrorObject, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Helpful Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>What can you do?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold">Immediate Actions</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Refresh the page to try again</li>
                                    <li>• Clear your browser cache</li>
                                    <li>• Try a different browser</li>
                                    <li>• Check your internet connection</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">If the problem persists</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Copy the error report above</li>
                                    <li>• Contact the development team</li>
                                    <li>• Report the issue with steps to reproduce</li>
                                    <li>• Include the error digest if available</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
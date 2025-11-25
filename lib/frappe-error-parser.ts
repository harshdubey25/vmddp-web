/**
 * Parse Frappe error response to extract clean error message and title
 * @param error - The error object from Frappe API
 * @param defaultTitle - Default title if none found in error
 * @param defaultMessage - Default message if none found in error
 * @returns Object with title and message
 */
export function parseFrappeError(
    error: any,
    defaultTitle: string = 'Error',
    defaultMessage: string = 'An error occurred. Please try again.'
): { title: string; message: string } {
    let errorMessage = defaultMessage;
    let errorTitle = defaultTitle;

    // Try to parse _server_messages for a cleaner error (highest priority)
    if (error._server_messages) {
        try {
            const serverMessages = JSON.parse(error._server_messages);
            if (Array.isArray(serverMessages) && serverMessages.length > 0) {
                const parsedMessage = JSON.parse(serverMessages[0]);
                errorMessage = parsedMessage.message || errorMessage;
                errorTitle = parsedMessage.title || errorTitle;
                return { title: errorTitle, message: errorMessage };
            }
        } catch (parseError) {
            console.error('Failed to parse server messages:', parseError);
        }
    }

    // Fallback: try to extract from exception field
    if (error.exception) {
        const exceptionText = error.exception;
        // Remove "frappe.exceptions.ValidationError: " or similar prefix
        const match = exceptionText.match(/:\s*(.+)$/);
        if (match) {
            errorMessage = match[1];
            return { title: errorTitle, message: errorMessage };
        }
    }

    // Fallback: use error.message if available
    if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
    }

    return { title: errorTitle, message: errorMessage };
}

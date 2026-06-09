/**
 * Formats a date into a relative time string (e.g., "2m ago", "3h ago", "1d ago")
 */
export const formatTimeAgo = (dateInput: string | Date | number): string => {
    const createdDate = new Date(dateInput);
    if (isNaN(createdDate.getTime())) return 'N/A';

    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return `${diffMonths}mo ago`;
};

/**
 * Formats a date into expiry format (e.g., "05/2026")
 */
export const formatExpiryDate = (dateInput: string | Date | number): string => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Formats a date into a human-readable string (e.g., "Oct 12, 09:30 AM")
 */
export const formatOrderDate = (dateInput: string | Date | number): string => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

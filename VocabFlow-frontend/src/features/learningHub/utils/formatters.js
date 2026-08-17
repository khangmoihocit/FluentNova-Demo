/**
 * Format seconds into a human-readable duration string
 * @param {number} totalSeconds
 * @returns {string} e.g. "2h 15m" or "45m" or "0m"
 */
export const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0 || result === '') result += `${seconds}s`;
    
    return result.trim();
};

/**
 * Format seconds into detailed minutes count
 * @param {number} totalSeconds
 * @returns {string} e.g. "135 phút"
 */
export const formatMinutes = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0';
    return Math.floor(totalSeconds / 60).toString();
};

/**
 * Format a datetime string into relative time (e.g. "2 giờ trước", "Hôm qua")
 * @param {string} dateStr - ISO datetime string
 * @returns {string}
 */
export const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Format large numbers to human-readable strings
 * e.g. 1200 -> "1.2k", 1500000 -> "1.5M"
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number string
 */
export const formatMetricNumber = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(decimals) + 'k';
  } else {
    return num.toString();
  }
};

/**
 * Format number with thousands separator
 * e.g. 1200 -> "1,200"
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString();
};

export default { formatMetricNumber, formatNumber };

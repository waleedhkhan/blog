/**
 * Format a date in a consistent way across the site
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted date
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

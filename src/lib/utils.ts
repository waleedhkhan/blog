/**
 * Utility functions for Vue components
 */

type ClassValue = string | Record<string, boolean> | ClassValue[] | undefined | null;

/**
 * Combines multiple class names
 * @param {ClassValue[]} classes - Classes to combine
 * @returns {string} Combined class string
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];
  
  classes.forEach(cls => {
    if (!cls) return;
    
    if (typeof cls === 'string') {
      result.push(cls);
    } else if (Array.isArray(cls)) {
      result.push(cn(...cls));
    } else if (typeof cls === 'object') {
      Object.entries(cls).forEach(([key, value]) => {
        if (value) result.push(key);
      });
    }
  });
  
  return result.join(' ');
}

/**
 * Formats a date string into a human-readable format
 * @param {string | Date} date - The date to format 
 * @param {Intl.DateTimeFormatOptions} [options] - Optional formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  const mergedOptions: Intl.DateTimeFormatOptions = { ...defaultOptions, ...options };
  
  return new Date(date).toLocaleDateString('en-US', mergedOptions);
}

/**
 * Safely truncates text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} [length=100] - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text: string, length: number = 100): string {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.slice(0, length) + '...';
}

/**
 * Generates a slug from a string
 * @param {string} text - The text to slugify
 * @returns {string} URL-friendly slug
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/&/g, '-and-')    // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')  // Remove all non-word characters
    .replace(/\-\-+/g, '-');   // Replace multiple - with single -
}

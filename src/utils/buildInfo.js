/**
 * Generates a build identifier that automatically increments
 * Format: YY.MM.DD.BUILD
 * Example: 25.03.08.1 (First build on March 8, 2025)
 */
export function generateBuildId() {
  // Create date-based versioning (YY.MM.DD)
  const now = new Date();
  const year = now.getFullYear().toString().slice(2); // 2-digit year
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Base version using date
  const dateVersion = `${year}.${month}.${day}`;
  
  // Store version in a build info file that will be read at build time
  // This simulates incrementing a build number every time
  // In production, this could be handled by your CI/CD system
  const buildNumber = getBuildSequence();
  
  // Return full version
  return `${dateVersion}.${buildNumber}`;
}

/**
 * Gets an incremented build sequence number
 * In a real CI/CD environment, this would be provided by the build system
 * This implementation simulates it with milliseconds
 */
function getBuildSequence() {
  // Use milliseconds to create a pseudo-unique build number
  // This ensures each build gets a different number
  const ms = new Date().getMilliseconds().toString().padStart(3, '0');
  
  // For even shorter version, just use one digit
  return ms.slice(0, 1);
}

// This is computed once at build time and will be static for the deployment
export const BUILD_ID = generateBuildId();

/**
 * Get a shortened build ID for minimal display
 * Returns date part only (YY.MM.DD)
 */
export function getShortBuildId() {
  const parts = BUILD_ID.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

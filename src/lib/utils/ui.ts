/**
 * UI utility functions for consistent visual elements
 */

/**
 * Brand gradient presets for cards and backgrounds without hero images.
 * Uses a hash of the name to consistently pick the same gradient for a given item.
 */
const BRAND_GRADIENTS = [
  "from-brand-navy-800 via-brand-navy-700 to-brand-sky-900",
  "from-emerald-800 via-teal-700 to-brand-navy-900",
  "from-amber-700 via-orange-600 to-red-800",
  "from-purple-800 via-violet-700 to-brand-navy-900",
  "from-rose-700 via-pink-600 to-purple-800",
  "from-brand-sky-700 via-cyan-600 to-teal-700",
  "from-slate-800 via-zinc-700 to-stone-800",
  "from-indigo-800 via-blue-700 to-brand-navy-900",
] as const;

/**
 * Generate a consistent gradient based on a string (e.g., race name).
 * Always returns the same gradient for the same input string.
 *
 * @param name - String to hash for gradient selection
 * @returns Tailwind gradient classes (from-X via-Y to-Z)
 */
export function generateGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRAND_GRADIENTS[Math.abs(hash) % BRAND_GRADIENTS.length]!;
}

/**
 * Get all available brand gradients
 */
export function getBrandGradients(): readonly string[] {
  return BRAND_GRADIENTS;
}

/**
 * Parse a date string (YYYY-MM-DD) as local time to avoid timezone issues.
 * When JS parses "2025-08-08" it treats it as UTC midnight, which displays
 * as the previous day in US timezones. This function parses as local time.
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

/**
 * Format a date range for display.
 * If dates are in the same month and year: "June 27-28, 2026"
 * If dates span months: "June 27 - July 2, 2026"
 * If single date: "June 27, 2026"
 */
export function formatDateRange(dates: (string | null)[]): string | null {
  // Filter out null dates and parse them as local time
  const validDates = dates
    .filter((d): d is string => d !== null)
    .map((d) => parseLocalDate(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length === 0) return null;

  const firstDate = validDates[0]!;
  const lastDate = validDates[validDates.length - 1]!;

  // Single date or all dates are the same
  if (validDates.length === 1 || firstDate.getTime() === lastDate.getTime()) {
    return firstDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const sameYear = firstDate.getFullYear() === lastDate.getFullYear();
  const sameMonth = sameYear && firstDate.getMonth() === lastDate.getMonth();

  if (sameMonth) {
    // Same month: "June 27-28, 2026"
    const month = firstDate.toLocaleDateString("en-US", { month: "long" });
    return `${month} ${firstDate.getDate()}-${lastDate.getDate()}, ${firstDate.getFullYear()}`;
  } else if (sameYear) {
    // Different months, same year: "June 27 - July 2, 2026"
    const firstFormatted = firstDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const lastFormatted = lastDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    return `${firstFormatted} - ${lastFormatted}, ${firstDate.getFullYear()}`;
  } else {
    // Different years: "December 31, 2025 - January 1, 2026"
    const firstFormatted = firstDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const lastFormatted = lastDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return `${firstFormatted} - ${lastFormatted}`;
  }
}

/**
 * Format a single date for short display (e.g., "Mar 15")
 */
export function formatDateShort(date: string | null): string | null {
  if (!date) return null;
  return parseLocalDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a single date with year (e.g., "Mar 15, 2026")
 */
export function formatDateWithYear(date: string | null): string | null {
  if (!date) return null;
  return parseLocalDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a single date with long month and year (e.g., "March 15, 2026")
 */
export function formatDateLong(date: string | null): string | null {
  if (!date) return null;
  return parseLocalDate(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

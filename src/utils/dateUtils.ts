/**
 * Calculate duration from a start date string to now
 * @param startDateStr - Date string in format "Mon YYYY" (e.g., "Mar 2023")
 * @returns Formatted duration string (e.g., "2 yrs 11 mos")
 */
export function calculateDuration(startDateStr: string): string {
  // Parse date string like "Mar 2023"
  const [month, year] = startDateStr.trim().split(' ');
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const startDate = new Date(parseInt(year), monthMap[month], 1);
  const now = new Date();

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0) {
    return "Less than 1 month";
  } else if (years === 0) {
    return months === 1 ? "1 mo" : `${months} mos`;
  } else if (months === 0) {
    return years === 1 ? "1 yr" : `${years} yrs`;
  } else {
    const yearStr = years === 1 ? "1 yr" : `${years} yrs`;
    const monthStr = months === 1 ? "1 mo" : `${months} mos`;
    return `${yearStr} ${monthStr}`;
  }
}

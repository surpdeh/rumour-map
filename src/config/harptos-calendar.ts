/**
 * Harptos Calendar for Forgotten Realms
 * Reference: https://forgottenrealms.fandom.com/wiki/Calendar_of_Harptos
 * 
 * The Calendar of Harptos has:
 * - 12 months of 30 days each (360 days)
 * - 5 annual festivals (inter-month days)
 * - 1 leap year day (Shieldmeet) every 4 years
 * Total: 365 days (366 in leap years)
 */

export interface HarptosMonth {
  name: string
  commonName: string
  season: string
  daysInMonth: 30
}

export interface HarptosSpecialDay {
  name: string
  type: 'festival' | 'leap'
  afterMonth: number | null // null for first day of year
  description: string
}

/**
 * The 12 months of Harptos
 */
export const HARPTOS_MONTHS: HarptosMonth[] = [
  { name: 'Hammer', commonName: 'Deepwinter', season: 'Winter', daysInMonth: 30 },
  { name: 'Alturiak', commonName: 'The Claw of Winter', season: 'Winter', daysInMonth: 30 },
  { name: 'Ches', commonName: 'The Claw of the Sunsets', season: 'Spring', daysInMonth: 30 },
  { name: 'Tarsakh', commonName: 'The Claw of the Storms', season: 'Spring', daysInMonth: 30 },
  { name: 'Mirtul', commonName: 'The Melting', season: 'Spring', daysInMonth: 30 },
  { name: 'Kythorn', commonName: 'The Time of Flowers', season: 'Summer', daysInMonth: 30 },
  { name: 'Flamerule', commonName: 'Summertide', season: 'Summer', daysInMonth: 30 },
  { name: 'Eleasis', commonName: 'Highsun', season: 'Summer', daysInMonth: 30 },
  { name: 'Eleint', commonName: 'The Fading', season: 'Autumn', daysInMonth: 30 },
  { name: 'Marpenoth', commonName: 'Leaffall', season: 'Autumn', daysInMonth: 30 },
  { name: 'Uktar', commonName: 'The Rotting', season: 'Autumn', daysInMonth: 30 },
  { name: 'Nightal', commonName: 'The Drawing Down', season: 'Winter', daysInMonth: 30 }
]

/**
 * Special days (festivals and leap day) in the Harptos calendar
 */
export const HARPTOS_SPECIAL_DAYS: HarptosSpecialDay[] = [
  {
    name: 'Midwinter',
    type: 'festival',
    afterMonth: 0, // After Hammer (month index 0)
    description: 'Annual festival between Hammer and Alturiak'
  },
  {
    name: 'Greengrass',
    type: 'festival',
    afterMonth: 4, // After Mirtul (month index 4)
    description: 'Spring festival between Mirtul and Kythorn'
  },
  {
    name: 'Midsummer',
    type: 'festival',
    afterMonth: 6, // After Flamerule (month index 6)
    description: 'Summer festival between Flamerule and Eleasis'
  },
  {
    name: 'Shieldmeet',
    type: 'leap',
    afterMonth: 6, // After Flamerule, after Midsummer (only in leap years)
    description: 'Leap day occurring once every 4 years, after Midsummer'
  },
  {
    name: 'Highharvestide',
    type: 'festival',
    afterMonth: 8, // After Eleint (month index 8)
    description: 'Autumn festival between Eleint and Marpenoth'
  },
  {
    name: 'The Feast of the Moon',
    type: 'festival',
    afterMonth: 10, // After Uktar (month index 10)
    description: 'Winter festival between Uktar and Nightal'
  }
]

/**
 * Check if a year is a leap year (Shieldmeet occurs)
 * In Forgotten Realms, Shieldmeet occurs every 4 years
 */
export function isLeapYear(year: number): boolean {
  return year % 4 === 0
}

/**
 * Generate a formatted date string for Harptos calendar
 * @param day - Day of the month (1-30)
 * @param monthIndex - Index of the month (0-11)
 * @param year - Year in Dale Reckoning
 * @returns Formatted date string
 */
export function formatHarptosDate(day: number, monthIndex: number, year: number): string {
  const month = HARPTOS_MONTHS[monthIndex]
  return `${day} ${month.name}, ${year} DR`
}

/**
 * Generate a list of days for a given month (1-30)
 */
export function getMonthDays(): number[] {
  return Array.from({ length: 30 }, (_, i) => i + 1)
}

/**
 * Get year range for picker (default: 1350 DR to 1500 DR)
 * Can be customized based on campaign setting
 */
export function getYearRange(startYear: number = 1350, endYear: number = 1500): number[] {
  const years: number[] = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  return years
}

/**
 * Parse a Harptos date string back to components
 * Supports formats like:
 * - "15 Hammer, 1492 DR"
 * - "Midsummer, 1492 DR"
 * - "15 Hammer 1492"
 */
export function parseHarptosDate(dateStr: string | null): {
  day: number | null
  monthIndex: number | null
  year: number | null
  specialDay: string | null
} | null {
  if (!dateStr) return null

  const result = {
    day: null as number | null,
    monthIndex: null as number | null,
    year: null as number | null,
    specialDay: null as string | null
  }

  // Try to extract year (look for 3-4 digit number)
  const yearMatch = dateStr.match(/\b(\d{3,4})\b/)
  if (yearMatch) {
    result.year = parseInt(yearMatch[1], 10)
  }

  // Check for special days
  for (const specialDay of HARPTOS_SPECIAL_DAYS) {
    if (dateStr.toLowerCase().includes(specialDay.name.toLowerCase())) {
      result.specialDay = specialDay.name
      return result
    }
  }

  // Check for month names
  for (let i = 0; i < HARPTOS_MONTHS.length; i++) {
    const month = HARPTOS_MONTHS[i]
    if (dateStr.toLowerCase().includes(month.name.toLowerCase())) {
      result.monthIndex = i
      
      // Try to extract day number before month name
      const dayMatch = dateStr.match(/\b(\d{1,2})\s+/i)
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10)
        if (day >= 1 && day <= 30) {
          result.day = day
        }
      }
      break
    }
  }

  return result
}

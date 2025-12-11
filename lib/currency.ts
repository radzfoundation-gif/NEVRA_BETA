/**
 * Currency detection and conversion utilities
 * Auto-detects user location and converts pricing accordingly
 */

export interface CurrencyInfo {
  currency: 'USD' | 'IDR';
  country: string;
  countryCode: string;
  exchangeRate?: number;
}

// Exchange rate (can be updated from API)
const USD_TO_IDR = 16000; // Approximate rate, should be fetched from API in production

/**
 * Detect user location and currency from IP
 */
export async function detectCurrency(): Promise<CurrencyInfo> {
  try {
    // Try multiple free IP geolocation services
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) continue;

        const data = await response.json();

        // ipapi.co format
        if (data.country_code) {
          const countryCode = data.country_code.toUpperCase();
          if (countryCode === 'ID') {
            return {
              currency: 'IDR',
              country: data.country_name || 'Indonesia',
              countryCode: 'ID',
              exchangeRate: USD_TO_IDR,
            };
          }
          return {
            currency: 'USD',
            country: data.country_name || 'Unknown',
            countryCode,
          };
        }

        // ip-api.com format
        if (data.countryCode) {
          const countryCode = data.countryCode.toUpperCase();
          if (countryCode === 'ID') {
            return {
              currency: 'IDR',
              country: data.country || 'Indonesia',
              countryCode: 'ID',
              exchangeRate: USD_TO_IDR,
            };
          }
          return {
            currency: 'USD',
            country: data.country || 'Unknown',
            countryCode,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${service}:`, error);
        continue;
      }
    }

    // Fallback to USD if all services fail
    return {
      currency: 'USD',
      country: 'Unknown',
      countryCode: 'US',
    };
  } catch (error) {
    console.error('Error detecting currency:', error);
    // Default to USD
    return {
      currency: 'USD',
      country: 'Unknown',
      countryCode: 'US',
    };
  }
}

/**
 * Convert USD to IDR
 */
export function convertToIDR(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_IDR);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: 'USD' | 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get pricing for premium plan based on currency
 */
export function getPremiumPricing(currency: 'USD' | 'IDR'): { amount: number; formatted: string } {
  const usdPrice = 3;
  
  if (currency === 'IDR') {
    const idrPrice = convertToIDR(usdPrice);
    return {
      amount: idrPrice,
      formatted: formatCurrency(idrPrice, 'IDR'),
    };
  }

  return {
    amount: usdPrice,
    formatted: formatCurrency(usdPrice, 'USD'),
  };
}

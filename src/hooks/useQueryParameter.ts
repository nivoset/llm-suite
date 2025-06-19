import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * A hook that works like useState but uses URL query parameters
 * @param paramName The name of the query parameter
 * @param defaultValue The default value to use if the parameter is not present
 * @returns [value, setValue] tuple like useState
 */
export function useQueryParameter(paramName: string, defaultValue: string): [string, (newValue: string) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current value
  const value = searchParams.get(paramName) ?? defaultValue;
  
  // Create setter function
  const setValue = useCallback((newValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, newValue);
    
    // Update URL without refreshing the page
    router.push(`?${params.toString()}`, { scroll: false });
  }, [paramName, router, searchParams]);

  return [value, setValue];
} 
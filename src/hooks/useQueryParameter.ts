import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SetValue<T> = (newValue: T | ((prevValue: T) => T)) => void;

/**
 * A hook that works like useState but uses URL query parameters
 * @param paramName The name of the query parameter
 * @param defaultValue The default value to use if the parameter is not present
 * @returns [value, setValue] tuple like useState
 */
export function useQueryParameter(paramName: string, defaultValue: string): [string, SetValue<string>] {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current value
  const value = searchParams.get(paramName) ?? defaultValue;
  
  // Create setter function
  const setValue = useCallback((newValue: string | ((prevValue: string) => string)) => {
    const currentValue = searchParams.get(paramName) ?? defaultValue;
    const valueToSet = typeof newValue === 'function' ? newValue(currentValue) : newValue;

    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, valueToSet);
    
    // Update URL without refreshing the page
    router.push(`?${params.toString()}`, { scroll: false });
  }, [paramName, router, searchParams, defaultValue]);

  return [value, setValue];
} 
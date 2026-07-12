import { useState, useEffect, useRef, useCallback } from 'react';

// Generic async data fetcher — provides loading, error, data, and refetch.
// deps array controls when the fetch re-runs (like useEffect deps).
// Every async view uses this so loading/empty/error states are consistent.
export function useFetch(fetchFn, params, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store fetchFn in a ref so it doesn't cause re-runs if referentially unstable
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  // Store params in a ref to always have the latest value without it being a dep
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRef.current(paramsRef.current);
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Debounce hook for search inputs — prevents hammering API on every keystroke
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

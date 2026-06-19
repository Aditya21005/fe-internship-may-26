import { useState, useEffect, useRef } from 'react'
import type { Item } from '../types'
import { searchItems } from '../services/mockApi'

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: Item[]
  isLoading: boolean
  error: string | null
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref to track whether the component is still mounted
  const mountedRef = useRef(true)
  // Ref to track the latest request, so stale responses are discarded
  const requestIdRef = useRef(0)

  useEffect(() => {
    // Cleanup on unmount: mark component as unmounted
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // If query is empty, show all items immediately (no debounce needed)
    if (query.trim().length === 0) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    // Set loading state before scheduling debounce
    setIsLoading(true)
    setError(null)

    // Debounce: wait 300ms after user stops typing
    const timerId = setTimeout(() => {
      // Increment request counter to track this specific request
      const currentRequestId = ++requestIdRef.current

      searchItems(query)
        .then(data => {
          // Stale-response guard: only update if this is still the latest request
          // and the component is still mounted
          if (currentRequestId === requestIdRef.current && mountedRef.current) {
            setResults(data)
            setIsLoading(false)
          }
        })
        .catch(err => {
          // Same guard for errors
          if (currentRequestId === requestIdRef.current && mountedRef.current) {
            setError(err instanceof Error ? err.message : 'Search failed')
            setIsLoading(false)
          }
        })
    }, 300)

    // Cleanup: cancel pending timer when query changes or on unmount
    return () => {
      clearTimeout(timerId)
    }
  }, [query])

  return { query, setQuery, results, isLoading, error }
}

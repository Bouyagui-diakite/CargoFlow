import { useState, useEffect, useCallback } from 'react'

/**
 * Generic data-fetching hook.
 * @param {Function} fetchFn  - async function that returns data
 * @param {Array}    deps     - re-fetch when these change
 */
export function useApi(fetchFn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}

/**
 * Mutation hook — for create / update / delete / approve.
 */
export function useMutation(mutateFn) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const mutate = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutateFn(payload)
      return { ok: true, data: result }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Action failed'
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}

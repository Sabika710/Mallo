'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'
import { apiFetch } from '@/lib/fetcher'

export function useApi() {
  const { getToken } = useAuth()

  const call = useCallback(
    async <T = unknown>(
      path: string,
      options?: Omit<Parameters<typeof apiFetch>[1], 'token'>,
    ): Promise<T> => {
      const token = await getToken()
      return apiFetch<T>(path, { ...options, token })
    },
    [getToken],
  )

  return { call }
}
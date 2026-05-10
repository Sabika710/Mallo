'use client'

import { createContext, useContext } from 'react'

// Simplified — no org activation needed since we use userId as brand key
const OrgReadyContext = createContext(true) // always ready
export const useOrgReady = () => useContext(OrgReadyContext)

export function OrgActivator({ children }: { children: React.ReactNode }) {
  return (
    <OrgReadyContext.Provider value={true}>
      {children}
    </OrgReadyContext.Provider>
  )
}
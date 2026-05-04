'use client'

/**
 * AppShell — layout wrapper for all interior pages.
 * Combines LeftNav + scrollable main content area.
 * Warm ivory background (#FAF7F2) throughout.
 */

import LeftNav from './LeftNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAF7F2' }}>
      <LeftNav />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

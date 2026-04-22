import { createContext, useContext, useState, useCallback } from 'react'

const ApiSimulatorContext = createContext(undefined)

export function ApiSimulatorProvider({ children }) {
  const [calls, setCalls] = useState([])
  const [visible, setVisible] = useState(true)

  const logCall = useCallback((call) => {
    const id = `api-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newCall = {
      id,
      timestamp: Date.now(),
      status: call.status ?? 'pending',
      method: call.method,
      endpoint: call.endpoint,
      statusCode: call.statusCode,
      description: call.description,
    }
    setCalls((prev) => [newCall, ...prev].slice(0, 20))
    return id
  }, [])

  const updateCall = useCallback((id, updates) => {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  const clear = useCallback(() => setCalls([]), [])

  return (
    <ApiSimulatorContext.Provider value={{ calls, logCall, updateCall, clear, visible, setVisible }}>
      {children}
    </ApiSimulatorContext.Provider>
  )
}

export function useApiSimulator() {
  const ctx = useContext(ApiSimulatorContext)
  if (!ctx) throw new Error('useApiSimulator must be used within ApiSimulatorProvider')
  return ctx
}

export async function simulateApi(log, update, call, delay = 500) {
  const id = log({ ...call, status: 'pending' })
  await new Promise((r) => setTimeout(r, delay))
  update(id, { status: 'success', statusCode: call.statusCode ?? 200 })
}

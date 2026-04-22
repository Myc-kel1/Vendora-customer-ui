import { createContext, useContext, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useApiSimulator } from './ApiSimulatorContext'

const OrdersContext = createContext(undefined)

const normaliseOrder = (o) => ({
  id: o.id,
  user_id: o.user_id,
  status: o.status,
  total_amount: Number(o.total_amount),
  items: (o.items ?? []).map((i) => ({
    id: i.id,
    product_id: i.product_id,
    product_name: i.product_name,
    quantity: i.quantity,
    price: Number(i.price),
    subtotal: Number(i.subtotal ?? i.price * i.quantity),
  })),
  created_at: o.created_at,
})

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const { logCall, updateCall } = useApiSimulator()

  const log = useCallback(
    async (call, fn) => {
      const id = logCall({ ...call, status: 'pending' })
      try {
        const result = await fn()
        updateCall(id, { status: 'success', statusCode: call.statusCode ?? 200 })
        return result
      } catch (err) {
        updateCall(id, { status: 'error', statusCode: err.status ?? 500 })
        throw err
      }
    },
    [logCall, updateCall]
  )

  // ─── Fetch orders from API ────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const data = await log(
        { method: 'GET', endpoint: '/orders/my-orders', description: 'Fetch order history' },
        () => apiFetch('/orders/my-orders')
      )
      setOrders((data.items ?? []).map(normaliseOrder))
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [log])

  // ─── Create order via API ─────────────────────────────────────────────────
  const createOrder = useCallback(
    async () => {
      const data = await log(
        { method: 'POST', endpoint: '/orders', description: 'Place order', statusCode: 201 },
        () => apiFetch('/orders', { method: 'POST' })
      )
      const order = normaliseOrder(data)
      setOrders((prev) => [order, ...prev])
      return order
    },
    [log]
  )

  // ─── Local status update (after payment webhook confirms) ─────────────────
  const markPaid = useCallback((id) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'paid' } : o)))
  }, [])

  const markFailed = useCallback((id) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'failed' } : o)))
  }, [])

  return (
    <OrdersContext.Provider value={{ orders, ordersLoading, fetchOrders, createOrder, markPaid, markFailed }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}

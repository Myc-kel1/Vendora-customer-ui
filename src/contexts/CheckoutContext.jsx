import { createContext, useContext, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useApiSimulator } from './ApiSimulatorContext'
import { useOrders } from './OrdersContext'
import { useCart } from './CartContext'

const CheckoutContext = createContext(undefined)

const initial = { stage: 'idle', order: null, reference: null, authorizationUrl: null, amount: 0 }

export function CheckoutProvider({ children }) {
  const [state, setState] = useState(initial)
  const { logCall, updateCall } = useApiSimulator()
  const { createOrder, markPaid, markFailed } = useOrders()
  const { clearCart } = useCart()

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

  // ─── Full checkout flow ───────────────────────────────────────────────────
  // Step 1: POST /orders  → creates a pending order for the current user
  // Step 2: POST /payments/initialize → returns authorization_url + reference
  // Step 3: Client redirects user to Paystack authorization_url
  // Step 4: User returns and client calls GET /payments/verify/{reference}
  // Step 5: Mark order paid/failed locally after verification

  const startCheckout = useCallback(
    async (_items, amount) => {
      setState({ stage: 'creating-order', order: null, reference: null, authorizationUrl: null, amount })
      let order
      try {
        // Step 1 — create order
        order = await createOrder()
        setState((s) => ({ ...s, order, amount: order.total_amount, stage: 'initiating-payment' }))

        // Step 2 — initialize payment
        const payment = await log(
          { method: 'POST', endpoint: '/payments/initialize', description: `Initialize payment · order ${order.id}`, statusCode: 200 },
          () => apiFetch('/payments/initialize', {
            method: 'POST',
            body: JSON.stringify({ order_id: order.id }),
          })
        )

        setState((s) => ({
          ...s,
          reference: payment.reference,
          authorizationUrl: payment.authorization_url,
          stage: 'authorizing',
        }))
      } catch (err) {
        if (order) markFailed(order.id)
        setState(initial)
        throw err
      }
    },
    [createOrder, log, markFailed]
  )

  const verifyPayment = useCallback(async () => {
    if (!state.reference) return
    setState((s) => ({ ...s, stage: 'verifying' }))

    try {
      const result = await log(
        { method: 'GET', endpoint: `/payments/verify/${state.reference}`, description: 'Verify payment' },
        () => apiFetch(`/payments/verify/${state.reference}`)
      )

      if (result.status === 'paid' && state.order) {
        markPaid(state.order.id)
        clearCart()
        setState((s) => ({ ...s, stage: 'success' }))
      } else if (result.status === 'pending') {
        setState((s) => ({ ...s, stage: 'authorizing' }))
      } else {
        if (state.order) markFailed(state.order.id)
        setState((s) => ({ ...s, stage: 'failed' }))
      }
    } catch (err) {
      if (state.order) markFailed(state.order.id)
      setState((s) => ({ ...s, stage: 'failed' }))
    }
  }, [log, state.reference, state.order, markPaid, markFailed, clearCart])

  const cancelPayment = useCallback(async () => {
    if (state.order) markFailed(state.order.id)
    setState((s) => ({ ...s, stage: 'failed' }))
  }, [state.order, markFailed])

  const reset = useCallback(() => setState(initial), [])

  return (
    <CheckoutContext.Provider value={{ ...state, startCheckout, verifyPayment, cancelPayment, reset }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider')
  return ctx
}

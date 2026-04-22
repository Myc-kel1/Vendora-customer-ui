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
  // Step 1: POST /orders  →  creates order, returns order with id + total
  // Step 2: POST /payments/initialize  →  returns Paystack authorization_url + reference
  // Step 3: UI shows Paystack modal (we simulate the redirect inline)
  // Step 4: User pays → authorizePayment() is called
  // Step 5: PATCH order status locally to 'paid' (webhook handles real confirmation)

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
          { method: 'POST', endpoint: '/payments/initialize', description: `Initialize Paystack · order ${order.id}`, statusCode: 201 },
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
        // Order creation or payment init failed
        if (order) markFailed(order.id)
        setState(initial)
        throw err
      }
    },
    [createOrder, log, markFailed]
  )

  // Called when user clicks "Pay" in our simulated Paystack modal
  const authorizePayment = useCallback(async () => {
    setState((s) => ({ ...s, stage: 'verifying' }))
    try {
      // In production the webhook does this — here we poll once to simulate
      await log(
        { method: 'GET', endpoint: `/orders/${state.order?.id}`, description: 'Confirm order status' },
        () => apiFetch(`/orders/${state.order?.id}`)
      )
      if (state.order) markPaid(state.order.id)
      clearCart()
      setState((s) => ({ ...s, stage: 'success' }))
    } catch {
      if (state.order) markFailed(state.order.id)
      setState((s) => ({ ...s, stage: 'failed' }))
    }
  }, [log, state.order, markPaid, markFailed, clearCart])

  // Called when user clicks "Cancel" in the payment modal
  const cancelPayment = useCallback(async () => {
    setState((s) => ({ ...s, stage: 'verifying' }))
    await new Promise((r) => setTimeout(r, 500))
    if (state.order) markFailed(state.order.id)
    setState((s) => ({ ...s, stage: 'failed' }))
  }, [state.order, markFailed])

  const reset = useCallback(() => setState(initial), [])

  return (
    <CheckoutContext.Provider value={{ ...state, startCheckout, authorizePayment, cancelPayment, reset }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider')
  return ctx
}

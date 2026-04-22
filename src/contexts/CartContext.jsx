import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from './AuthContext'
import { useApiSimulator } from './ApiSimulatorContext'

const CartContext = createContext(undefined)

const emptyCart = { id: null, user_id: null, items: [], total: 0 }

const buildTotal = (items) =>
  items.reduce((sum, i) => sum + Number(i.subtotal ?? i.product_price * i.quantity), 0)

// Map API cart item to our UI shape (adds image placeholder)
const normaliseItem = (i) => ({
  id: i.id,
  product_id: i.product_id,
  product_name: i.product_name,
  product_price: Number(i.product_price),
  quantity: i.quantity,
  subtotal: Number(i.subtotal ?? i.product_price * i.quantity),
  // Products from API won't have images — use Unsplash placeholder keyed by product_id
  image: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80`,
})

export function CartProvider({ children }) {
  const [cart, setCart] = useState(emptyCart)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const { isAuthenticated } = useAuth()
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

  // ─── Fetch cart from API ──────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    setCartLoading(true)
    try {
      const data = await log(
        { method: 'GET', endpoint: '/cart', description: 'Fetch cart' },
        () => apiFetch('/cart')
      )
      const items = (data.items ?? []).map(normaliseItem)
      setCart({ id: data.id, user_id: data.user_id, items, total: buildTotal(items) })
    } catch {
      setCart(emptyCart)
    } finally {
      setCartLoading(false)
    }
  }, [log])

  // Fetch cart whenever the user logs in/out
  useEffect(() => {
    if (isAuthenticated) fetchCart()
    else setCart(emptyCart)
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Add item ─────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      // Optimistic update: temporarily add to local state
      const prev = cart
      const existingItem = cart.items.find((i) => i.product_id === productId)

      if (existingItem) {
        const newQty = existingItem.quantity + quantity
        setCart((c) => {
          const newItems = c.items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity: newQty, subtotal: newQty * i.product_price }
              : i
          )
          return { ...c, items: newItems, total: buildTotal(newItems) }
        })
      }

      try {
        await log(
          { method: 'POST', endpoint: '/cart/add', description: `Add ${productId} ×${quantity}`, statusCode: 201 },
          () => apiFetch('/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) })
        )
        // Refetch to get accurate server state (subtotals, ids)
        await fetchCart()
      } catch (err) {
        // Rollback on failure
        setCart(prev)
        throw err
      }
    },
    [cart, fetchCart, log]
  )

  // ─── Remove item ──────────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (itemId) => {
      const prev = cart
      setCart((c) => {
        const newItems = c.items.filter((i) => i.id !== itemId)
        return { ...c, items: newItems, total: buildTotal(newItems) }
      })
      try {
        await log(
          { method: 'DELETE', endpoint: `/cart/${itemId}`, description: 'Remove cart item' },
          () => apiFetch(`/cart/${itemId}`, { method: 'DELETE' })
        )
        await fetchCart()
      } catch (err) {
        setCart(prev)
        throw err
      }
    },
    [cart, fetchCart, log]
  )

  // ─── Update quantity ──────────────────────────────────────────────────────
  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      if (quantity < 1) return
      const prev = cart
      setCart((c) => {
        const newItems = c.items.map((i) =>
          i.id === itemId ? { ...i, quantity, subtotal: quantity * i.product_price } : i
        )
        return { ...c, items: newItems, total: buildTotal(newItems) }
      })
      try {
        await log(
          { method: 'PATCH', endpoint: `/cart/${itemId}`, description: `Set qty → ${quantity}` },
          () => apiFetch(`/cart/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
        )
        await fetchCart()
      } catch (err) {
        setCart(prev)
        throw err
      }
    },
    [cart, fetchCart, log]
  )

  // ─── Clear cart (local only after order placed) ───────────────────────────
  const clearCart = useCallback(() => setCart(emptyCart), [])

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
        itemCount,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

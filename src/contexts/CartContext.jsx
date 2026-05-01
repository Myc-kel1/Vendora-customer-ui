import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from './AuthContext'
import { useApiSimulator } from './ApiSimulatorContext'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()

  const log = useCallback(
    async (call, fn) => {
      const id = logCall({ ...call, status: 'pending' })
      try {
        const result = await fn()
        updateCall(id, { status: 'success', statusCode: call.statusCode ?? 200 })
        return result
      } catch (err) {
        console.error(`[Cart] ${call.method} ${call.endpoint} failed:`, err.message)
        updateCall(id, { status: 'error', statusCode: err.status ?? 500 })
        throw err
      }
    },
    [logCall, updateCall]
  )

  // ─── Fetch cart from API ──────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      console.debug('[Cart] User not authenticated, skipping cart fetch')
      setCart(emptyCart)
      return
    }

    setCartLoading(true)
    try {
      console.debug('[Cart] Fetching cart...')
      const data = await log(
        { method: 'GET', endpoint: '/cart', description: 'Fetch cart' },
        () => apiFetch('/cart')
      )
      const items = (data.items ?? []).map(normaliseItem)
      setCart({ id: data.id, user_id: data.user_id, items, total: buildTotal(items) })
      console.debug('[Cart] Cart fetched successfully:', items.length, 'items')
    } catch (err) {
      console.error('[Cart] Failed to fetch cart:', err.message)
      setCart(emptyCart)
      toast({
        title: 'Error loading cart',
        description: 'We couldn\'t load your cart. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCartLoading(false)
    }
  }, [isAuthenticated, log, toast])

  // Fetch cart whenever the user logs in/out
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    } else {
      setCart(emptyCart)
    }
  }, [isAuthenticated, fetchCart])

  // ─── Add item ─────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      // Check authentication before attempting to add
      if (!isAuthenticated) {
        console.debug('[Cart] User not authenticated, cannot add to cart')
        toast({
          title: 'Sign in required',
          description: 'Please sign in to add items to your cart.',
          variant: 'destructive',
        })
        throw new Error('Not authenticated')
      }

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
        console.debug('[Cart] Adding product to cart:', productId, 'quantity:', quantity)
        await log(
          { method: 'POST', endpoint: '/cart/add', description: `Add ${productId} ×${quantity}`, statusCode: 201 },
          () => apiFetch('/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) })
        )
        // Refetch to get accurate server state (subtotals, ids)
        await fetchCart()
        console.debug('[Cart] Product added successfully')
        toast({
          title: 'Added to cart',
          description: 'Item added to your cart successfully.',
        })
      } catch (err) {
        // Rollback on failure
        setCart(prev)
        toast({
          title: 'Failed to add item',
          description: err.message || 'We couldn\'t add this item to your cart.',
          variant: 'destructive',
        })
        throw err
      }
    },
    [cart, isAuthenticated, fetchCart, log, toast]
  )

  // ─── Remove item ──────────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (itemId) => {
      if (!isAuthenticated) {
        console.debug('[Cart] User not authenticated, cannot remove from cart')
        throw new Error('Not authenticated')
      }

      const prev = cart
      setCart((c) => {
        const newItems = c.items.filter((i) => i.id !== itemId)
        return { ...c, items: newItems, total: buildTotal(newItems) }
      })
      try {
        console.debug('[Cart] Removing item from cart:', itemId)
        await log(
          { method: 'DELETE', endpoint: `/cart/${itemId}`, description: 'Remove cart item' },
          () => apiFetch(`/cart/${itemId}`, { method: 'DELETE' })
        )
        await fetchCart()
        console.debug('[Cart] Item removed successfully')
        toast({
          title: 'Removed from cart',
          description: 'Item removed from your cart.',
        })
      } catch (err) {
        setCart(prev)
        toast({
          title: 'Failed to remove item',
          description: err.message || 'We couldn\'t remove this item from your cart.',
          variant: 'destructive',
        })
        throw err
      }
    },
    [cart, isAuthenticated, fetchCart, log, toast]
  )

  // ─── Update quantity ──────────────────────────────────────────────────────
  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      if (!isAuthenticated) {
        console.debug('[Cart] User not authenticated, cannot update cart')
        throw new Error('Not authenticated')
      }

      if (quantity < 1) return

      const prev = cart
      setCart((c) => {
        const newItems = c.items.map((i) =>
          i.id === itemId ? { ...i, quantity, subtotal: quantity * i.product_price } : i
        )
        return { ...c, items: newItems, total: buildTotal(newItems) }
      })
      try {
        console.debug('[Cart] Updating quantity for item:', itemId, 'to:', quantity)
        await log(
          { method: 'PATCH', endpoint: `/cart/${itemId}`, description: `Set qty → ${quantity}` },
          () => apiFetch(`/cart/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
        )
        await fetchCart()
        console.debug('[Cart] Quantity updated successfully')
      } catch (err) {
        setCart(prev)
        toast({
          title: 'Failed to update quantity',
          description: err.message || 'We couldn\'t update the item quantity.',
          variant: 'destructive',
        })
        throw err
      }
    },
    [cart, isAuthenticated, fetchCart, log, toast]
  )

  // ─── Clear cart (local only after order placed) ───────────────────────────
  const clearCart = useCallback(() => {
    console.debug('[Cart] Clearing cart')
    setCart(emptyCart)
  }, [])

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

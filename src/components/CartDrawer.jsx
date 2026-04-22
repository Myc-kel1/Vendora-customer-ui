import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag, Lock } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCheckout } from '@/contexts/CheckoutContext'

const CartDrawer = () => {
  const { cart, drawerOpen, closeDrawer, removeFromCart, updateQuantity, itemCount } = useCart()
  const { isAuthenticated } = useAuth()
  const { startCheckout } = useCheckout()
  const navigate = useNavigate()

  const shipping = cart.total > 150 || cart.total === 0 ? 0 : 9.99
  const grandTotal = cart.total + shipping

  const handleCheckout = () => {
    if (!isAuthenticated) {
      closeDrawer()
      navigate('/login?next=checkout')
      return
    }
    closeDrawer()
    startCheckout(cart.items, grandTotal)
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-foreground" />
                <h2 className="font-display text-2xl font-bold text-foreground">Your Cart</h2>
                <span className="text-sm text-muted-foreground">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-1">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">Add some items to get started</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {cart.items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="flex gap-4 p-3 bg-cream rounded-2xl"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground truncate">{item.product_name}</h3>
                              <p className="text-xs text-muted-foreground">${item.product_price.toFixed(2)} each</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center bg-background rounded-full">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-sm font-medium text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="font-semibold text-foreground text-sm">${item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-border space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-lg text-foreground">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {!isAuthenticated && <Lock className="w-4 h-4" />}
                  {isAuthenticated ? 'Checkout' : 'Sign in to checkout'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer

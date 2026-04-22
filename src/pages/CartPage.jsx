import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Lock, ArrowLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCheckout } from '@/contexts/CheckoutContext'
import Footer from '@/components/Footer'

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, itemCount } = useCart()
  const { isAuthenticated } = useAuth()
  const { startCheckout } = useCheckout()
  const navigate = useNavigate()

  const shipping = cart.total > 150 || cart.total === 0 ? 0 : 9.99
  const grandTotal = cart.total + shipping

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?next=checkout')
      return
    }
    startCheckout(cart.items, grandTotal)
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue shopping
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-2"
        >
          Your Cart
        </motion.h1>
        <p className="text-muted-foreground mb-10">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>

        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-6" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Browse Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-5 p-5 bg-cream rounded-3xl"
                  >
                    <Link
                      to={`/products/${item.product_id}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-muted flex-shrink-0"
                    >
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <Link
                            to={`/products/${item.product_id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            ${item.product_price.toFixed(2)} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-background"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center bg-background rounded-full border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="font-bold text-foreground text-lg">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-cream rounded-3xl p-6 sticky top-24"
              >
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-sage-foreground font-medium' : ''}>
                      {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add ${(150 - cart.total).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-2xl text-foreground">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base"
                >
                  {!isAuthenticated && <Lock className="w-4 h-4" />}
                  {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {!isAuthenticated && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>{' '}
                    or{' '}
                    <Link to="/login" className="text-primary hover:underline">
                      create an account
                    </Link>{' '}
                    to checkout
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    🔒 Secure checkout powered by Paystack
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default CartPage

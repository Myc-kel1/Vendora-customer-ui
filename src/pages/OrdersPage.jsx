import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ArrowRight, ShoppingBag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useOrders } from '@/contexts/OrdersContext'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

const statusConfig = {
  pending: { label: 'Pending payment', className: 'bg-warm text-warm-foreground' },
  paid: { label: 'Paid', className: 'bg-sage/40 text-sage-foreground' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
}

const OrderRow = ({ order }) => {
  const [open, setOpen] = useState(false)
  const cfg = statusConfig[order.status] ?? statusConfig.pending

  return (
    <motion.div layout className="bg-cream rounded-3xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-black/[0.02] transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-background flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">#{order.id.slice(0, 16)}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
          <span className="font-bold text-foreground">${order.total_amount.toFixed(2)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <motion.div initial={false} animate={{ height: open ? 'auto' : 0 }} className="overflow-hidden">
        <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
          <span className={`sm:hidden inline-flex mb-3 px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.product_name} <span className="text-muted-foreground/60">×{item.quantity}</span></span>
              <span className="font-medium text-foreground">${item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-border text-sm">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-foreground">${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const OrdersPage = () => {
  const { orders, ordersLoading, fetchOrders } = useOrders()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) fetchOrders()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Package className="w-14 h-14 text-muted-foreground/20 mx-auto mb-5" />
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Your orders</h1>
          <p className="text-muted-foreground mb-8">Sign in to view your order history.</p>
          <Link to="/login?next=/orders" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
            Sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">{ordersLoading ? 'Loading…' : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed`}</p>
        </motion.div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-6" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8">When you place an order it will appear here.</p>
            <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl space-y-4">
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <OrderRow order={order} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default OrdersPage

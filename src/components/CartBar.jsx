import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

const CartBar = () => {
  const { itemCount, cart, openDrawer } = useCart()

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
        >
          <button
            onClick={openDrawer}
            className="group w-full flex items-center justify-between gap-4 px-5 py-4 bg-foreground text-background rounded-full shadow-2xl hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              </div>
              <span className="text-sm font-medium">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} · ${cart.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              View cart
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CartBar

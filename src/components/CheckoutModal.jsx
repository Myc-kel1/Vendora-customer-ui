import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react'
import { useCheckout } from '@/contexts/CheckoutContext'
import { Link } from 'react-router-dom'

const stageLabels = {
  'creating-order': {
    title: 'Creating your order',
    desc: 'Reserving your items and preparing your order…',
  },
  'initiating-payment': {
    title: 'Connecting to Paystack',
    desc: 'Securely initializing your payment session…',
  },
  verifying: {
    title: 'Verifying payment',
    desc: 'Confirming the transaction with Paystack…',
  },
}

const CheckoutModal = () => {
  const { stage, order, reference, amount, authorizePayment, cancelPayment, reset } = useCheckout()

  const open = stage !== 'idle'
  const loadingStage =
    stage === 'creating-order' || stage === 'initiating-payment' || stage === 'verifying'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/50 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="pointer-events-auto w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Loading stages */}
              {loadingStage && (
                <div className="p-10 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-14 h-14 mx-auto mb-6 text-primary"
                  >
                    <Loader2 className="w-14 h-14" />
                  </motion.div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {stageLabels[stage].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{stageLabels[stage].desc}</p>
                </div>
              )}

              {/* Mock Paystack authorization page */}
              {stage === 'authorizing' && (
                <div>
                  <div className="bg-[#0BA4DB] text-white px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="font-bold tracking-wide">paystack</span>
                    </div>
                    <span className="text-xs opacity-90">Secure Checkout</span>
                  </div>
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Pay</p>
                    <p className="font-display text-4xl font-bold text-foreground mb-1">
                      ${amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">
                      Reference: <code className="font-mono">{reference}</code>
                    </p>

                    <div className="space-y-3 mb-6">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Card number
                        </label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-accent/50 border border-border rounded-xl">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm text-foreground tracking-wider">
                            4084 0840 8408 4081
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Expiry
                          </label>
                          <div className="px-4 py-3 bg-accent/50 border border-border rounded-xl font-mono text-sm text-foreground">
                            12/30
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            CVV
                          </label>
                          <div className="px-4 py-3 bg-accent/50 border border-border rounded-xl font-mono text-sm text-foreground">
                            •••
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-4 text-center">
                      This is a simulated checkout · no real charge will occur
                    </p>

                    <button
                      onClick={authorizePayment}
                      className="w-full py-4 bg-[#0BA4DB] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Pay ${amount.toFixed(2)}
                    </button>
                    <button
                      onClick={cancelPayment}
                      className="w-full py-3 mt-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Cancel payment
                    </button>
                  </div>
                </div>
              )}

              {/* Success */}
              {stage === 'success' && order && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 mx-auto mb-5 rounded-full bg-sage/40 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-9 h-9 text-sage-foreground" />
                  </motion.div>
                  <h3 className="font-display text-3xl font-bold text-foreground mb-2">
                    Payment successful
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Thank you for your purchase. A receipt has been sent to your email.
                  </p>

                  <div className="bg-cream rounded-2xl p-5 text-left space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order</span>
                      <span className="font-mono text-foreground">#{order.id.slice(0, 12)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="text-foreground">
                        {order.items.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-medium text-foreground">Total paid</span>
                      <span className="font-bold text-foreground">${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      Keep shopping
                    </button>
                    <Link
                      to="/orders"
                      onClick={reset}
                      className="flex-1 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      View orders
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Failed */}
              {stage === 'failed' && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-9 h-9 text-destructive" />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-foreground mb-2">
                    Payment cancelled
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your order is still saved. You can retry payment anytime from your orders.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      Close
                    </button>
                    <Link
                      to="/orders"
                      onClick={reset}
                      className="flex-1 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      View orders
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CheckoutModal

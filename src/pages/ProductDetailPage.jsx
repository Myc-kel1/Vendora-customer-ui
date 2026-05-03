import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Minus, Plus, Check, Lock, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useApiSimulator } from '@/contexts/ApiSimulatorContext'
import { toast } from '@/hooks/use-toast'
import Footer from '@/components/Footer'

const ProductDetailPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { addToCart, openDrawer } = useCart()
  const { isAuthenticated } = useAuth()
  const { logCall, updateCall } = useApiSimulator()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const callId = logCall({ method: 'GET', endpoint: `/products/${id}`, status: 'pending', description: 'Fetch product' })
    apiFetch(`/products/${id}`)
      .then((data) => {
        setProduct(data)
        updateCall(callId, { status: 'success', statusCode: 200 })
      })
      .catch((err) => {
        if (err.status === 404) setNotFound(true)
        updateCall(callId, { status: 'error', statusCode: err.status ?? 500 })
      })
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Product not found</h1>
          <Link to="/products" className="text-primary hover:underline">Back to shop</Link>
        </div>
      </div>
    )
  }

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to add items to your cart.' })
      navigate(`/login?next=/products/${product.id}`)
      return
    }
    setAdding(true)
    try {
      await addToCart(product.id, qty)
      setAdded(true)
      toast({ title: 'Added to cart!', description: `${qty}× ${product.name}` })
      openDrawer()
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      toast({ title: 'Could not add to cart', description: err.message ?? 'Please try again.' })
    } finally {
      setAdding(false)
    }
  }

  const imageUrl = product.image_url

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl overflow-hidden bg-cream aspect-square">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : null}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col justify-center">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">{product.name}</h1>
            <p className="text-3xl font-semibold text-foreground mb-6">${Number(product.price).toFixed(2)}</p>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">{product.description}</p>

            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-secondary text-secondary-foreground' : 'bg-warm text-warm-foreground'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-sage-foreground' : 'bg-primary'}`} />
                {product.stock > 10 ? 'In stock' : product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-border rounded-full">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 text-muted-foreground hover:text-foreground transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center font-medium text-foreground">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="p-3 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.97 }}
              disabled={adding || product.stock === 0}
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 disabled:opacity-60 ${added ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
            >
              {adding ? <Loader2 className="w-5 h-5 animate-spin" /> :
               added ? <><Check className="w-5 h-5" />Added!</> :
               !isAuthenticated ? <><Lock className="w-5 h-5" />Sign in to add</> :
               product.stock === 0 ? 'Out of stock' :
               <><ShoppingBag className="w-5 h-5" />Add to Cart — ${(Number(product.price) * qty).toFixed(2)}</>}
            </motion.button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ProductDetailPage

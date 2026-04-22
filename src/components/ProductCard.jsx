import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

// Deterministic image per product — cycles through a curated set by index in product id
const IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80',
  'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&q=80',
  'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&q=80',
  'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=600&q=80',
]

function getProductImage(product) {
  // Use provided image if present (mock data), otherwise derive from id hash
  if (product.image) return product.image
  const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return IMAGES[hash % IMAGES.length]
}

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart, openDrawer } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to add items to your cart.' })
      navigate(`/login?next=/products/${product.id}`)
      return
    }
    setAdding(true)
    try {
      await addToCart(product.id)
      toast({ title: 'Added to cart', description: `${product.name} has been added to your cart.` })
      openDrawer()
    } catch (err) {
      toast({ title: 'Could not add to cart', description: err.message ?? 'Please try again.' })
    } finally {
      setAdding(false)
    }
  }

  const image = getProductImage(product)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/products/${product.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-cream aspect-[3/4] mb-4">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
          <motion.button
            onClick={handleAddToCart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={adding}
            className="absolute bottom-4 right-4 p-3 bg-background/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
            aria-label={isAuthenticated ? 'Add to cart' : 'Sign in to add'}
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> :
             isAuthenticated ? <ShoppingBag className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </motion.button>
          {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
            <span className="absolute top-4 left-4 px-3 py-1 text-xs font-medium bg-warm text-warm-foreground rounded-full">
              Low stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-4 left-4 px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              Out of stock
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
          <p className="text-lg font-semibold text-foreground">${Number(product.price).toFixed(2)}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export default ProductCard

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { apiFetch } from '@/lib/api'

const HomePage = () => {
  const [featured, setFeatured] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/products?page=1&page_size=4'),
      apiFetch('/products?page=2&page_size=4'),
      apiFetch('/categories'),
    ])
      .then(([feat, newArr, cats]) => {
        setFeatured(feat.items ?? [])
        setNewArrivals(newArr.items ?? [])
        setCategories(Array.isArray(cats) ? cats.slice(0, 6) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-peach-light rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">New Season Collection</span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                Curated for<br /><span className="text-primary">modern living</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
                Discover our thoughtfully selected collection of premium essentials. Quality that speaks for itself.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground rounded-full font-medium hover:bg-accent transition-colors">
                  View Lookbook
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5]">
                <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80" alt="Hero collection" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-6 -left-6 bg-background rounded-2xl p-5 shadow-xl border border-border">
                <p className="text-3xl font-bold text-foreground">250+</p>
                <p className="text-sm text-muted-foreground">Premium Products</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Shop by Category</h2>
            <p className="text-muted-foreground">Find exactly what you're looking for</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={`/products?category=${cat.id}`} className="inline-flex px-6 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                  {cat.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">Featured</h2>
            <p className="text-muted-foreground">Our most loved pieces</p>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-3xl bg-sage/30 p-12 md:p-20">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Free shipping on orders over $150</h2>
            <p className="text-muted-foreground mb-8">Plus easy returns within 30 days. Shop with confidence.</p>
            <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">New Arrivals</h2>
            <p className="text-muted-foreground">Fresh additions to our collection</p>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

export default HomePage

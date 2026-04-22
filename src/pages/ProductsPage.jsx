import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { apiFetch } from '@/lib/api'
import { useApiSimulator } from '@/contexts/ApiSimulatorContext'

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const activeCategory = searchParams.get('category') ?? ''
  const { logCall, updateCall } = useApiSimulator()

  // Debounce search input (500ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  // Fetch categories once
  useEffect(() => {
    const id = logCall({ method: 'GET', endpoint: '/categories', status: 'pending', description: 'Fetch categories' })
    apiFetch('/categories')
      .then((data) => {
        setCategories(Array.isArray(data) ? data : [])
        updateCall(id, { status: 'success', statusCode: 200 })
      })
      .catch(() => updateCall(id, { status: 'error', statusCode: 500 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch products whenever search or category changes
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: 1, page_size: 50 })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (activeCategory) params.set('category_id', activeCategory)

    const endpoint = `/products?${params.toString()}`
    const id = logCall({ method: 'GET', endpoint, status: 'pending', description: 'Fetch products' })
    try {
      const data = await apiFetch(endpoint)
      setProducts(data.items ?? [])
      setTotal(data.total ?? 0)
      updateCall(id, { status: 'success', statusCode: 200 })
    } catch {
      updateCall(id, { status: 'error', statusCode: 500 })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleCategoryClick = (catId) => {
    if (catId) setSearchParams({ category: catId })
    else setSearchParams({})
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">Shop All</h1>
          <p className="text-muted-foreground text-lg">{loading ? 'Loading…' : `${total} products`}</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${!activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${activeCategory === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default ProductsPage

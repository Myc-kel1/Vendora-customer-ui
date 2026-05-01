import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── Providers ───────────────────────────────────────────────────────────────
import { ApiSimulatorProvider } from '@/contexts/ApiSimulatorContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { OrdersProvider } from '@/contexts/OrdersContext'
import { CheckoutProvider } from '@/contexts/CheckoutContext'

// ─── Layout components ───────────────────────────────────────────────────────
import Navbar from '@/components/Navbar'
import CartDrawer from '@/components/CartDrawer'
import CartBar from '@/components/CartBar'
import CheckoutModal from '@/components/CheckoutModal'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

// ─── Pages ───────────────────────────────────────────────────────────────────
import Index from '@/pages/Index'
import ProductsPage from '@/pages/ProductsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage from '@/pages/CartPage'
import OrdersPage from '@/pages/OrdersPage'
import LoginPage from '@/pages/LoginPage'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

// ─── Inner app — all providers already resolved here ─────────────────────────
const AppShell = () => {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global overlays */}
      <CartDrawer />
      <CartBar />
      <CheckoutModal />

      {/* Toast systems */}
      <Toaster />
      <SonnerToaster />
    </>
  )
}

// ─── Provider order matters: ──────────────────────────────────────────────────
// ApiSimulator → Auth → Cart (needs auth) → Orders → Checkout (needs cart + orders)
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ApiSimulatorProvider>
          <AuthProvider>
            <CartProvider>
              <OrdersProvider>
                <CheckoutProvider>
                  <AppShell />
                </CheckoutProvider>
              </OrdersProvider>
            </CartProvider>
          </AuthProvider>
        </ApiSimulatorProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

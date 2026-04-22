import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, Search, User, Menu, X, LogOut } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

const links = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/orders', label: 'Orders' },
]

const Navbar = () => {
  const { itemCount, openDrawer } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    toast({ title: 'Signed out', description: 'You have been signed out.' })
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-30 glass border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-display text-2xl font-bold text-foreground tracking-tight">
            Aurelia
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.to
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent">
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:pr-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {user?.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {user?.email.split('@')[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-20"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-xs text-muted-foreground">Signed in as</p>
                          <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          My orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-accent transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={openDrawer}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>

            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar

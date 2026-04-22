const Footer = () => {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">Aurelia</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Curated essentials for the modern lifestyle. Quality meets intention.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="/products" className="hover:text-foreground transition-colors">All Products</a></li>
              <li><a href="/products" className="hover:text-foreground transition-colors">New Arrivals</a></li>
              <li><a href="/products" className="hover:text-foreground transition-colors">Best Sellers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Follow</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pinterest</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2026 Aurelia. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer

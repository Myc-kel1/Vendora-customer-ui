export const categories = [
  { id: 'cat-1', name: 'Electronics', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Clothing', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Home & Living', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-4', name: 'Accessories', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-5', name: 'Beauty', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
]

const productImages = [
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

const productNames = [
  'Minimal Watch', 'Wireless Earbuds', 'Polaroid Camera', 'Round Sunglasses',
  'Leather Sneakers', 'Cotton Hoodie', 'Ceramic Vase', 'Running Shoes',
  'Silk Scarf', 'Leather Bag', 'Face Serum', 'Scented Candle',
]

const productDescs = [
  'Elegantly crafted with attention to every detail. A timeless piece for the modern individual.',
  'Premium sound quality meets minimalist design. Your everyday essential.',
  'Capture moments in their most authentic form. Vintage-inspired modern technology.',
  'UV protection meets style. Lightweight titanium frames for all-day comfort.',
  'Handcrafted from full-grain leather. Built to last, designed to impress.',
  'Organic cotton blend for supreme comfort. Relaxed fit, refined aesthetic.',
  'Hand-thrown pottery with a natural glaze. Brings warmth to any space.',
  'Engineered for performance, designed for style. Lightweight and responsive.',
  '100% mulberry silk with hand-rolled edges. Luxurious to the touch.',
  'Full-grain leather with brass hardware. Ages beautifully over time.',
  'Vitamin C enriched formula for radiant skin. Lightweight, fast-absorbing.',
  'Hand-poured soy wax with essential oils. 60-hour burn time.',
]

const prices = [89.99, 149.99, 199.99, 129.99, 259.99, 79.99, 64.99, 179.99, 119.99, 349.99, 58.99, 42.99]

export const products = productNames.map((name, i) => ({
  id: `prod-${i + 1}`,
  name,
  description: productDescs[i],
  price: prices[i],
  stock: Math.floor(Math.random() * 50) + 5,
  is_active: true,
  created_by: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category_id: categories[i % categories.length].id,
  image: productImages[i],
}))

export const mockCart = {
  id: 'cart-1',
  user_id: 'user-1',
  items: [
    {
      id: 'ci-1',
      product_id: 'prod-1',
      product_name: 'Minimal Watch',
      product_price: 89.99,
      quantity: 1,
      subtotal: 89.99,
      image: productImages[0],
    },
    {
      id: 'ci-2',
      product_id: 'prod-6',
      product_name: 'Cotton Hoodie',
      product_price: 79.99,
      quantity: 2,
      subtotal: 159.98,
      image: productImages[5],
    },
  ],
  total: 249.97,
}

export const mockOrders = [
  {
    id: 'ord-1',
    user_id: 'user-1',
    status: 'paid',
    total_amount: 349.97,
    items: [
      { id: 'oi-1', product_id: 'prod-2', product_name: 'Wireless Earbuds', quantity: 1, price: 149.99, subtotal: 149.99 },
      { id: 'oi-2', product_id: 'prod-4', product_name: 'Round Sunglasses', quantity: 1, price: 129.99, subtotal: 129.99 },
    ],
    created_at: '2024-03-15T10:30:00Z',
  },
  {
    id: 'ord-2',
    user_id: 'user-1',
    status: 'pending',
    total_amount: 179.99,
    items: [
      { id: 'oi-3', product_id: 'prod-8', product_name: 'Running Shoes', quantity: 1, price: 179.99, subtotal: 179.99 },
    ],
    created_at: '2024-04-01T14:00:00Z',
  },
]

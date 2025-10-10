export type Category = {
  name: string
  slug: string
}

export const CATEGORIES: Category[] = [
  { name: 'Groceries & Essentials', slug: 'groceries' },
  { name: 'Food & Restaurants', slug: 'food' },
  { name: 'Pharmacy & Health', slug: 'pharmacy' },
  { name: 'Fashion & Beauty', slug: 'fashion' },
  { name: 'Electronics & Accessories', slug: 'electronics' },
  { name: 'Home & Living', slug: 'home' },
  { name: 'Baby, Kids & Toys', slug: 'baby' },
  { name: 'Automotive & Spare Parts', slug: 'automotive' },
  { name: 'Stationery & Office', slug: 'stationery' },
  { name: 'Agriculture & Farm Produce', slug: 'agriculture' },
  { name: 'Beverages & Alcohol', slug: 'beverages' },
  { name: 'Services (Instant Booking)', slug: 'services' },
  { name: 'Local Artisans & Crafts', slug: 'artisans' },
]

export const HEADERCATEGORIES: Category[] = [
  { name: 'Fashion & Beauty', slug: 'fashion' },
  { name: 'Electronics & Accessories', slug: 'electronics' },
  { name: 'Groceries & Essentials', slug: 'groceries' },
  { name: 'Baby, Kids & Toys', slug: 'baby' },
  { name: 'Food & Restaurants', slug: 'food' },
  { name: 'Pharmacy & Health', slug: 'pharmacy' },
  { name: 'More', slug: 'categories' },
]

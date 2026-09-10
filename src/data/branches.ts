export interface Branch {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  type: 'Bakery' | 'Cafe';
  address: string;
  contact: string;
  deliveryOptions: ('Takeaway' | 'Delivery' | 'Dine-in')[];
  costRange?: string;
  note?: string;
  highlight?: string;
  googleMapsUrl: string;
  openingHours?: string;
  coordinates?: { lat: number; lng: number };
  plusCode?: string;
}

export const BRANCHES: Branch[] = [
  {
    id: 'trust-colony',
    name: 'Muffinns Sweets & Bakers (Trust Colony Branch)',
    rating: 4.2,
    reviewsCount: 731,
    type: 'Bakery',
    address: 'Circular Road, Near Trust Colony Chowk, Bahawalpur',
    contact: '0302 6567774',
    costRange: 'Rs 1–1,000',
    deliveryOptions: ['Takeaway', 'Dine-in', 'Delivery'],
    highlight: 'Fresh Mithai, Cakes & Live Oven Muffins',
    openingHours: '08:00 AM – 12:00 AM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffinns+Sweets+%26+Bakers+Trust+Colony+Circular+Road+Bahawalpur',
    coordinates: { lat: 29.3956, lng: 71.6833 },
    plusCode: '9M7V+8P Bahawalpur'
  },
  {
    id: 'aziz-bhatti',
    name: 'Muffinns Sweets & Bakers (Aziz Bhatti Road)',
    rating: 4.2,
    reviewsCount: 561,
    type: 'Bakery',
    address: '28 Aziz Bhatti Shaheed Rd, Model Town, Bahawalpur',
    contact: '0302 6567774',
    costRange: 'Rs 1–4,000',
    deliveryOptions: ['Delivery', 'Takeaway', 'Dine-in'],
    openingHours: '08:00 AM – 11:30 PM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffins+Sweets+%26+Bakers+Aziz+Bhatti+Shaheed+Rd+Bahawalpur',
    coordinates: { lat: 29.3889, lng: 71.6750 },
    plusCode: '9M5V+GHP Bahawalpur'
  },
  {
    id: 'rafi-qamar',
    name: 'Muffinns Sweets & Bakers (Rafi Qamar Road)',
    rating: 4.2,
    reviewsCount: 216,
    type: 'Bakery',
    address: 'Rafi Qamar Road Chowk, Satellite Town, Bahawalpur',
    contact: '0332 6567774',
    costRange: 'Rs 1–2,000',
    deliveryOptions: ['Takeaway', 'Dine-in', 'Delivery'],
    note: 'Muffins is so amazing with seating tables, fresh tea and cakes',
    openingHours: '08:30 AM – 12:00 AM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffinns+Sweets+%26+Bakers+Rafi+Qamar+Road+Bahawalpur',
    coordinates: { lat: 29.3812, lng: 71.6910 }
  },
  {
    id: 'madni-town',
    name: 'Muffins Patashay (Madni Town Branch)',
    rating: 4.1,
    reviewsCount: 107,
    type: 'Bakery',
    address: 'Hasilpur Road, Madni Town, Bahawalpur',
    contact: '0331 6567780',
    costRange: 'Rs 1–5,000',
    deliveryOptions: ['Dine-in', 'Takeaway', 'Delivery'],
    openingHours: '08:00 AM – 11:45 PM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffins+Patasay+Madni+Town+Hasilpur+Rd+Bahawalpur',
    coordinates: { lat: 29.3980, lng: 71.7050 },
    plusCode: '9QP3+GCG Bahawalpur'
  },
  {
    id: 'patashay-jhangi-wala',
    name: 'Muffinns Sweets & Bakers (Jhangi Wala Road)',
    rating: 3.8,
    reviewsCount: 33,
    type: 'Bakery',
    address: 'Jhangi Wala Road, CP42+3PM, Bahawalpur',
    contact: '0330 6567774',
    costRange: 'Rs 1–1,000',
    deliveryOptions: ['Delivery', 'Takeaway'],
    openingHours: '09:00 AM – 11:00 PM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffinns+Sweets+%26+Bakers+Patashay+Jhangi+Wala+Rd+Bahawalpur',
    coordinates: { lat: 29.3680, lng: 71.6620 },
    plusCode: 'CP42+3PM Bahawalpur'
  },
  {
    id: 'iub-branch',
    name: 'Muffinns Sweets & Bakers (IUB Baghdad Campus)',
    rating: 5.0,
    reviewsCount: 45,
    type: 'Bakery',
    address: 'Opposite Islamia University Baghdad-ul-Jadeed Campus, Bahawalpur',
    contact: '0331 6567774',
    costRange: 'Rs 1–1,500',
    deliveryOptions: ['Takeaway', 'Delivery'],
    highlight: 'Student Deals & Fresh Bento Cakes',
    openingHours: '08:00 AM – 11:00 PM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffinns+Sweet+%26+Bakers+Islamia+University+Baghdad+Campus+Bahawalpur',
    coordinates: { lat: 29.3750, lng: 71.7200 }
  },
  {
    id: 'muffins-road',
    name: 'Muffinns Cafe & Sweets (Farid Gate Road)',
    rating: 4.1,
    reviewsCount: 24,
    type: 'Cafe',
    address: 'Near Farid Gate, Commercial Market, Bahawalpur',
    contact: '0327 9497421',
    costRange: 'Rs 1,000–4,000',
    deliveryOptions: ['Takeaway', 'Dine-in'],
    openingHours: '09:00 AM – 12:00 AM',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Muffins+Farid+Gate+Road+Bahawalpur',
    coordinates: { lat: 29.3989, lng: 71.6820 },
    plusCode: '9M5V+GHP Bahawalpur'
  }
];


export interface MediaItem {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  coverUrl: string;
  type: 'audiobook' | 'ebook' | 'bundle';
  duration?: string;
  pages?: number;
  rating: number;
  price: number; // in NGN (minor units or whole)
  isSubscriptionIncluded: boolean;
  category: string;
  description: string;
  sampleAudioUrl?: string;
}

export const SAMPLE_CATALOG: MediaItem[] = [
  {
    id: '1',
    title: 'The Wealth of the Digital African',
    author: 'Dr. Emmanuel Adeyemi',
    narrator: 'Femi Williams',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    type: 'bundle',
    duration: '5 hrs 24 mins',
    pages: 240,
    rating: 4.9,
    price: 3500,
    isSubscriptionIncluded: true,
    category: 'Business & Wealth',
    description: 'An eye-opening masterclass on digital sovereignty, creator monetization, and building lasting value across African markets.',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'
  },
  {
    id: '2',
    title: 'Kingdom Mind: The Power of Purpose',
    author: 'Pastor Paul Johnson',
    narrator: 'Paul Johnson',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    type: 'audiobook',
    duration: '4 hrs 12 mins',
    rating: 4.8,
    price: 2500,
    isSubscriptionIncluded: true,
    category: 'Faith & Leadership',
    description: 'Discover how to align personal ambition with divine purpose, building an unshakeable mindset for modern leadership.',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'
  },
  {
    id: '3',
    title: 'The Tech Dynasty of Lagos',
    author: 'Kemi Bello',
    coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=800',
    type: 'ebook',
    pages: 310,
    rating: 4.7,
    price: 2000,
    isSubscriptionIncluded: true,
    category: 'Technology',
    description: 'The untold narrative of startup founders navigating currency shifts, venture capital, and engineering triumphs in Yaba.',
  },
  {
    id: '4',
    title: 'African Voices: Poems of Resilience',
    author: 'Musa Danladi',
    narrator: 'Amina Sadiq',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800',
    type: 'audiobook',
    duration: '2 hrs 45 mins',
    rating: 4.9,
    price: 1800,
    isSubscriptionIncluded: true,
    category: 'Culture & Arts',
    description: 'A rich compilation of spoken word and poetry celebrating heritage, strength, and the spirit of contemporary Africa.',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'
  }
];

export type StoreKindFilter = 'all' | 'digital' | 'physical';

export type StorePack = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  card_count: number;
  is_premium: boolean;
  price_cents: number;
  stripe_price_id: string | null;
  thumbnail_url?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
};

export type PhysicalProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  category?: string | null;
  variants?: string[];
};

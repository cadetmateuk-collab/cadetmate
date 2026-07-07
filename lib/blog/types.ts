export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  author: string;
  author_avatar: string | null;
  date: string;
  category: string;
  category_slug?: string | null;
  image: string | null;
  read_time: string | null;
  featured: boolean;
  hidden: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  author_avatar: string | null;
  date: string;
  category: string;
  category_slug?: string | null;
  image: string | null;
  read_time: string | null;
  featured: boolean;
}

export interface ContentHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface FAQItem {
  question: string;
  answer: string;
}

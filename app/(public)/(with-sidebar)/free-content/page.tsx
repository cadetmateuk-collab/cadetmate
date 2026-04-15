"use client"
import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  author_avatar: string;
  date: string;
  category: string;
  image: string;
  read_time: string;
  featured: boolean;
  hidden: boolean;
}

export default function BlogPage() {
  const [searchTerm, setSearchTerm]         = useState('');
  const [currentPage, setCurrentPage]       = useState(1);
  const [posts, setPosts]                   = useState<BlogPost[]>([]);
  const [loading, setLoading]               = useState(true);
  const postsPerPage = 9;

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('hidden', false)
        .order('date', { ascending: false });
      if (!error && data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast  = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);
  const totalPages   = Math.ceil(filteredPosts.length / postsPerPage);
  const featuredPost = posts.find(p => p.featured);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="fc-page fc-loading">
        <div className="fc-dot-grid" />
        <div className="fc-glow" />
        <div className="fc-noise" />
        <div className="fc-spinner" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .fc-anim-1 { animation: fadeUp 0.4s ease both 0.05s; }
        .fc-anim-2 { animation: fadeUp 0.4s ease both 0.12s; }
        .fc-anim-3 { animation: fadeUp 0.4s ease both 0.20s; }
        .fc-anim-4 { animation: fadeUp 0.4s ease both 0.28s; }
        .fc-anim-5 { animation: fadeIn 0.5s ease both 0.15s; }

        /* ── Page shell ── */
        .fc-page {
          min-height: 100dvh;
          background-color: hsl(var(--background));
          position: relative;
          overflow-x: hidden;
        }
        .fc-loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fc-spinner {
          width: 2rem; height: 2rem;
          border: 2px solid hsl(var(--border));
          border-top-color: hsl(var(--primary));
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          position: relative; z-index: 1;
        }

        /* ── Backgrounds (same as home & slug) ── */
        .fc-dot-grid {
          pointer-events: none; position: fixed; inset: 0;
          background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          z-index: 0;
        }
        .fc-glow {
          pointer-events: none; position: fixed;
          top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
          z-index: 0;
        }
        .fc-noise {
          pointer-events: none; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 180px 180px;
          opacity: 0.025; mix-blend-mode: multiply; z-index: 0;
        }

        /* ── Content ── */
        .fc-content {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 2.5rem 6rem;
        }

        /* ── Header ── */
        .fc-header {
          text-align: center;
          margin-bottom: 2.75rem;
        }
        .fc-title {
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 0 0 0.75rem;
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.7) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .fc-subtitle {
          font-size: 1.0625rem;
          color: hsl(var(--muted-foreground));
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── Search ── */
        .fc-search-wrap {
          max-width: 480px;
          margin: 0 auto 3rem;
          position: relative;
        }
        .fc-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        .fc-search {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.625rem;
          font-size: 0.9375rem;
          color: hsl(var(--foreground));
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .fc-search::placeholder { color: hsl(var(--muted-foreground)); }
        .fc-search:focus { border-color: hsl(var(--primary) / 0.5); }

        /* ── Featured post ── */
        .fc-featured {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
          margin-bottom: 3rem;
          text-decoration: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .fc-featured:hover {
          border-color: hsl(var(--primary) / 0.3);
          box-shadow: 0 8px 40px hsl(var(--primary) / 0.07);
        }
        .fc-featured-img {
          width: 100%; height: 100%;
          min-height: 280px;
          object-fit: cover;
          display: block;
          opacity: 0.92;
        }
        .fc-featured-body {
          padding: 2.25rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: hsl(var(--background));
        }
        .fc-featured-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: hsl(var(--primary));
          margin-bottom: 0.875rem;
        }
        .fc-featured-title {
          font-size: 1.625rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: hsl(var(--foreground));
          margin: 0 0 0.75rem;
        }
        .fc-featured-excerpt {
          font-size: 0.9375rem;
          line-height: 1.65;
          color: hsl(var(--muted-foreground));
          margin: 0 0 1.25rem;
        }
        .fc-featured-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .fc-featured-avatar {
          width: 1.75rem; height: 1.75rem;
          border-radius: 50%; object-fit: cover; opacity: 0.85;
        }
        .fc-featured-author { font-size: 0.8125rem; font-weight: 600; color: hsl(var(--foreground)); }
        .fc-featured-dot { color: hsl(var(--border)); }
        .fc-featured-date {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          display: inline-flex; align-items: center; gap: 0.2rem;
        }
        .fc-read-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: hsl(var(--primary));
          text-transform: uppercase;
          transition: gap 0.15s;
        }
        .fc-featured:hover .fc-read-btn { gap: 0.65rem; }

        /* ── Grid ── */
        .fc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        /* ── Post card ── */
        .fc-card {
          display: flex;
          flex-direction: column;
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          overflow: hidden;
          text-decoration: none;
          background: hsl(var(--background));
          transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
        }
        .fc-card:hover {
          border-color: hsl(var(--primary) / 0.28);
          transform: translateY(-3px);
          box-shadow: 0 8px 32px hsl(var(--primary) / 0.07);
        }
        .fc-card-img {
          width: 100%; height: 180px;
          object-fit: cover; display: block; opacity: 0.92;
        }
        .fc-card-body { padding: 1.25rem 1.375rem 1.5rem; flex: 1; display: flex; flex-direction: column; }
        .fc-card-title {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.3;
          color: hsl(var(--foreground));
          margin: 0 0 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fc-card-excerpt {
          font-size: 0.875rem;
          line-height: 1.6;
          color: hsl(var(--muted-foreground));
          margin: 0 0 1rem;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fc-card-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-top: 0.875rem;
          border-top: 1px solid hsl(var(--border));
        }
        .fc-card-avatar {
          width: 1.5rem; height: 1.5rem;
          border-radius: 50%; object-fit: cover; opacity: 0.85; flex-shrink: 0;
        }
        .fc-card-author { font-size: 0.75rem; font-weight: 600; color: hsl(var(--foreground)); }
        .fc-card-dot { color: hsl(var(--border)); font-size: 0.75rem; }
        .fc-card-meta {
          font-size: 0.6875rem;
          color: hsl(var(--muted-foreground));
          display: inline-flex; align-items: center; gap: 0.2rem;
        }

        /* ── Empty ── */
        .fc-empty {
          text-align: center;
          padding: 5rem 0;
          color: hsl(var(--muted-foreground));
          font-size: 0.9375rem;
        }

        /* ── Pagination ── */
        .fc-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.375rem;
        }
        .fc-page-btn {
          padding: 0.4rem 0.875rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          font-family: inherit;
        }
        .fc-page-btn:hover:not(:disabled) { border-color: hsl(var(--primary) / 0.4); color: hsl(var(--primary)); }
        .fc-page-btn.active { background: hsl(var(--primary)); color: white; border-color: hsl(var(--primary)); }
        .fc-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        @media (max-width: 900px) {
          .fc-grid { grid-template-columns: repeat(2, 1fr); }
          .fc-featured { grid-template-columns: 1fr; }
          .fc-featured-img { min-height: 200px; max-height: 240px; }
        }
        @media (max-width: 580px) {
          .fc-content { padding: 2rem 1.25rem 4rem; }
          .fc-grid { grid-template-columns: 1fr; }
          .fc-title { font-size: 2rem; }
        }
      `}</style>

      <div className="fc-page">
        <div className="fc-dot-grid" aria-hidden="true" />
        <div className="fc-glow" aria-hidden="true" />
        <div className="fc-noise" aria-hidden="true" />

        <div className="fc-content">

          {/* Header */}
          <div className="fc-header fc-anim-1">
            <h1 className="fc-title">Free Content</h1>
            <p className="fc-subtitle">Expert guides and resources to help you with your cadetship.</p>
          </div>

          {/* Search */}
          <div className="fc-search-wrap fc-anim-2">
            <Search className="fc-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search articles…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="fc-search"
            />
          </div>

          {/* Featured */}
          {featuredPost && !searchTerm && currentPage === 1 && (
            <a href={`/free-content/${featuredPost.slug}`} className="fc-featured fc-anim-3">
              <img src={featuredPost.image} alt={featuredPost.title} className="fc-featured-img" />
              <div className="fc-featured-body">
                <span className="fc-featured-badge">
                  <TrendingUp size={11} />
                  Featured
                </span>
                <h2 className="fc-featured-title">{featuredPost.title}</h2>
                <p className="fc-featured-excerpt">{featuredPost.excerpt}</p>
                <div className="fc-featured-meta">
                  {featuredPost.author_avatar && (
                    <img src={featuredPost.author_avatar} alt={featuredPost.author} className="fc-featured-avatar" />
                  )}
                  <span className="fc-featured-author">{featuredPost.author}</span>
                  <span className="fc-featured-dot">·</span>
                  <span className="fc-featured-date">
                    <Calendar size={10} />
                    {formatDate(featuredPost.date)}
                  </span>
                  {featuredPost.read_time && (
                    <>
                      <span className="fc-featured-dot">·</span>
                      <span className="fc-featured-date">
                        <Clock size={10} />
                        {featuredPost.read_time}
                      </span>
                    </>
                  )}
                </div>
                <span className="fc-read-btn">
                  Read article <ArrowRight size={13} />
                </span>
              </div>
            </a>
          )}

          {/* Grid */}
          {currentPosts.length === 0 ? (
            <div className="fc-empty fc-anim-4">No articles found.</div>
          ) : (
            <div className="fc-grid fc-anim-4">
              {currentPosts.map(post => (
                <a key={post.id} href={`/free-content/${post.slug}`} className="fc-card">
                  {post.image && (
                    <img src={post.image} alt={post.title} className="fc-card-img" />
                  )}
                  <div className="fc-card-body">
                    <h3 className="fc-card-title">{post.title}</h3>
                    <p className="fc-card-excerpt">{post.excerpt}</p>
                    <div className="fc-card-footer">
                      {post.author_avatar && (
                        <img src={post.author_avatar} alt={post.author} className="fc-card-avatar" />
                      )}
                      <span className="fc-card-author">{post.author}</span>
                      <span className="fc-card-dot">·</span>
                      <span className="fc-card-meta">
                        <Calendar size={9} />
                        {formatDate(post.date)}
                      </span>
                      {post.read_time && (
                        <>
                          <span className="fc-card-dot">·</span>
                          <span className="fc-card-meta">
                            <Clock size={9} />
                            {post.read_time} mins
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="fc-pagination fc-anim-5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="fc-page-btn"
              >
                ← Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`fc-page-btn${currentPage === i + 1 ? ' active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="fc-page-btn"
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
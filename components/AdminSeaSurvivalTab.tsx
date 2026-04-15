"use client"
import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  Save, X, Search, AlertTriangle, ArrowUp, ArrowDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Article {
  id?: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  position: number;
  image: string;
  hidden: boolean;
}

const EMPTY_ARTICLE: Article = {
  title: '', slug: '', content: '', category: '', position: 0, image: '', hidden: false,
};

// ── Article modal ──────────────────────────────────────────────────────────────

interface ArticleModalProps {
  article: Article;
  isCreating: boolean;
  saving: boolean;
  categories: string[];
  onClose: () => void;
  onSave: () => void;
  onChange: (a: Article) => void;
}

function ArticleModal({ article, isCreating, saving, categories, onClose, onSave, onChange }: ArticleModalProps) {
  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const set = (field: keyof Article, value: any) =>
    onChange({ ...article, [field]: value });

  const handleTitleChange = (title: string) =>
    onChange({ ...article, title, slug: isCreating ? generateSlug(title) : article.slug });

  const canSave = !!article.title && !!article.slug && !!article.category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            {isCreating ? 'New Article' : 'Edit Article'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Field label="Title *">
            <Input value={article.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Enter article title…" />
          </Field>
          <Field label="Slug *">
            <Input value={article.slug} onChange={e => set('slug', e.target.value)} placeholder="url-friendly-slug" mono />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category *">
              <Input value={article.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Life Rafts" list="cat-list" />
              <datalist id="cat-list">
                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Position (order within category)">
              <Input type="number" value={String(article.position)} onChange={e => set('position', Number(e.target.value))} placeholder="0" />
            </Field>
          </div>
          <Field label="Content (Markdown)">
            <Textarea value={article.content} onChange={e => set('content', e.target.value)} rows={10} placeholder="Full article content — Markdown supported…" mono />
          </Field>
          <Field label="Cover Image URL">
            <Input value={article.image} onChange={e => set('image', e.target.value)} placeholder="https://…" />
            {article.image && (
              <img src={article.image} alt="preview" className="mt-2 h-32 w-full object-cover rounded-lg"
                style={{ border: '1px solid hsl(var(--border))' }} />
            )}
          </Field>
          <div className="flex items-center gap-3 pt-1">
            <Toggle value={article.hidden} onChange={v => set('hidden', v)} onColour="hsl(0 72% 55%)" label="Hidden" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-sm hover:bg-[hsl(var(--muted))] transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving || !canSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'hsl(var(--primary))', color: 'white' }}>
            {saving
              ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
              : <><Save size={14} /> Save Article</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete modal ───────────────────────────────────────────────────────────────

function DeleteModal({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full" style={{ background: 'hsl(0 72% 55% / 0.12)' }}>
            <AlertTriangle size={18} style={{ color: 'hsl(0 72% 55%)' }} />
          </div>
          <h3 style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Delete Article?</h3>
        </div>
        <p className="mb-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Are you sure you want to delete <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>"{title}"</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'hsl(0 72% 55%)' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5"
        style={{ color: 'hsl(var(--muted-foreground))', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ mono, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input {...props}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
      style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: mono ? 'monospace' : 'inherit' }}
      onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
      onBlur={e  => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
    />
  );
}

function Textarea({ mono, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea {...props}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors resize-none"
      style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: mono ? 'monospace' : 'inherit' }}
      onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
      onBlur={e  => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
    />
  );
}

function Toggle({ value, onChange, onColour, label }: { value: boolean; onChange: (v: boolean) => void; onColour: string; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div onClick={() => onChange(!value)} className="relative transition-colors"
        style={{ width: '2.25rem', height: '1.25rem', borderRadius: '999px', background: value ? onColour : 'hsl(var(--border))' }}>
        <div className="absolute top-0.5 transition-transform"
          style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: value ? 'translateX(1.125rem)' : 'translateX(0.125rem)' }} />
      </div>
      <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{label}</span>
    </label>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export default function AdminSeaSurvivalTab() {
  const [articles, setArticles]             = useState<Article[]>([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCreating, setIsCreating]         = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);
  const [saving, setSaving]                 = useState(false);
  const [toast, setToast]                   = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sea_survival').select('*').order('category').order('position');
    if (!error && data) setArticles(data);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))];

  const filtered = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'All' || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingArticle) return;
    setSaving(true);
    const { id, ...payload } = editingArticle;

    if (id) {
      const { error } = await supabase.from('sea_survival').update(payload).eq('id', id);
      if (error) { showToast(`Failed to update: ${error.message}`, 'error'); setSaving(false); return; }
      showToast('Article updated!', 'success');
    } else {
      const { error } = await supabase.from('sea_survival').insert([payload]);
      if (error) { showToast(`Failed to create: ${error.message}`, 'error'); setSaving(false); return; }
      showToast('Article created!', 'success');
    }

    setSaving(false);
    setEditingArticle(null);
    setIsCreating(false);
    fetchArticles();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sea_survival').delete().eq('id', id);
    if (error) showToast(`Failed to delete: ${error.message}`, 'error');
    else { showToast('Article deleted', 'success'); fetchArticles(); }
    setDeleteConfirm(null);
  };

  // ── Toggle hidden ─────────────────────────────────────────────────────────
  const toggleHidden = async (id: string, current: boolean) => {
    const { error } = await supabase.from('sea_survival').update({ hidden: !current }).eq('id', id);
    if (!error) fetchArticles();
    else showToast(`Failed to update: ${error.message}`, 'error');
  };

  // ── Nudge position ────────────────────────────────────────────────────────
  const nudgePosition = async (article: Article, dir: 'up' | 'down') => {
    const newPos = dir === 'up' ? article.position - 1 : article.position + 1;
    const { error } = await supabase.from('sea_survival').update({ position: newPos }).eq('id', article.id!);
    if (!error) fetchArticles();
    else showToast(`Failed to reorder: ${error.message}`, 'error');
  };

  const deleteTarget = articles.find(a => a.id === deleteConfirm);

  return (
    <div className="relative">

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-white text-sm"
          style={{ background: toast.type === 'success' ? 'hsl(142 60% 40%)' : 'hsl(0 72% 55%)' }}>
          {toast.message}
        </div>
      )}

      {editingArticle && (
        <ArticleModal article={editingArticle} isCreating={isCreating} saving={saving} categories={categories}
          onClose={() => { setEditingArticle(null); setIsCreating(false); }}
          onSave={handleSave} onChange={setEditingArticle} />
      )}

      {deleteConfirm && deleteTarget && (
        <DeleteModal title={deleteTarget.title}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Sea Survival</h2>
          <p className="mt-0.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''} across {categories.length - 1} topic{categories.length - 1 !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { setEditingArticle({ ...EMPTY_ARTICLE }); setIsCreating(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ background: 'hsl(var(--primary))', color: 'white' }}>
          <Plus size={15} /> New Article
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input type="text" placeholder="Search by title or category…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filterCategory === cat
                ? { background: 'hsl(var(--primary))', color: 'white' }
                : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No articles found.</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.5)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Article</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'hsl(var(--muted-foreground))' }}>Position</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article, idx) => (
                <tr key={article.id} className="transition-colors"
                  style={{ borderBottom: idx < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none', background: 'hsl(var(--background))' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--background))')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {article.image && (
                        <img src={article.image} alt="" className="w-12 h-9 object-cover rounded-md flex-shrink-0 hidden sm:block"
                          style={{ border: '1px solid hsl(var(--border))' }} />
                      )}
                      <div>
                        <p className="font-semibold line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{article.title}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{article.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                      {article.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => nudgePosition(article, 'up')} title="Move up"
                        className="p-1 rounded transition-colors hover:bg-[hsl(var(--muted))]"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <ArrowUp size={13} />
                      </button>
                      <span className="text-xs tabular-nums w-5 text-center" style={{ color: 'hsl(var(--foreground))' }}>
                        {article.position}
                      </span>
                      <button onClick={() => nudgePosition(article, 'down')} title="Move down"
                        className="p-1 rounded transition-colors hover:bg-[hsl(var(--muted))]"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {article.hidden
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'hsl(0 72% 55% / 0.1)', color: 'hsl(0 72% 55%)' }}>Hidden</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'hsl(142 60% 40% / 0.1)', color: 'hsl(142 60% 40%)' }}>Live</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleHidden(article.id!, article.hidden)}
                        title={article.hidden ? 'Make visible' : 'Hide'}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: article.hidden ? 'hsl(0 72% 55%)' : 'hsl(var(--muted-foreground))' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {article.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => { setEditingArticle({ ...article }); setIsCreating(false); }}
                        title="Edit" className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.08)'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(article.id!)}
                        title="Delete" className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'hsl(0 72% 55% / 0.08)'; e.currentTarget.style.color = 'hsl(0 72% 55%)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
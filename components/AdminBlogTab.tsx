"use client"
import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star,
  Save, X, Search, AlertTriangle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BlogPost {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
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

const EMPTY_POST: BlogPost = {
  title: '', excerpt: '', content: '', slug: '', author: '',
  author_avatar: '', date: new Date().toISOString().split('T')[0],
  category: '', image: '', read_time: '', featured: false, hidden: false,
};

// ── Lifted outside the parent so React never recreates the component type ──────

interface PostModalProps {
  post: BlogPost;
  isCreating: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (post: BlogPost) => void;
}

function PostModal({ post, isCreating, saving, onClose, onSave, onChange }: PostModalProps) {
  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const set = (field: keyof BlogPost, value: any) =>
    onChange({ ...post, [field]: value });

  const handleTitleChange = (title: string) =>
    onChange({ ...post, title, slug: isCreating ? generateSlug(title) : post.slug });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {isCreating ? 'New Blog Post' : 'Edit Blog Post'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={post.title}
              onChange={e => handleTitleChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter post title..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              value={post.slug}
              onChange={e => set('slug', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="url-friendly-slug"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={post.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Short summary of the post..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
            <textarea
              value={post.content}
              onChange={e => set('content', e.target.value)}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Full post content (Markdown supported)..."
            />
          </div>

          {/* Author + Avatar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Author *</label>
              <input
                type="text"
                value={post.author}
                onChange={e => set('author', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Author name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Author Avatar URL</label>
              <input
                type="text"
                value={post.author_avatar}
                onChange={e => set('author_avatar', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Category + Date + Read time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                value={post.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Navigation"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={post.date}
                onChange={e => set('date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Read Time</label>
              <input
                type="text"
                value={post.read_time}
                onChange={e => set('read_time', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5 min read"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Image URL</label>
            <input
              type="text"
              value={post.image}
              onChange={e => set('image', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://images.unsplash.com/..."
            />
            {post.image && (
              <img src={post.image} alt="preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
            )}
          </div>

          {/* Toggles */}
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set('featured', !post.featured)}
                className={`w-10 h-6 rounded-full transition-colors ${post.featured ? 'bg-yellow-400' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 mt-1 rounded-full bg-white shadow transition-transform ${post.featured ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set('hidden', !post.hidden)}
                className={`w-10 h-6 rounded-full transition-colors ${post.hidden ? 'bg-red-400' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 mt-1 rounded-full bg-white shadow transition-transform ${post.hidden ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Hidden</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !post.title || !post.slug || !post.author || !post.category}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  postTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ postTitle, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="text-red-500" size={20} /></div>
          <h3 className="text-lg font-bold text-gray-900">Delete Post?</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-semibold">"{postTitle}"</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main tab component ─────────────────────────────────────────────────────────

export default function AdminBlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts').select('*').order('date', { ascending: false });
    if (!error && data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter(post => {
    const matchSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'All' || post.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    if (!editingPost) return;
    setSaving(true);
    const { id, ...payload } = editingPost;

    if (id) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', id);
      if (error) { showToast(`Failed to update: ${error.message}`, 'error'); setSaving(false); return; }
      showToast('Post updated!', 'success');
    } else {
      const { error } = await supabase.from('blog_posts').insert([payload]);
      if (error) { showToast(`Failed to create: ${error.message}`, 'error'); setSaving(false); return; }
      showToast('Post created!', 'success');
    }

    setSaving(false);
    setEditingPost(null);
    setIsCreating(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) showToast('Failed to delete post', 'error');
    else { showToast('Post deleted', 'success'); fetchPosts(); }
    setDeleteConfirm(null);
  };

  const toggleField = async (id: string, field: 'hidden' | 'featured', current: boolean) => {
    if (field === 'featured' && !current) {
      await supabase.from('blog_posts').update({ featured: false }).neq('id', id);
    }
    const { error } = await supabase.from('blog_posts').update({ [field]: !current }).eq('id', id);
    if (!error) fetchPosts();
  };

  const deletePost = posts.find(p => p.id === deleteConfirm);

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-white transition-all ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {editingPost && (
        <PostModal
          post={editingPost}
          isCreating={isCreating}
          saving={saving}
          onClose={() => { setEditingPost(null); setIsCreating(false); }}
          onSave={handleSave}
          onChange={setEditingPost}
        />
      )}

      {deleteConfirm && deletePost && (
        <DeleteModal
          postTitle={deletePost.title}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Posts</h2>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} total posts</p>
        </div>
        <button
          onClick={() => { setEditingPost({ ...EMPTY_POST }); setIsCreating(true); }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No posts found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Post</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Date</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.image && (
                        <img src={post.image} alt="" className="w-12 h-9 object-cover rounded-md flex-shrink-0 hidden sm:block" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-400">{post.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{post.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {post.featured && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Featured</span>}
                      {post.hidden  && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">Hidden</span>}
                      {!post.featured && !post.hidden && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Live</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleField(post.id!, 'featured', post.featured)}
                        title={post.featured ? 'Unfeature' : 'Set as featured'}
                        className={`p-1.5 rounded-lg transition-colors ${post.featured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'}`}
                      >
                        <Star size={16} fill={post.featured ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => toggleField(post.id!, 'hidden', post.hidden)}
                        title={post.hidden ? 'Make visible' : 'Hide post'}
                        className={`p-1.5 rounded-lg transition-colors ${post.hidden ? 'text-red-400 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                      >
                        {post.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => { setEditingPost({ ...post }); setIsCreating(false); }}
                        title="Edit post"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(post.id!)}
                        title="Delete post"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
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
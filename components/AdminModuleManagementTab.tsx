'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Edit, Eye, EyeOff, Trash2, Plus, X,
  Save, ChevronDown, ChevronUp, Tag, Image, Clock, BarChart2,
  Star, Sparkles, AlertCircle, CheckCircle2, Layers, BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AdminModal from '@/components/AdminModal'

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  subcategory: string;
  hidden: boolean | null;
  is_premium: boolean | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  estimated_hours: number | null;
  total_lessons: number | null;
  accent_color: string | null;
  image_url: string | null;
  tags: string[] | null;
  // Content fields — one of these holds the module's page structure
  blocks: any[] | null;
  pages: any[] | null;
  content: { pages?: any[]; blocks?: any[] } | null;
  created_at: string;
  updated_at: string | null;
  // Derived after fetch — not persisted to DB
  _pageCount?: number;
  _totalMinutes?: number;
}

type EditableFields = Pick<
  Module,
  'title' | 'slug' | 'description' | 'category' | 'subcategory' |
  'is_premium' | 'is_new' | 'is_featured' | 'difficulty' |
  'estimated_hours' | 'total_lessons' | 'accent_color' | 'image_url' | 'tags'
>;

// ─── Resolve page count + total time from any module content format ────────────

/**
 * Works with three possible storage shapes:
 *   1. top-level `pages` array          — new format
 *   2. `content.pages`                  — new format nested under content
 *   3. flat `blocks` / `content.blocks` — legacy format with page-break separators
 */
function resolveModulePages(m: Module): { pageCount: number; totalMinutes: number } {
  const pagesArr: any[] | null =
    (Array.isArray(m.pages) && m.pages.length > 0 ? m.pages : null) ??
    (Array.isArray(m.content?.pages) && m.content!.pages!.length > 0 ? m.content!.pages : null);

  if (pagesArr) {
    return {
      pageCount: pagesArr.length,
      totalMinutes: pagesArr.reduce((s: number, p: any) => s + (p.estimatedMinutes || 5), 0),
    };
  }

  const rawBlocks: any[] =
    (Array.isArray(m.blocks) ? m.blocks : null) ??
    (Array.isArray(m.content?.blocks) ? m.content!.blocks! : []);

  if (rawBlocks.length === 0) return { pageCount: 0, totalMinutes: 0 };

  let pageCount = 0;
  let totalMinutes = 0;
  let hasContent = false;
  for (const block of rawBlocks) {
    if (block.type === 'page-break') {
      pageCount++;
      totalMinutes += block.content?.estimatedMinutes || 5;
      hasContent = false;
    } else {
      hasContent = true;
    }
  }
  // Trailing page after last break (or a single page with no breaks)
  if (hasContent || pageCount === 0) pageCount++;
  if (pageCount > 0 && totalMinutes === 0) totalMinutes = pageCount * 5;
  return { pageCount, totalMinutes };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-in fade-in slide-in-from-bottom-2
          ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {t.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Category Manager Modal ───────────────────────────────────────────────────

interface CategoryManagerProps {
  onClose: () => void;
  onUpdate: () => void;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const CATEGORY_COLOURS = [
  '#2966f4', '#7c3aed', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#6366f1',
];

function CategoryManager({ onClose, onUpdate, addToast }: CategoryManagerProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; description: string | null; color: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLOURS[0]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState(CATEGORY_COLOURS[0]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const addCategory = async () => {
    if (!newName.trim()) return;
    const payload: Record<string, any> = { name: newName.trim(), description: newDesc.trim() || null, color: newColor };
    let { error } = await supabase.from('categories').insert(payload);
    if (error?.message.includes('color')) {
      delete payload.color;
      ({ error } = await supabase.from('categories').insert(payload));
    }
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Category added');
    setNewName(''); setNewDesc(''); setNewColor(CATEGORY_COLOURS[0]);
    fetchCategories(); onUpdate();
  };

  const updateCategory = async (id: string) => {
    if (!editName.trim()) return;
    const payload: Record<string, any> = { name: editName.trim(), description: editDesc.trim() || null, color: editColor };
    let { error } = await supabase.from('categories').update(payload).eq('id', id);
    if (error?.message.includes('color')) {
      delete payload.color;
      ({ error } = await supabase.from('categories').update(payload).eq('id', id));
    }
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Category updated');
    setEditing(null);
    fetchCategories(); onUpdate();
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Category deleted');
    fetchCategories(); onUpdate();
  };

  return (
      <AdminModal onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" /> Manage Categories
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">Add New Category</h3>
            <div className="space-y-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name…"
                className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)…"
                className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <div>
                <p className="text-xs font-medium text-purple-800 mb-1.5">Category colour</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {CATEGORY_COLOURS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${newColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    className="h-7 w-7 p-0.5 border border-purple-300 rounded-full cursor-pointer" title="Custom colour" />
                </div>
              </div>
              <button onClick={addCategory} disabled={!newName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors">
                <Plus className="h-4 w-4" /> Add Category
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-sm text-gray-500 py-4">Loading…</p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="border border-gray-200 rounded-xl p-4">
                  {editing === cat.id ? (
                    <div className="space-y-2">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description…"
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1.5">Colour</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {CATEGORY_COLOURS.map(c => (
                            <button key={c} onClick={() => setEditColor(c)}
                              className={`h-6 w-6 rounded-full border-2 transition-transform ${editColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'}`}
                              style={{ background: c }} />
                          ))}
                          <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                            className="h-6 w-6 p-0.5 border border-gray-300 rounded-full cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateCategory(cat.id)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Save</button>
                        <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full flex-shrink-0 shadow-sm" style={{ background: cat.color || '#6b7280' }} />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                          {cat.description && <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditing(cat.id); setEditName(cat.name); setEditDesc(cat.description || ''); setEditColor(cat.color || CATEGORY_COLOURS[0]); }}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deleteCategory(cat.id, cat.name)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t">
          <button onClick={onClose} className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Close</button>
        </div>
      </div>
    </AdminModal>
  );
}

// ─── Inline Edit Panel ────────────────────────────────────────────────────────

interface EditPanelProps {
  module: Module;
  categories: { name: string; color: string | null }[];
  onSave: (id: string, fields: Partial<EditableFields>) => Promise<void>;
  onClose: () => void;
}

function EditPanel({ module, categories, onSave, onClose }: EditPanelProps) {
  const [form, setForm] = useState<EditableFields>({
    title: module.title,
    slug: module.slug,
    description: module.description || '',
    category: module.category,
    subcategory: module.subcategory || '',
    is_premium: module.is_premium ?? false,
    is_new: module.is_new ?? false,
    is_featured: module.is_featured ?? false,
    difficulty: module.difficulty ?? 'Beginner',
    estimated_hours: module.estimated_hours ?? 1,
    total_lessons: module.total_lessons ?? 0,
    accent_color: module.accent_color || '#2966f4',
    image_url: module.image_url || '',
    tags: module.tags || [],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof EditableFields, value: any) => setForm(f => ({ ...f, [key]: value }));
  const selectedCatColor = categories.find(c => c.name === form.category)?.color || '#6b7280';

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags!.includes(t)) { set('tags', [...(form.tags || []), t]); }
    setTagInput('');
  };
  const removeTag = (tag: string) => set('tags', (form.tags || []).filter(t => t !== tag));

  const handleSave = async () => {
    setSaving(true);
    await onSave(module.id, form);
    setSaving(false);
  };

  return (
    <AdminModal onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderTop: `3px solid ${selectedCatColor}` }}>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" /> Edit Module
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: selectedCatColor }} />
              <span className="text-xs text-gray-500">{form.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Info</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={e => { set('title', e.target.value); set('subcategory', e.target.value); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                <input value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ background: selectedCatColor }} />
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t pt-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Display Settings</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={form.difficulty || 'Beginner'} onChange={e => set('difficulty', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input type="number" min="0" step="0.5" value={form.estimated_hours ?? ''}
                    onChange={e => set('estimated_hours', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Lessons (override)</label>
                <input type="number" min="0" value={form.total_lessons ?? ''}
                  onChange={e => set('total_lessons', parseInt(e.target.value) || 0)}
                  placeholder="Leave 0 to auto-count from pages"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                <input value={form.image_url || ''} onChange={e => set('image_url', e.target.value)}
                  placeholder="https://images.unsplash.com/photo-…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                {form.image_url && (
                  <div className="mt-2 h-24 w-full rounded-lg overflow-hidden border border-gray-200">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="border-t pt-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.tags || []).map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter…"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={addTag} className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors font-medium">Add</button>
            </div>
          </section>

          <section className="border-t pt-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Flags</h3>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'is_premium', label: 'Premium', icon: Sparkles, color: 'purple' },
                { key: 'is_new', label: 'New', icon: Star, color: 'emerald' },
                { key: 'is_featured', label: 'Featured', icon: Star, color: 'amber' },
              ] as const).map(({ key, label, icon: Icon, color }) => (
                <button key={key}
                  onClick={() => set(key, !form[key])}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${form[key]
                      ? `bg-${color}-50 border-${color}-300 text-${color}-700`
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}>
                  <Icon className="h-4 w-4" />
                  {label}
                  {form[key] && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Cancel</button>
        </div>
      </div>
    </AdminModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminModuleManagementTab: React.FC = () => {
  const [modules,           setModules]           = useState<Module[]>([]);
  const [filteredModules,   setFilteredModules]   = useState<Module[]>([]);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [selectedCategory,  setSelectedCategory]  = useState('all');
  const [loading,           setLoading]           = useState(true);
  const [categories,        setCategories]        = useState<{ name: string; color: string | null }[]>([]);
  const [showCatManager,    setShowCatManager]    = useState(false);
  const [editingModule,     setEditingModule]     = useState<Module | null>(null);
  const [expandedId,        setExpandedId]        = useState<string | null>(null);
  const { toasts, addToast } = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchModules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('category').order('subcategory').order('title');
    if (error) { addToast(error.message, 'error'); }
    else {
      // Derive page count + total minutes from actual content
      const enriched = (data || []).map((m: any) => {
        const { pageCount, totalMinutes } = resolveModulePages(m);
        return { ...m, _pageCount: pageCount, _totalMinutes: totalMinutes };
      });
      setModules(enriched);
    }
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('name, color').order('name');
    if (error && error.message.includes('color')) {
      const { data: fallback } = await supabase.from('categories').select('name').order('name');
      setCategories((fallback || []).map((c: any) => ({ name: c.name, color: null })));
    } else {
      setCategories((data || []).map((c: any) => ({ name: c.name, color: c.color ?? null })));
    }
  }, []);

  useEffect(() => { fetchModules(); fetchCategories(); }, [fetchModules, fetchCategories]);

  useEffect(() => {
    let filtered = [...modules];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(t) ||
        m.category.toLowerCase().includes(t) ||
        (m.subcategory || '').toLowerCase().includes(t) ||
        (m.tags || []).some(tag => tag.toLowerCase().includes(t))
      );
    }
    if (selectedCategory !== 'all') filtered = filtered.filter(m => m.category === selectedCategory);
    setFilteredModules(filtered);
  }, [modules, searchTerm, selectedCategory]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleHidden = async (module: Module) => {
    const newVal = !module.hidden;
    const { error } = await supabase.from('modules').update({ hidden: newVal }).eq('id', module.id);
    if (error) { addToast(error.message, 'error'); return; }
    setModules(prev => prev.map(m => m.id === module.id ? { ...m, hidden: newVal } : m));
    addToast(`Module ${newVal ? 'hidden' : 'made visible'}`);
  };

  const deleteModule = async (module: Module) => {
    if (!confirm(`Delete "${module.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('modules').delete().eq('id', module.id);
    if (error) { addToast(error.message, 'error'); return; }
    setModules(prev => prev.filter(m => m.id !== module.id));
    addToast('Module deleted');
  };

  const saveModule = async (id: string, fields: Partial<EditableFields>) => {
    const payload: Record<string, any> = {
      title:           fields.title,
      slug:            fields.slug,
      description:     fields.description || null,
      category:        fields.category,
      subcategory:     fields.subcategory || fields.title,
      is_premium:      fields.is_premium ?? false,
      is_new:          fields.is_new ?? false,
      is_featured:     fields.is_featured ?? false,
      difficulty:      fields.difficulty,
      estimated_hours: fields.estimated_hours ?? null,
      total_lessons:   fields.total_lessons ?? null,
      image_url:       fields.image_url || null,
      tags:            fields.tags && fields.tags.length > 0 ? fields.tags : null,
      updated_at:      new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('modules')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) { addToast(`Save failed: ${error.message}`, 'error'); return; }
    if (!data || data.length === 0) {
      addToast('Save failed — no rows updated.', 'error');
      return;
    }

    // Re-derive page stats so the row stays accurate after save
    setModules(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, ...payload };
      const { pageCount, totalMinutes } = resolveModulePages(updated);
      return { ...updated, _pageCount: pageCount, _totalMinutes: totalMinutes };
    }));
    setEditingModule(null);
    addToast('Module saved ✓');
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const visibleCount = modules.filter(m => !m.hidden).length;
  const hiddenCount  = modules.filter(m => m.hidden).length;
  const premiumCount = modules.filter(m => m.is_premium).length;

  // ── Group for display ──────────────────────────────────────────────────────

  const grouped = filteredModules.reduce((acc, m) => {
    const cat = m.category || 'Uncategorised';
    const sub = m.subcategory || 'General';
    if (!acc[cat]) acc[cat] = {};
    if (!acc[cat][sub]) acc[cat][sub] = [];
    acc[cat][sub].push(m);
    return acc;
  }, {} as Record<string, Record<string, Module[]>>);

  const categoryNames = categories.map(c => c.name);
  const allCategories = ['all', ...categoryNames];
  const categoryColorMap = Object.fromEntries(categories.map(c => [c.name, c.color || '#111827']));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Tab header row — title + actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Module Management</h2>
          <p style={{ fontSize: '11px', color: '#737373', margin: 0 }}>
            {modules.length} modules · {visibleCount} visible · {hiddenCount} hidden · {premiumCount} premium
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCatManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors font-medium">
            <Layers className="h-4 w-4" /> Categories
          </button>
          <Link href="/admin/module-builder"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium">
            <Plus className="h-4 w-4" /> New Module
          </Link>
          <button onClick={fetchModules}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Modules', value: modules.length,    color: 'text-gray-900',    bg: 'bg-white' },
            { label: 'Visible',       value: visibleCount,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Hidden',        value: hiddenCount,       color: 'text-amber-600',   bg: 'bg-amber-50' },
            { label: 'Premium',       value: premiumCount,      color: 'text-purple-600',  bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-gray-100`}>
              <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search modules, categories, tags…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
            {allCategories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
          </select>
        </div>

        {/* Module list */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 text-sm">Loading modules…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">No modules found</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, subcategories]) => (
              <div key={category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-3.5 flex items-center justify-between"
                  style={{ background: categoryColorMap[category] || '#111827' }}>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-white/60" /> {category}
                  </h2>
                  <span className="text-xs text-white/60">{Object.values(subcategories).flat().length} modules</span>
                </div>

                {Object.entries(subcategories).map(([subcategory, mods]) => (
                  <div key={subcategory} className="border-t border-gray-100">
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{subcategory}</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {mods.map(module => (
                        <div key={module.id} className={`transition-colors ${module.hidden ? 'opacity-60' : ''}`}>
                          <div className="px-6 py-4 flex items-center gap-4">
                            {module.image_url && (
                              <div className="h-12 w-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={module.image_url} alt={module.title || 'Module thumbnail'} className="w-full h-full object-cover" />
                              </div>
                            )}

                            <div className="h-3 w-3 rounded-full flex-shrink-0 border-2 border-white shadow"
                              style={{ background: module.accent_color || '#2966f4' }} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{module.title}</span>
                                {module.hidden && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">HIDDEN</span>}
                                {module.is_premium && <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">PREMIUM</span>}
                                {module.is_new && <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">NEW</span>}
                                {module.is_featured && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">⭐ FEATURED</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                <Link href={`/modules/${module.slug}`} className="font-mono hover:text-blue-600 transition-colors">
                                  /{module.slug}
                                </Link>
                                {module.difficulty && (
                                  <span className="flex items-center gap-1">
                                    <BarChart2 className="h-3 w-3" />{module.difficulty}
                                  </span>
                                )}
                                {/* Page count — derived from actual content structure */}
                                {!!module._pageCount && (
                                  <span className="flex items-center gap-1 text-blue-500 font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {module._pageCount} {module._pageCount === 1 ? 'page' : 'pages'}
                                  </span>
                                )}
                                {/* Total time — derived from actual content structure */}
                                {!!module._totalMinutes && (
                                  <span className="flex items-center gap-1 text-blue-500 font-medium">
                                    <Clock className="h-3 w-3" />
                                    {module._totalMinutes} min
                                  </span>
                                )}
                                {(module.tags || []).length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />{module.tags!.slice(0, 3).join(', ')}
                                  </span>
                                )}
                                <span>Updated {new Date(module.updated_at || module.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => setEditingModule(module)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Edit metadata">
                                <Edit className="h-4 w-4" />
                              </button>
                              <Link href={`/admin/module-builder?import=${module.id}`}
                                className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="Edit content">
                                <Layers className="h-4 w-4" />
                              </Link>
                              <button onClick={() => toggleHidden(module)}
                                className={`p-2 rounded-xl transition-colors ${module.hidden ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                title={module.hidden ? 'Make visible' : 'Hide'}>
                                {module.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button onClick={() => deleteModule(module)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCatManager && (
        <CategoryManager onClose={() => setShowCatManager(false)} onUpdate={fetchCategories} addToast={addToast} />
      )}

      {editingModule && (
        <EditPanel module={editingModule} categories={categories} onSave={saveModule} onClose={() => setEditingModule(null)} />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default AdminModuleManagementTab;
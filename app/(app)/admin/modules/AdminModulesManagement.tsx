'use client';

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Edit, Eye, EyeOff, Trash2, Plus, X } from 'lucide-react';
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategoryManagerProps {
  categories: string[];
  onUpdate: () => void;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdate, onClose }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add category');
      }

      setNewCategoryName('');
      setNewCategoryDesc('');
      onUpdate();
      alert('Category added successfully!');
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(`Failed to add category: ${error.message}`);
    }
  };

  const updateCategory = async (oldName: string) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName,
          newName: editName.trim(),
          description: editDesc.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      setEditingCategory(null);
      setEditName('');
      setEditDesc('');
      onUpdate();
      alert('Category updated successfully!');
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert(`Failed to update category: ${error.message}`);
    }
  };

  const deleteCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories?name=${encodeURIComponent(categoryName)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      onUpdate();
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete category: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Category */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">Add New Category</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="w-full px-3 py-2 border border-green-300 rounded-md"
              />
              <input
                type="text"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full px-3 py-2 border border-green-300 rounded-md"
              />
              <button
                onClick={addCategory}
                disabled={!newCategoryName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
                Add Category
              </button>
            </div>
          </div>

          {/* Existing Categories */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Existing Categories ({categories.length})</h3>
            {categories.map((category) => (
              <div
                key={category}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                {editingCategory === category ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name..."
                      className="w-full px-3 py-2 border border-blue-300 rounded-md"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      className="w-full px-3 py-2 border border-blue-300 rounded-md"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateCategory(category)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          setEditName('');
                          setEditDesc('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{category}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setEditName(category);
                          setEditDesc('');
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface Module {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  hidden: boolean | null;
  created_at: string;
  updated_at?: string;
}

interface GroupedModules {
  [category: string]: {
    [subcategory: string]: Module[];
  };
}

const AdminModulesManagement: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [showCategoryManager, setShowCategoryManager] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Get Supabase credentials from environment variables
  const SUPABASE_URL = 'https://wxxrjsazwycwcmifvyuo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eHJqc2F6d3ljd2NtaWZ2eXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTIzNjUsImV4cCI6MjA4MzAyODM2NX0.bD5HsE8V_0j9IhKgBebTDLXhXsjjjcnd7m0-SKCEqR0';

  // Import Supabase client
  const supabase = typeof window !== 'undefined' ? (() => {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  })() : null;

  useEffect(() => {
    fetchModules();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterModules();
  }, [modules, searchTerm, selectedCategory]);

  const fetchModules = async (): Promise<void> => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('category')
        .order('subcategory')
        .order('title');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      alert('Failed to fetch modules');
    }
    setLoading(false);
  };

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      setCategories(result.data?.map((c: any) => c.name) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterModules = (): void => {
    let filtered = [...modules];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term) ||
        m.subcategory.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    setFilteredModules(filtered);
  };

  const toggleHidden = async (module: Module): Promise<void> => {
    console.log('Toggling module:', module.id, 'to hidden:', !module.hidden);
    
    try {
      const response = await fetch('/api/admin/toggle-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: module.id,
          hidden: !module.hidden
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update module');
      }

      console.log('Update successful:', result);

      // Update local state
      setModules(modules.map(m => 
        m.id === module.id ? { ...m, hidden: !module.hidden } : m
      ));
      
      alert(`Module ${!module.hidden ? 'hidden' : 'shown'} successfully!`);
    } catch (error: any) {
      console.error('Error toggling hidden:', error);
      alert(`Failed to update module visibility: ${error.message || error}`);
    }
  };

  const deleteModule = async (moduleId: string, title: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/modules?id=${encodeURIComponent(moduleId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete module');
      }

      // Update local state
      setModules(modules.filter(m => m.id !== moduleId));
      alert('Module deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting module:', error);
      alert(`Failed to delete module: ${error.message}`);
    }
  };

  const handleEdit = async (module: Module): Promise<void> => {
    try {
      // Fetch the full module data including content
      const response = await fetch(`/api/modules?slug=${encodeURIComponent(module.slug)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch module');
      }

      // Store the complete module data in sessionStorage
      sessionStorage.setItem('importModule', JSON.stringify(result.data));
      
      // Navigate to module builder
      window.location.href = `/admin/module-builder?import=${module.id}`;
    } catch (error: any) {
      console.error('Error loading module for editing:', error);
      alert(`Failed to load module: ${error.message}`);
    }
  };

  const allCategories = ['all', ...categories];
  const visibleCount = modules.filter(m => !m.hidden).length;
  const hiddenCount = modules.filter(m => m.hidden).length;

  const groupedModules: GroupedModules = filteredModules.reduce((acc, module) => {
    const cat = module.category;
    const subcat = module.subcategory;
    
    if (!acc[cat]) acc[cat] = {};
    if (!acc[cat][subcat]) acc[cat][subcat] = [];
    
    acc[cat][subcat].push(module);
    return acc;
  }, {} as GroupedModules);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Module Management</h1>
          <p className="text-gray-600">Manage your training modules</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Modules</div>
            <div className="text-3xl font-bold text-gray-900">{modules.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Visible</div>
            <div className="text-3xl font-bold text-green-600">{visibleCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Hidden</div>
            <div className="text-3xl font-bold text-yellow-600">{hiddenCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Categories</div>
            <div className="text-3xl font-bold text-purple-600">{categories.length}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Categories
            </button>
            <button
              onClick={fetchModules}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Category Manager */}
        {showCategoryManager && (
          <CategoryManager 
            categories={categories}
            onUpdate={fetchCategories}
            onClose={() => setShowCategoryManager(false)}
          />
        )}

        {/* Modules List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading modules...</div>
          </div>
        ) : Object.keys(groupedModules).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-600">No modules found</div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedModules).map(([category, subcategories]) => (
              <div key={category}>
                <div className="bg-blue-600 text-white px-6 py-3 rounded-t-lg font-semibold text-lg">
                  {category}
                </div>
                <div className="bg-white rounded-b-lg shadow overflow-hidden">
                  {Object.entries(subcategories).map(([subcategory, mods]) => (
                    <div key={subcategory} className="border-b last:border-b-0">
                      <div className="bg-gray-100 px-6 py-2 font-medium text-gray-700">
                        {subcategory}
                      </div>
                      <div className="divide-y">
                        {mods.map(module => (
                          <div
                            key={module.id}
                            className={`p-6 transition-colors ${module.hidden ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {module.title}
                                  </h3>
                                  {module.hidden && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>
                                    Slug:{" "}
                                    <Link
                                      href={`/modules/${module.slug}`}
                                      className="font-mono text-blue-600 hover:underline"
                                    >
                                      {module.slug}
                                    </Link>
                                  </div>
                                  <div>Last updated: {new Date(module.updated_at || module.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEdit(module)}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={20} />
                                </button>
                                <button
                                  onClick={() => toggleHidden(module)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    module.hidden
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                      : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                  }`}
                                  title={module.hidden ? 'Show' : 'Hide'}
                                >
                                  {module.hidden ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                                <button
                                  onClick={() => deleteModule(module.id, module.title)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModulesManagement;
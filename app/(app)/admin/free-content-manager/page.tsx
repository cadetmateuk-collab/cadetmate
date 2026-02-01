"use client"
import { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  Search,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';

export default function BlogAdmin() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Understanding Celestial Navigation in Modern Times",
      excerpt: "Discover how ancient navigation techniques remain relevant for today's mariners...",
      content: "<p>Full blog content with HTML formatting...</p>",
      slug: "celestial-navigation-modern-times",
      author: "Captain James Wilson",
      date: "2024-01-28",
      category: "Navigation",
      image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800",
      readTime: "5 min read",
      featured: true,
      published: true,
    },
    {
      id: 2,
      title: "Essential Safety Equipment Every Vessel Should Have",
      excerpt: "A comprehensive guide to the must-have safety gear...",
      content: "<p>Full blog content with HTML formatting...</p>",
      slug: "essential-safety-equipment",
      author: "Sarah Martinez",
      date: "2024-01-25",
      category: "Safety",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
      readTime: "7 min read",
      featured: false,
      published: true,
    },
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = ['Navigation', 'Safety', 'Weather', 'Seamanship'];

  const emptyPost = {
    id: null,
    title: '',
    excerpt: '',
    content: '',
    slug: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Navigation',
    image: '',
    readTime: '',
    featured: false,
    published: false,
  };

  const handleEdit = (post) => {
    setCurrentPost(post);
    setIsEditing(true);
  };

  const handleNew = () => {
    setCurrentPost(emptyPost);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (currentPost.id) {
      setPosts(posts.map(p => p.id === currentPost.id ? currentPost : p));
    } else {
      setPosts([...posts, { ...currentPost, id: Date.now() }]);
    }
    setIsEditing(false);
    setCurrentPost(null);
    alert('Post saved successfully!');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(p => p.id !== id));
      alert('Post deleted successfully!');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPost(null);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'published' && post.published) ||
      (filterStatus === 'draft' && !post.published) ||
      (filterStatus === 'featured' && post.featured);
    return matchesSearch && matchesStatus;
  });

  if (isEditing && currentPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Editor Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentPost.id ? 'Edit Post' : 'New Post'}
              </h1>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save size={18} />
                  Save Post
                </button>
              </div>
            </div>
          </div>

          {/* Editor Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={currentPost.title}
                  onChange={(e) => {
                    setCurrentPost({
                      ...currentPost,
                      title: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  placeholder="Enter post title..."
                  className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={currentPost.slug}
                  onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                  placeholder="post-url-slug"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL: /blog/{currentPost.slug}
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={currentPost.excerpt}
                  onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                  placeholder="Brief description of the post..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (HTML)
                </label>
                <textarea
                  value={currentPost.content}
                  onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                  placeholder="<p>Write your post content in HTML...</p>"
                  rows={12}
                  className="w-full px-4 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={currentPost.author}
                    onChange={(e) => setCurrentPost({ ...currentPost, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={currentPost.category}
                    onChange={(e) => setCurrentPost({ ...currentPost, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={currentPost.date}
                    onChange={(e) => setCurrentPost({ ...currentPost, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={currentPost.readTime}
                    onChange={(e) => setCurrentPost({ ...currentPost, readTime: e.target.value })}
                    placeholder="5 min read"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  value={currentPost.image}
                  onChange={(e) => setCurrentPost({ ...currentPost, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {currentPost.image && (
                  <img
                    src={currentPost.image}
                    alt="Preview"
                    className="mt-4 w-full max-w-md rounded-lg"
                  />
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPost.published}
                    onChange={(e) => setCurrentPost({ ...currentPost, published: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="font-medium text-gray-700">Published</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPost.featured}
                    onChange={(e) => setCurrentPost({ ...currentPost, featured: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="font-medium text-gray-700">Featured Post</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Administration</h1>
              <p className="text-gray-600 mt-1">Manage your blog posts</p>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus size={20} />
              New Post
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'published', 'draft', 'featured'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {post.title}
                            </h3>
                            {post.featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                <TrendingUp size={12} />
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{post.author}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        post.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        {post.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
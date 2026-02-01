"use client"
import { useState } from 'react';
import { Search, Calendar, User, Clock, TrendingUp, ArrowRight, Tag } from 'lucide-react';

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Sample blog data - replace with Supabase fetch
  const posts = [
    {
      id: 1,
      title: "Understanding Celestial Navigation in Modern Times",
      excerpt: "Discover how ancient navigation techniques remain relevant for today's mariners and how they complement modern GPS technology.",
      slug: "celestial-navigation-modern-times",
      author: "Captain James Wilson",
      authorAvatar: "https://i.pravatar.cc/150?img=12",
      date: "2024-01-28",
      category: "Navigation",
      image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800",
      readTime: "5 min read",
      featured: true,
    },
    {
      id: 2,
      title: "Essential Safety Equipment Every Vessel Should Have",
      excerpt: "A comprehensive guide to the must-have safety gear that could save lives in emergency situations at sea.",
      slug: "essential-safety-equipment",
      author: "Sarah Martinez",
      authorAvatar: "https://i.pravatar.cc/150?img=5",
      date: "2024-01-25",
      category: "Safety",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
      readTime: "7 min read",
      featured: false,
    },
    {
      id: 3,
      title: "Reading Weather Patterns: A Sailor's Guide",
      excerpt: "Learn to interpret cloud formations, wind patterns, and atmospheric pressure to predict weather changes.",
      slug: "reading-weather-patterns",
      author: "Dr. Robert Chen",
      authorAvatar: "https://i.pravatar.cc/150?img=8",
      date: "2024-01-22",
      category: "Weather",
      image: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800",
      readTime: "6 min read",
      featured: false,
    },
    {
      id: 4,
      title: "Knot Tying Mastery: 10 Essential Knots",
      excerpt: "Master the fundamental knots every sailor should know, from bowlines to clove hitches.",
      slug: "essential-knots",
      author: "Emily Thompson",
      authorAvatar: "https://i.pravatar.cc/150?img=9",
      date: "2024-01-20",
      category: "Seamanship",
      image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800",
      readTime: "4 min read",
      featured: false,
    },
    {
      id: 5,
      title: "Chart Navigation in the Digital Age",
      excerpt: "Balancing traditional paper charts with modern electronic navigation systems for optimal safety.",
      slug: "chart-navigation-digital",
      author: "Captain James Wilson",
      authorAvatar: "https://i.pravatar.cc/150?img=12",
      date: "2024-01-18",
      category: "Navigation",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      readTime: "8 min read",
      featured: false,
    },
    {
      id: 6,
      title: "Marine VHF Radio: Protocols and Best Practices",
      excerpt: "Everything you need to know about proper radio communication at sea, including emergency procedures.",
      slug: "vhf-radio-protocols",
      author: "Sarah Martinez",
      authorAvatar: "https://i.pravatar.cc/150?img=5",
      date: "2024-01-15",
      category: "Safety",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800",
      readTime: "5 min read",
      featured: false,
    },
  ];

  const categories = ['All', 'Navigation', 'Safety', 'Weather', 'Seamanship'];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const featuredPost = posts.find(post => post.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Free Content</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert information, guides, and resources to help you with your cadetship.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12 hover:shadow-xl transition-shadow">
            <div className="grid md:grid-cols-2">
              <div className="h-full">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-semibold">
                    <TrendingUp size={16} />
                    Featured
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {featuredPost.category}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={featuredPost.authorAvatar}
                    alt={featuredPost.author}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{featuredPost.author}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {featuredPost.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {featuredPost.readTime}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-fit">
                  Read More
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {currentPosts.map(post => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    <Tag size={14} />
                    {post.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <hr className="mb-4" />
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{post.author}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {post.date}
                      </span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentPage === idx + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
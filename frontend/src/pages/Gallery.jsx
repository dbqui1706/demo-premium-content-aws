import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';
import TierBadge from '../components/TierBadge';

export default function Gallery() {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, free, premium

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await contentAPI.getAll(user?.tier);
            setContent(response.data.data);
        } catch (err) {
            setError('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const filteredContent = content.filter(item => {
        if (filter === 'all') return true;
        return item.tier === filter;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                );
            case 'pdf':
                return (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                );
            case 'image':
                return (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDuration = (seconds) => {
        if (!seconds) return null;
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min`;
    };

    const canAccess = (contentTier) => {
        if (user?.tier === 'premium') return true;
        return contentTier === 'free';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Content Gallery</h1>
                    <p className="mt-2 text-gray-600">
                        Your tier: <TierBadge tier={user?.tier || 'free'} />
                    </p>
                </div>

                {/* Filter */}
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        All Content
                    </button>
                    <button
                        onClick={() => setFilter('free')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'free'
                            ? 'bg-free-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Free
                    </button>
                    <button
                        onClick={() => setFilter('premium')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'premium'
                            ? 'bg-premium-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Premium
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContent.map((item) => {
                        const hasAccess = canAccess(item.tier);

                        return (
                            <div key={item.id} className="card hover:shadow-lg transition-shadow">
                                <div className={`p-6 ${!hasAccess ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${item.tier === 'premium' ? 'bg-premium-100 text-premium-600' : 'bg-free-100 text-free-600'
                                            }`}>
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <TierBadge tier={item.tier} />
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                        <span className="capitalize">{item.type}</span>
                                        {item.file_size && <span>{formatFileSize(item.file_size)}</span>}
                                        {item.duration && <span>{formatDuration(item.duration)}</span>}
                                    </div>

                                    {hasAccess ? (
                                        <Link
                                            to={`/content/${item.id}`}
                                            className="block w-full text-center btn-primary"
                                        >
                                            View Content
                                        </Link>
                                    ) : (
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-medium">Premium Required</span>
                                            </div>
                                            <p className="text-xs text-gray-500">Upgrade to premium to access this content</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredContent.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No content found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

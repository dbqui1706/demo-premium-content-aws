import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import TierBadge from '../components/TierBadge';

export default function ContentViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchContent();
    }, [id]);

    const fetchContent = async () => {
        try {
            // Get content metadata
            const metadataResponse = await contentAPI.getById(id);
            setContent(metadataResponse.data.data);

            // Get signed URL for access
            const accessResponse = await contentAPI.getAccessUrl(id);
            setSignedUrl(accessResponse.data.data.signedUrl);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (!signedUrl || !content) return null;

        switch (content.type) {
            case 'video':
                return (
                    <video
                        controls
                        className="w-full rounded-lg shadow-lg"
                        poster={signedUrl.replace(content.s3_key, content.thumbnail)}
                    >
                        <source src={signedUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                );

            case 'pdf':
                return (
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <iframe
                            src={signedUrl}
                            className="w-full h-[600px] rounded"
                            title={content.title}
                        />
                        <div className="mt-4 text-center">
                            <a
                                href={signedUrl}
                                download
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download PDF
                            </a>
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <img
                            src={signedUrl}
                            alt={content.title}
                            className="w-full rounded-lg"
                        />
                        <div className="mt-4 text-center">
                            <a
                                href={signedUrl}
                                download
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download Image
                            </a>
                        </div>
                    </div>
                );

            default:
                return <p className="text-gray-500">Unsupported content type</p>;
        }
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

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-lg font-bold text-red-900">Access Denied</h3>
                        </div>
                        <p className="text-red-700 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/gallery')}
                            className="btn-primary w-full"
                        >
                            Back to Gallery
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/gallery')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Gallery
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{content?.title}</h1>
                            <p className="mt-2 text-gray-600">{content?.description}</p>
                        </div>
                        <TierBadge tier={content?.tier} />
                    </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                    {renderContent()}
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-1">Secure Access</h4>
                            <p className="text-sm text-blue-800">
                                This content is delivered via CloudFront with a time-limited signed URL.
                                The URL will expire in 15 minutes for security.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-premium-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
                        Premium Content Demo
                    </h1>
                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                        Demonstrating AWS Lambda@Edge with CloudFront Signed URLs for secure premium content delivery
                    </p>

                    <div className="mt-10 flex justify-center gap-4">
                        <Link to="/register" className="btn-primary text-lg px-8 py-3">
                            Get Started
                        </Link>
                        <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-20 grid md:grid-cols-3 gap-8">
                    <div className="card p-6">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">JWT Authentication</h3>
                        <p className="text-gray-600">Secure user authentication with JSON Web Tokens validated at the edge</p>
                    </div>

                    <div className="card p-6">
                        <div className="w-12 h-12 bg-premium-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-premium-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Tier-Based Access</h3>
                        <p className="text-gray-600">Free and Premium tiers with Lambda@Edge enforcing access control</p>
                    </div>

                    <div className="card p-6">
                        <div className="w-12 h-12 bg-free-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-free-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">CloudFront Signed URLs</h3>
                        <p className="text-gray-600">Time-limited secure URLs for premium content delivery via CloudFront</p>
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Technology Stack</h2>
                    <div className="grid md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl mb-2">⚡</div>
                            <div className="font-semibold">Lambda@Edge</div>
                            <div className="text-sm text-gray-600">Request validation</div>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">☁️</div>
                            <div className="font-semibold">CloudFront</div>
                            <div className="text-sm text-gray-600">CDN + Signed URLs</div>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">🔐</div>
                            <div className="font-semibold">JWT</div>
                            <div className="text-sm text-gray-600">Authentication</div>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">⚛️</div>
                            <div className="font-semibold">React</div>
                            <div className="text-sm text-gray-600">Frontend</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

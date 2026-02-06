import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const FinalCTA = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 bg-gradient-to-br from-cyan-50 via-white to-blue-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Main Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full blur-3xl opacity-30 -z-10"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -z-10"></div>

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Sparkles size={16} />
                            <span>Join Thousands of Happy Shop Owners</span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-6">
                            Start Managing Your Shop
                            <span className="block text-cyan mt-2">Today</span>
                        </h2>

                        {/* Description */}
                        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                            No credit card required. No setup fees.
                            <span className="block mt-2 font-medium text-gray-700">
                                Start using StockFlow in just 2 minutes!
                            </span>
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <button
                                onClick={() => navigate('/register')}
                                className="group bg-green-500 hover:bg-green-600 text-white px-10 py-5 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                            >
                                Create Free Account
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white hover:bg-gray-50 text-cyan border-2 border-cyan px-10 py-5 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                Login
                            </button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Free Forever</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>No Credit Card</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>2 Minute Setup</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Note */}
                    <p className="text-center mt-8 text-gray-500">
                        Have questions? We're here to help! 📞
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;

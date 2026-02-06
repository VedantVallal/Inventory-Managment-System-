import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative bg-gradient-to-b from-white to-cyan-50 pt-20 pb-32 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-30 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20 -z-10"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="text-center lg:text-left animate-fade-in-up">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                <Sparkles size={16} />
                                <span>Built for Modern Businesses</span>
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy mb-6 leading-tight">
                                Manage Your Shop Stock & Billing
                                <span className="text-cyan"> Easily</span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                                Add products, track stock, and create bills in minutes.
                                <span className="block mt-2 font-medium text-gray-700">
                                    Perfect for small shops and kirana stores.
                                </span>
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={() => navigate('/register')}
                                    className="group bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    Start Free
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-white hover:bg-gray-50 text-cyan border-2 border-cyan px-8 py-4 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                    Login
                                </button>
                            </div>

                            {/* Trust Badge */}
                            <p className="mt-6 text-sm text-gray-500">
                                ✓ No credit card required  •  ✓ Setup in 2 minutes
                            </p>
                        </div>

                        {/* Right Image/Illustration */}
                        <div className="relative animate-fade-in-right hidden lg:block">
                            <div className="relative">
                                {/* Main Card */}
                                <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                    <div className="space-y-4">
                                        {/* Product Item */}
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                                                <span className="text-2xl">📦</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">Rice - 1kg</p>
                                                <p className="text-sm text-gray-500">Stock: 50 bags</p>
                                            </div>
                                            <p className="text-lg font-bold text-cyan">₹60</p>
                                        </div>

                                        {/* Bill Item */}
                                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                <span className="text-2xl">🧾</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">Bill</p>
                                                <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                                            </div>
                                            <p className="text-lg font-bold text-green-600">₹450</p>
                                        </div>

                                        {/* Alert */}
                                        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                            <span className="text-2xl">⚠️</span>
                                            <p className="text-sm font-medium text-orange-700">
                                                Sugar stock is low - Only 5 left
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div className="absolute -top-4 -right-4 bg-cyan text-white px-4 py-2 rounded-full shadow-lg animate-bounce-slow">
                                    <p className="text-sm font-bold">Easy to Use! 🎉</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

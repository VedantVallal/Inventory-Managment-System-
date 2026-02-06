import React from 'react';
import { Shield, Cloud, Monitor, Lock } from 'lucide-react';

const TrustSection = () => {
    const trustPoints = [
        {
            icon: Shield,
            title: 'Your Data is Safe',
            description: 'Protected with industry-standard security',
            color: 'cyan'
        },
        {
            icon: Cloud,
            title: 'Automatic Backup',
            description: 'Never lose your data, backed up daily',
            color: 'blue'
        },
        {
            icon: Monitor,
            title: 'Works Everywhere',
            description: 'Use on mobile, tablet, or computer',
            color: 'purple'
        },
        {
            icon: Lock,
            title: 'Private & Secure',
            description: 'Only you can access your shop data',
            color: 'green'
        }
    ];

    return (
        <section className="py-20 bg-navy text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-64 h-64 bg-cyan rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                            Safe & Reliable
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Your shop data is protected and always available
                        </p>
                    </div>

                    {/* Trust Points Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {trustPoints.map((point, index) => (
                            <div
                                key={index}
                                className="text-center group animate-fade-in-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                                    <point.icon size={40} className="text-cyan" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold mb-2">
                                    {point.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {point.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                            <p className="text-4xl font-bold text-cyan mb-2">100%</p>
                            <p className="text-gray-300">Secure</p>
                        </div>
                        <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                            <p className="text-4xl font-bold text-cyan mb-2">24/7</p>
                            <p className="text-gray-300">Available</p>
                        </div>
                        <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                            <p className="text-4xl font-bold text-cyan mb-2">Free</p>
                            <p className="text-gray-300">Forever</p>
                        </div>
                        <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                            <p className="text-4xl font-bold text-cyan mb-2">2 Min</p>
                            <p className="text-gray-300">Setup Time</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustSection;

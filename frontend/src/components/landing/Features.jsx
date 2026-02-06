import React from 'react';
import { Zap, Bell, Smartphone, Scan, FileText, CheckCircle } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: Zap,
            title: 'Easy Billing',
            description: 'Create bills in seconds',
            gradient: 'from-cyan-500 to-blue-500'
        },
        {
            icon: Bell,
            title: 'Stock Alerts',
            description: 'Get notified when stock is low',
            gradient: 'from-orange-500 to-red-500'
        },
        {
            icon: Smartphone,
            title: 'Mobile Friendly',
            description: 'Works on phone & computer',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: Scan,
            title: 'secure',
            description: 'Scan products quickly',
            gradient: 'from-green-500 to-teal-500'
        },
        {
            icon: FileText,
            title: 'Daily Reports',
            description: 'See your sales & stock',
            gradient: 'from-blue-500 to-indigo-500'
        },
        {
            icon: CheckCircle,
            title: 'Simple to Use',
            description: 'No training needed',
            gradient: 'from-emerald-500 to-green-500'
        }
    ];

    return (
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            All essential features to run your shop smoothly
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 animate-fade-in-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon with Gradient */}
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <feature.icon size={28} className="text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-navy mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover Indicator */}
                                <div className={`mt-4 h-1 w-0 bg-gradient-to-r ${feature.gradient} rounded-full group-hover:w-full transition-all duration-300`}></div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Note */}
                    <div className="mt-16 text-center bg-cyan-50 rounded-2xl p-8 border-2 border-cyan-100">
                        <p className="text-lg text-cyan-900 font-medium">
                            ✨ <span className="font-bold">All features included</span> - No hidden charges, no premium plans
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;

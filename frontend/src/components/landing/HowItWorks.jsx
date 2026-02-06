import React from 'react';
import { Package, Receipt, BarChart3 } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            icon: Package,
            title: 'Add Products',
            description: 'Enter product name, price & stock',
            color: 'cyan',
            bgColor: 'bg-cyan-100',
            iconColor: 'text-cyan-600',
            borderColor: 'border-cyan-200'
        },
        {
            icon: Receipt,
            title: 'Create Bill',
            description: 'Manually',
            color: 'purple',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            borderColor: 'border-purple-200'
        },
        {
            icon: BarChart3,
            title: 'Track Stock',
            description: 'Know what is low or sold',
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            borderColor: 'border-green-200'
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Start managing your shop in just 3 simple steps
                        </p>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="relative group animate-fade-in-up"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Step Number */}
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10">
                                    {index + 1}
                                </div>

                                {/* Card */}
                                <div className={`relative bg-white border-2 ${step.borderColor} rounded-2xl p-8 h-full transform group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-300`}>
                                    {/* Icon */}
                                    <div className={`w-16 h-16 ${step.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <step.icon size={32} className={step.iconColor} />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-2xl font-bold text-navy mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {step.description}
                                    </p>

                                    {/* Decorative Element */}
                                    <div className={`absolute bottom-0 right-0 w-24 h-24 ${step.bgColor} rounded-tl-full opacity-10`}></div>
                                </div>

                                {/* Arrow (Desktop Only) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-0">
                                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="text-gray-300">
                                            <path d="M5 15h20M20 10l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bottom Message */}
                    <div className="mt-16 text-center">
                        <p className="text-xl text-gray-700 font-medium">
                            That's it! Your shop is ready to go 🎉
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

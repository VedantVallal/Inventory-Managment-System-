import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import Features from '../components/landing/Features';
import TrustSection from '../components/landing/TrustSection';
import FinalCTA from '../components/landing/FinalCTA';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <HeroSection />

            {/* How It Works Section */}
            <HowItWorks />
        <hr  className='mt-10 bg-blue-200 h-1'/>
            {/* Features Section */}
            <Features />

            {/* Trust Section */}
            <TrustSection />

            {/* Final CTA Section */}
            <FinalCTA />

            {/* Footer */}
            <footer className="bg-navy text-white py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto text-center">
                        <p className="text-gray-400 mb-4">
                            © 2024 StockFlow IMS. Made with ❤️ for small shop owners.
                        </p>
                        <p className="text-sm text-gray-500">
                            Simple. Fast. Reliable.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

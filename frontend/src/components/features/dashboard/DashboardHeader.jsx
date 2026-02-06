import React from 'react';
import { Clock, Sun, Moon, Calendar } from 'lucide-react';

const DashboardHeader = ({ user, businessName }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good Morning', icon: Sun };
        if (hour < 18) return { text: 'Good Afternoon', icon: Sun };
        return { text: 'Good Evening', icon: Moon };
    };

    const { text, icon: Icon } = getGreeting();
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-cyan/10 p-3 rounded-full hidden sm:block">
                        <Icon size={24} className="text-cyan" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                            {text}, {user?.full_name?.split(' ')[0] || 'Partner'}!
                            <span className="text-2xl">👋</span>
                        </h1>
                        <p className="text-text-muted mt-1">
                            Here's what's happening at <span className="font-semibold text-text-primary">{businessName || 'your store'}</span> today.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <Calendar size={18} className="text-text-muted" />
                    <span className="text-sm font-medium text-text-secondary">{currentDate}</span>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Business Active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;

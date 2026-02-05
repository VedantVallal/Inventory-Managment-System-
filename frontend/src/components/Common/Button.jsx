import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    onClick,
    type = 'button',
    className = ''
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-cyan text-white hover:bg-cyan-dark hover:scale-[1.02] active:scale-[0.98] shadow-sm',
        secondary: 'border-2 border-slate text-slate hover:bg-slate hover:text-white',
        danger: 'bg-red-500 text-white hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98]',
        ghost: 'text-slate hover:bg-gray-100',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm rounded-lg',
        md: 'px-6 py-2.5 text-base rounded-lg',
        lg: 'px-8 py-3 text-lg rounded-lg',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </>
            ) : (
                <>
                    {Icon && <Icon size={18} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;

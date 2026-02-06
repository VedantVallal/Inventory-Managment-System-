import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    helperText,
    required = false,
    disabled = false,
    icon: Icon,
    className = '',
    showPasswordToggle = false, // New prop for password toggle
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    // Determine the actual input type
    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            w-full px-4 py-2.5 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent 
            transition-all disabled:bg-gray-100 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${showPasswordToggle ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
                    {...props}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            {helperText && !error && <p className="mt-1 text-sm text-text-muted">{helperText}</p>}
        </div>
    );
};

export default Input;

import React from 'react';

const Card = ({
    children,
    title,
    subtitle,
    action,
    hover = false,
    className = ''
}) => {
    return (
        <div className={`bg-white rounded-card shadow-card p-6 transition-shadow duration-150 ${hover ? 'hover:shadow-card-hover cursor-pointer' : ''} ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
                        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
};

export default Card;

import React, { type ReactNode } from 'react';

interface FeatureCardWrapperProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  accentColor: 'orange' | 'purple' | 'cyan';
  children: ReactNode;
  actions?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
}

const FeatureCardWrapper: React.FC<FeatureCardWrapperProps> = ({
  icon,
  title,
  subtitle,
  accentColor,
  children,
  actions,
  headerAction,
  className = ''
}) => {
  const accentColorClasses = {
    orange: {
      border: 'border-orange-500/30',
      shadow: 'hover:shadow-[0_0_32px_rgba(255,140,66,0.3)]',
      glow: 'from-orange-500/5',
      icon: 'from-orange-500 to-orange-600',
      iconShadow: 'shadow-orange-500/30'
    },
    purple: {
      border: 'border-purple-500/30',
      shadow: 'hover:shadow-[0_0_32px_rgba(191,90,242,0.3)]',
      glow: 'from-purple-500/5',
      icon: 'from-purple-500 to-purple-600',
      iconShadow: 'shadow-purple-500/30'
    },
    cyan: {
      border: 'border-cyan-500/30',
      shadow: 'hover:shadow-[0_0_32px_rgba(0,212,255,0.3)]',
      glow: 'from-cyan-500/5',
      icon: 'from-cyan-500 to-cyan-600',
      iconShadow: 'shadow-cyan-500/30'
    }
  };

  const colors = accentColorClasses[accentColor];

  return (
    <section
      className={`glass-card ${colors.border} ${colors.shadow} hover:-translate-y-1 transition-all duration-300 group ${className}`}
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
    >
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none`} />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg ${colors.iconShadow}`}>
              {icon}
            </div>
            <div>
              <h3 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-xl font-semibold text-gray-100">
                {title}
              </h3>
              <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
          </div>
          {headerAction && (
            <div>
              {headerAction}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="card-content">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="card-actions mt-6">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeatureCardWrapper;

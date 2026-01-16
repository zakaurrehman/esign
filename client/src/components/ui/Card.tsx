import React from 'react';


type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'selectable' | 'stat' | 'plain';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: CardSize;
  variant?: CardVariant;
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'min-w-[180px] max-w-[260px] p-4',
  md: 'min-w-[220px] max-w-[300px] p-6',
  lg: 'min-w-[260px] max-w-[340px] p-6 h-56',
};

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white rounded-lg shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md',
  selectable: 'bg-white rounded-lg border border-slate-200 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all flex flex-col items-center justify-center',
  stat: 'bg-white rounded-lg shadow-sm border border-slate-200',
  plain: '',
};

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, size = 'md', variant = 'default' }) => {
  return (
    <div
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-slate-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 ${className}`}>
      {children}
    </div>
  );
};

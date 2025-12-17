import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-slate-900 rounded-2xl shadow-lg shadow-black/20 border border-slate-800 p-6 ${className}`}>
      {title && <h3 className="text-xl font-bold text-slate-100 mb-4">{title}</h3>}
      {children}
    </div>
  );
};
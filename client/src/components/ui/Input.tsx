import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-slate-900 placeholder-slate-400 ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 font-semibold">{error}</p>}
    </div>
  );
};

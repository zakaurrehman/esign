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
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(!!props.value);

  return (
    <div className="relative w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-white px-1 transition-all duration-200 pointer-events-none z-10 ${
            (isFocused || hasValue) ? 'text-xs top-1.5 text-blue-600 font-semibold' : 'text-base text-slate-500'
          }`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-slate-900 placeholder-slate-400 ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 hover:border-slate-400'
        } ${label ? 'pt-6' : ''} ${className}`}
        onFocus={e => { setIsFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setIsFocused(false); props.onBlur?.(e); }}
        onChange={e => { setHasValue(!!e.target.value); props.onChange?.(e); }}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 font-semibold">{error}</p>}
    </div>
  );
};

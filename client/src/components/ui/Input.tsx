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
            (isFocused || hasValue) ? 'text-xs top-1.5 text-indigo-600 font-semibold' : 'text-base text-gray-400'
          }`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 border rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all ${
          error ? 'border-red-500' : 'border-slate-200'
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

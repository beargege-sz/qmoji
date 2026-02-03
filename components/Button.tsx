import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "relative font-bold py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40",
    secondary: "bg-white text-gray-800 shadow-sm border border-gray-100",
    outline: "bg-transparent border-2 border-orange-500 text-orange-500",
  };

  const loadingOverlay = (
    <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-full opacity-80">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-70 cursor-not-allowed active:scale-100' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={isLoading ? 'invisible' : ''}>{children}</span>
      {isLoading && loadingOverlay}
    </button>
  );
};

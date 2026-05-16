'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  onClick,
  type = 'button'
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    outline: 'border border-gray-300 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

import React from 'react';
import { Truck } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = fullScreen 
    ? 'flex min-h-screen items-center justify-center bg-background'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Animated Road */}
        <div className="relative mb-6 overflow-hidden">
          <div className="w-64 h-20 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-lg relative">
            {/* Road Lines */}
            <div className="absolute top-1/2 left-0 w-full h-1 transform -translate-y-1/2">
              <div className="w-full h-full bg-white opacity-60 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                {/* Dashed lines */}
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center space-x-4">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-6 h-0.5 bg-white animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Animated Truck */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 animate-truck-drive">
              <div className="relative">
                <Truck className={`${sizeClasses[size]} text-primary drop-shadow-lg`} />
                {/* Truck shadow */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black opacity-20 rounded-full blur-sm"></div>
                {/* Exhaust smoke */}
                <div className="absolute -top-2 -right-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full opacity-60 animate-ping"></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-gray-300 rounded-full opacity-40 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
            </div>

            {/* Road side elements */}
            <div className="absolute -bottom-2 left-4">
              <div className="w-2 h-6 bg-green-500 rounded-t-full opacity-70"></div>
            </div>
            <div className="absolute -bottom-2 right-8">
              <div className="w-2 h-4 bg-green-400 rounded-t-full opacity-60"></div>
            </div>
            <div className="absolute -bottom-2 right-16">
              <div className="w-1 h-3 bg-green-600 rounded-t-full opacity-50"></div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full animate-loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

// Simple loading spinner for smaller use cases
export const SimpleLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center">
      <Truck className={`${sizeClasses[size]} text-primary animate-bounce`} />
    </div>
  );
};
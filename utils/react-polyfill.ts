// Polyfill for React 19's use hook to work with React 18
import React from 'react';

// Add the use hook polyfill if it doesn't exist
if (!(React as any).use) {
  (React as any).use = function(context: any) {
    // For context objects
    if (context && typeof context === 'object' && context._currentValue !== undefined) {
      return context._currentValue;
    }
    
    // For promises or other async values - simplified implementation
    if (context && typeof context.then === 'function') {
      throw context; // Let React handle the promise
    }
    
    // For functions
    if (typeof context === 'function') {
      return context();
    }
    
    // Fallback
    return context;
  };
}

export {};
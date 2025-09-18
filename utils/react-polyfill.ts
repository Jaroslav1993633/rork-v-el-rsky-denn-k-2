// Polyfill for React 19's use hook to work with React 18
// This must be imported before any other React imports
import React from "react";

// Define the polyfill function
const usePolyfill = function(context: any) {
  // For React Context objects, return the current value directly
  if (context && typeof context === 'object' && context._currentValue !== undefined) {
    return context._currentValue;
  }
  
  // For promises, throw them to be handled by Suspense
  if (context && typeof context.then === 'function') {
    throw context;
  }
  
  // For functions, call them
  if (typeof context === 'function') {
    return context();
  }
  
  // Return as-is for other values
  return context;
};

// Patch React immediately
const patchReact = (reactObj: any) => {
  if (reactObj && !reactObj.use) {
    reactObj.use = usePolyfill;
    console.log('React.use polyfill installed on:', reactObj);
  }
};

// Patch React immediately
patchReact(React);

// Patch global React references
if (typeof globalThis !== 'undefined' && (globalThis as any).React) {
  patchReact((globalThis as any).React);
}

if (typeof window !== 'undefined' && (window as any).React) {
  patchReact((window as any).React);
}

// Try to patch the react module directly using require
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reactModule = require('react');
  patchReact(reactModule);
} catch {
  // Ignore if require fails
}

// Set up a periodic check to patch React if it gets loaded later
let patchAttempts = 0;
const maxPatchAttempts = 10;

const intervalId = setInterval(() => {
  patchAttempts++;
  
  // Check all possible React references
  const reactSources = [
    React,
    (globalThis as any).React,
    (window as any)?.React
  ];
  
  let patched = false;
  reactSources.forEach(reactObj => {
    if (reactObj && !reactObj.use) {
      patchReact(reactObj);
      patched = true;
    }
  });
  
  // Stop trying after max attempts or if we've patched successfully
  if (patchAttempts >= maxPatchAttempts || ((React as any).use && patched)) {
    clearInterval(intervalId);
  }
}, 100);

// Clean up after 2 seconds
setTimeout(() => {
  clearInterval(intervalId);
}, 2000);

export {};
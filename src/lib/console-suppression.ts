// Console warning suppression for development
// This helps reduce noise from bundled dependencies that have dead code

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods to filter out noise
  console.warn = (...args: any[]) => {
    const message = args.join(' ');

    // Suppress specific warnings that are noise from dependencies
    if (
      message.includes('unreachable code after return statement') ||
      message.includes('Module not found') ||
      message.includes('preloaded with link preload was not used') ||
      message.includes('Layout was forced before the page was fully loaded') ||
      message.includes('Metropolis') // Font preload warnings
    ) {
      return;
    }

    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');

    // Suppress specific errors that are noise from dependencies
    if (
      message.includes('unreachable code after return statement')
    ) {
      return;
    }

    originalError.apply(console, args);
  };

  // Intercept and suppress JavaScript syntax warnings from the browser
  // These warnings come from the browser's JavaScript parser, not console methods
  const originalConsoleWarn = window.console.warn;
  const originalConsoleError = window.console.error;

  window.console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('unreachable code after return statement')) {
      return;
    }
    return originalConsoleWarn.apply(this, args);
  };

  window.console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('unreachable code after return statement')) {
      return;
    }
    return originalConsoleError.apply(this, args);
  };

  // Also try to suppress the browser's built-in warnings
  // Note: This may not work for all browser implementations
  if ('captureEvents' in window) {
    // For older browsers that support captureEvents
    try {
      (window as any).captureEvents(Event.ERROR);
      window.onerror = function(message, source, lineno, colno, error) {
        if (typeof message === 'string' && message.includes('unreachable code after return statement')) {
          return true; // Suppress the error
        }
        return false; // Let other errors through
      };
    } catch (e) {
      // Ignore if captureEvents is not supported
    }
  }
}

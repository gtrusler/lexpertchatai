// Add this to your browser console to catch and log all errors
window.addEventListener('error', function(event) { console.error('Global error caught:', { message: event.message, source: event.filename, lineno: event.lineno, colno: event.colno, error: event.error }); });

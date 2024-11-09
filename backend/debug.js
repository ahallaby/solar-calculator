// Immediate console log
console.log('Starting debug file...');

// Process events
process.stdout.write('Testing process.stdout.write\n');

// Try different console methods
console.info('Info message');
console.error('Error message');

// Force flush console
process.stdout.write('End of debug test\n', () => {
    process.exit(0);
});
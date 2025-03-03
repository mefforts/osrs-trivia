// public/js/font-loader.js

/**
 * This script handles the loading of custom RuneScape fonts
 * and adds a class to the document when fonts are ready.
 * This prevents FOUT (Flash of Unstyled Text).
 */

document.addEventListener('DOMContentLoaded', function() {
    // Use FontFace API if available (more reliable)
    if ('FontFace' in window) {
        // Create FontFace objects
        const runescapeRegular = new FontFace(
            'Runescape',
            'url(/fonts/runescape.woff2) format("woff2"), url(/fonts/runescape.woff) format("woff")'
        );
        
        const runescapeBold = new FontFace(
            'Runescape Bold',
            'url(/fonts/runescape_bold.woff2) format("woff2"), url(/fonts/runescape_bold.woff) format("woff")'
        );
        
        // Promise that resolves when both fonts are loaded
        Promise.all([
            runescapeRegular.load(),
            runescapeBold.load()
        ]).then(fonts => {
            // Add fonts to document
            fonts.forEach(font => document.fonts.add(font));
            
            // Add a class to indicate fonts are loaded
            document.documentElement.classList.add('fonts-loaded');
            console.log('RuneScape fonts loaded successfully using FontFace API');
        }).catch(error => {
            console.warn('Error loading fonts:', error);
            // Add the class anyway to ensure content is visible with fallback fonts
            document.documentElement.classList.add('fonts-loaded');
            // Flag that custom fonts failed to load
            document.documentElement.classList.add('fonts-fallback');
        });
    } else {
        // Fallback for browsers that don't support FontFace API
        if (document.fonts) {
            document.fonts.ready.then(function() {
                document.documentElement.classList.add('fonts-loaded');
                console.log('RuneScape fonts loaded successfully');
            }).catch(function(error) {
                console.warn('Error loading fonts:', error);
                document.documentElement.classList.add('fonts-loaded');
                document.documentElement.classList.add('fonts-fallback');
            });
        } else {
            // Simplest fallback - just add the class after a short timeout
            setTimeout(function() {
                document.documentElement.classList.add('fonts-loaded');
                document.documentElement.classList.add('fonts-fallback');
            }, 300);
        }
    }
    
    // Add font loading error detection
    setTimeout(function() {
        // If the fonts-loaded class hasn't been added yet, add it with fallback
        if (!document.documentElement.classList.contains('fonts-loaded')) {
            document.documentElement.classList.add('fonts-loaded');
            document.documentElement.classList.add('fonts-timeout');
            console.warn('Font loading timed out - using fallback fonts');
        }
    }, 3000); // 3 second timeout
});
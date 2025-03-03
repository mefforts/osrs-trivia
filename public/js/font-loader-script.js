// public/js/font-loader.js

/**
 * This script handles the loading of custom RuneScape fonts
 * and adds a class to the document when fonts are ready.
 * This prevents FOUT (Flash of Unstyled Text).
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if the browser supports the Font Loading API
    if (document.fonts) {
        document.fonts.ready.then(function() {
            // Add a class to indicate fonts are loaded
            document.documentElement.classList.add('fonts-loaded');
            console.log('RuneScape fonts loaded successfully');
        }).catch(function(error) {
            console.warn('Error loading fonts:', error);
            // Add the class anyway to ensure content is visible
            document.documentElement.classList.add('fonts-loaded');
        });
    } else {
        // Fallback for browsers that don't support Font Loading API
        // Simply add the class after a short timeout
        setTimeout(function() {
            document.documentElement.classList.add('fonts-loaded');
        }, 300);
    }
    
    // Check specifically for RuneScape font loading
    const testFontElement = document.createElement('span');
    testFontElement.style.fontFamily = 'Runescape, serif';
    testFontElement.style.fontSize = '0px';
    testFontElement.innerHTML = 'A';
    document.body.appendChild(testFontElement);
    
    // Remove the test element after checking
    setTimeout(function() {
        if (document.body.contains(testFontElement)) {
            document.body.removeChild(testFontElement);
        }
    }, 1000);
});
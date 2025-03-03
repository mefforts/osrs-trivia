// scripts/create-placeholders.js
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const directories = [
  'public/images/ui'
];

// Create directories if they don't exist
directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Define placeholder SVGs
const placeholders = {
  'placeholder.png': `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#3c3c3c" rx="5" ry="5"/>
    <text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="#f8f8f8">Image</text>
  </svg>`,
  
  'item_placeholder.png': `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#3c3c3c" rx="5" ry="5"/>
    <text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="#f8f8f8">Item</text>
    <rect x="35" y="65" width="30" height="20" fill="#f5a623" rx="2" ry="2"/>
  </svg>`,
  
  'npc_placeholder.png': `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#3c3c3c" rx="5" ry="5"/>
    <text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="#f8f8f8">NPC</text>
    <circle cx="50" cy="75" r="10" fill="#4a90e2"/>
  </svg>`,
  
  'location_placeholder.png': `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#3c3c3c" rx="5" ry="5"/>
    <text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="#f8f8f8">Location</text>
    <path d="M40 75 L50 65 L60 75 L60 85 L40 85 Z" fill="#7ed321"/>
  </svg>`,
  
  'skill_placeholder.png': `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#3c3c3c" rx="5" ry="5"/>
    <text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="#f8f8f8">Skill</text>
    <circle cx="50" cy="75" r="15" fill="#f5a623" stroke="#f8f8f8" stroke-width="2"/>
  </svg>`
};

// Write placeholder SVGs to files
Object.entries(placeholders).forEach(([filename, svg]) => {
  const filePath = path.join(__dirname, '..', 'public/images/ui', filename);
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, svg);
    console.log(`Created placeholder: ${filename}`);
  } else {
    console.log(`Placeholder already exists: ${filename}`);
  }
});

console.log('Placeholder creation complete!');

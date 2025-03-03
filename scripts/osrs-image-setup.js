// scripts/osrs-image-setup.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

// Define image directories to create
const imageDirs = [
  'public/images',
  'public/images/items',
  'public/images/npcs',
  'public/images/ui',
  'public/images/locations',
  'public/images/skills',
  'public/fonts'
];

// Define OSRS Wiki image URLs
const osrsImages = {
  items: {
    'adamant_scimitar.png': 'https://oldschool.runescape.wiki/images/Adamant_scimitar.png',
    'dragon_scimitar.png': 'https://oldschool.runescape.wiki/images/Dragon_scimitar.png',
    'ghostspeak_amulet.png': 'https://oldschool.runescape.wiki/images/Ghostspeak_amulet.png',
    'ancient_staff.png': 'https://oldschool.runescape.wiki/images/Ancient_staff.png',
    'mint_cake.png': 'https://oldschool.runescape.wiki/images/Mint_cake.png',
    'blisterwood_flail.png': 'https://oldschool.runescape.wiki/images/Blisterwood_flail.png'
  },
  npcs: {
    'master_farmer.png': 'https://oldschool.runescape.wiki/images/Master_Farmer.png',
    'wise_old_man.png': 'https://oldschool.runescape.wiki/images/Wise_Old_Man.png',
    'chaeldar.png': 'https://oldschool.runescape.wiki/images/Chaeldar.png',
    'jossik.png': 'https://oldschool.runescape.wiki/images/Jossik.png',
    'lord_iorwerth.png': 'https://oldschool.runescape.wiki/images/Lord_Iorwerth.png',
    'nieve.png': 'https://oldschool.runescape.wiki/images/Nieve.png',
    'rune_dragon.png': 'https://oldschool.runescape.wiki/images/Rune_dragon.png',
    'anita.png': 'https://oldschool.runescape.wiki/images/Anita.png'
  },
  locations: {
    'arceuus.png': 'https://oldschool.runescape.wiki/images/Arceuus_Library.png',
    'al_kharid.png': 'https://oldschool.runescape.wiki/images/Al_Kharid_Palace.png'
  },
  skills: {
    'herblore.png': 'https://oldschool.runescape.wiki/images/Herblore.png',
    'runecraft.png': 'https://oldschool.runescape.wiki/images/Runecraft.png'
  }
};

// Define UI elements with custom SVGs
const uiSvgs = {
  'clue_scroll.png': `<svg width="100" height="120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="parchment" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#f5e7c1" />
        <stop offset="100%" style="stop-color:#d5b991" />
      </radialGradient>
    </defs>
    <rect width="100" height="120" rx="5" ry="5" fill="url(#parchment)" stroke="#8B4513" stroke-width="3"/>
    <path d="M20 15 L80 15 L80 105 L20 105 Z" fill="none" stroke="#8B4513" stroke-width="1"/>
    <path d="M25 30 L75 30 M25 50 L75 50 M25 70 L75 70 M25 90 L60 90" stroke="#8B4513" stroke-width="1" stroke-dasharray="3,3"/>
    <path d="M15 15 C25 5, 75 5, 85 15" stroke="#8B4513" stroke-width="2" fill="none"/>
    <path d="M15 105 C25 115, 75 115, 85 105" stroke="#8B4513" stroke-width="2" fill="none"/>
    <circle cx="50" cy="60" r="25" fill="#DA9100" fill-opacity="0.2"/>
  </svg>`,
  'correct_icon.png': `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="23" fill="#7ed321" stroke="#4b9e0b" stroke-width="2"/>
    <path d="M15 25 L22 32 L35 18" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'incorrect_icon.png': `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="23" fill="#d0021b" stroke="#9b0013" stroke-width="2"/>
    <path d="M17 17 L33 33 M17 33 L33 17" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`,
  'beginner_clue.png': `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="beginner" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#bfe6ff" />
        <stop offset="100%" style="stop-color:#7fcdff" />
      </radialGradient>
    </defs>
    <rect width="80" height="100" rx="5" ry="5" fill="url(#beginner)" stroke="#3c89b8" stroke-width="2"/>
    <path d="M20 20 L60 20 L60 80 L20 80 Z" fill="#f5f5f5" fill-opacity="0.7" stroke="#3c89b8" stroke-width="1"/>
    <text x="40" y="55" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="#3c89b8">Beginner</text>
    <path d="M30 35 L50 35 M30 45 L50 45 M30 65 L50 65" stroke="#3c89b8" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`,
  'easy_clue.png': `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="easy" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#b7f5a3" />
        <stop offset="100%" style="stop-color:#7ed321" />
      </radialGradient>
    </defs>
    <rect width="80" height="100" rx="5" ry="5" fill="url(#easy)" stroke="#4b9e0b" stroke-width="2"/>
    <path d="M20 20 L60 20 L60 80 L20 80 Z" fill="#f5f5f5" fill-opacity="0.7" stroke="#4b9e0b" stroke-width="1"/>
    <text x="40" y="55" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#4b9e0b">Easy</text>
    <path d="M30 35 L50 35 M30 45 L50 45 M30 65 L50 65" stroke="#4b9e0b" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`,
  'medium_clue.png': `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="medium" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#ffd27f" />
        <stop offset="100%" style="stop-color:#f5a623" />
      </radialGradient>
    </defs>
    <rect width="80" height="100" rx="5" ry="5" fill="url(#medium)" stroke="#d4881c" stroke-width="2"/>
    <path d="M20 20 L60 20 L60 80 L20 80 Z" fill="#f5f5f5" fill-opacity="0.7" stroke="#d4881c" stroke-width="1"/>
    <text x="40" y="55" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="#d4881c">Medium</text>
    <path d="M30 35 L50 35 M30 45 L50 45 M30 65 L50 65" stroke="#d4881c" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`,
  'hard_clue.png': `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="hard" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#ff7f7f" />
        <stop offset="100%" style="stop-color:#d0021b" />
      </radialGradient>
    </defs>
    <rect width="80" height="100" rx="5" ry="5" fill="url(#hard)" stroke="#9b0013" stroke-width="2"/>
    <path d="M20 20 L60 20 L60 80 L20 80 Z" fill="#f5f5f5" fill-opacity="0.7" stroke="#9b0013" stroke-width="1"/>
    <text x="40" y="55" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#9b0013">Hard</text>
    <path d="M30 35 L50 35 M30 45 L50 45 M30 65 L50 65" stroke="#9b0013" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`,
  'elite_clue.png': `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="elite" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#d09eff" />
        <stop offset="100%" style="stop-color:#9013fe" />
      </radialGradient>
    </defs>
    <rect width="80" height="100" rx="5" ry="5" fill="url(#elite)" stroke="#6b0ebe" stroke-width="2"/>
    <path d="M20 20 L60 20 L60 80 L20 80 Z" fill="#f5f5f5" fill-opacity="0.7" stroke="#6b0ebe" stroke-width="1"/>
    <text x="40" y="55" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#6b0ebe">Elite</text>
    <path d="M30 35 L50 35 M30 45 L50 45 M30 65 L50 65" stroke="#6b0ebe" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`,
  'master_clue.png': `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="master" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#333333" />
        <stop offset="100%" style="stop-color:#000000" />
      </radialGradient>
    </defs>
    <rect width="80" height="100" rx="5" ry="5" fill="url(#master)" stroke="#f5a623" stroke-width="2"/>
    <path d="M20 20 L60 20 L60 80 L20 80 Z" fill="#333333" fill-opacity="0.7" stroke="#f5a623" stroke-width="1"/>
    <text x="40" y="55" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="#f5a623">Master</text>
    <path d="M30 35 L50 35 M30 45 L50 45 M30 65 L50 65" stroke="#f5a623" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`,
  'background.jpg': `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="parchment-texture" patternUnits="userSpaceOnUse" width="100" height="100">
        <rect width="100" height="100" fill="#e8d4a9"/>
        <circle cx="10" cy="10" r="1" fill="#d0b287" opacity="0.5"/>
        <circle cx="30" cy="40" r="1" fill="#d0b287" opacity="0.5"/>
        <circle cx="70" cy="30" r="1" fill="#d0b287" opacity="0.5"/>
        <circle cx="90" cy="60" r="1" fill="#d0b287" opacity="0.5"/>
        <circle cx="50" cy="80" r="1" fill="#d0b287" opacity="0.5"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#parchment-texture)"/>
    <path d="M100 100 C150 50, 650 50, 700 100 C750 150, 750 450, 700 500 C650 550, 150 550, 100 500 C50 450, 50 150, 100 100 Z" fill="#d0b287" opacity="0.3"/>
  </svg>`,
  'level_icon.png': `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="23" fill="#f5a623" stroke="#d4881c" stroke-width="2"/>
    <text x="25" y="32" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle" fill="#ffffff">99</text>
  </svg>`,
  'xp_icon.png': `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="23" fill="#4a90e2" stroke="#3672b9" stroke-width="2"/>
    <text x="25" y="32" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle" fill="#ffffff">XP</text>
  </svg>`,
  'questions_icon.png': `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="23" fill="#7ed321" stroke="#4b9e0b" stroke-width="2"/>
    <text x="25" y="32" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle" fill="#ffffff">?</text>
  </svg>`,
  'xp_lamp.png': `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="lamp_glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#FFF9C4" />
        <stop offset="100%" style="stop-color:#FBC02D" />
      </radialGradient>
    </defs>
    <path d="M32 15 C42 15, 48 20, 48 32 L48 44 C48 52, 42 52, 32 52 C22 52, 16 52, 16 44 L16 32 C16 20, 22 15, 32 15" fill="#a87732" stroke="#8B4513" stroke-width="2"/>
    <path d="M30 52 L30 56 L34 56 L34 52" fill="#8B4513" stroke="#5d2906" stroke-width="1"/>
    <path d="M28 56 L36 56 L36 60 L28 60" fill="#5d2906" stroke="#5d2906" stroke-width="1"/>
    <ellipse cx="32" cy="32" rx="10" ry="10" fill="url(#lamp_glow)" opacity="0.9"/>
    <path d="M25 32 L39 32" stroke="#5d2906" stroke-width="1"/>
  </svg>`,
  'xp_orb.png': `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="orb_glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#E3F2FD" />
        <stop offset="100%" style="stop-color:#2196F3" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#orb_glow)" stroke="#0D47A1" stroke-width="2"/>
    <text x="32" y="38" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#0D47A1">XP</text>
  </svg>`,
  'level_up.png': `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="level_glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#FFF9C4" />
        <stop offset="100%" style="stop-color:#FBC02D" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#level_glow)" stroke="#F57F17" stroke-width="2"/>
    <path d="M32 12 L32 52 M22 22 L32 12 L42 22" stroke="#F57F17" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'treasure_trail.png': `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="treasure_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8B4513" />
        <stop offset="50%" style="stop-color:#A0522D" />
        <stop offset="100%" style="stop-color:#8B4513" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="5" ry="5" fill="url(#treasure_grad)" stroke="#5d2906" stroke-width="2"/>
    <path d="M10 10 L54 10 L54 54 L10 54 Z" fill="#e8d4a9" stroke="#5d2906" stroke-width="1"/>
    <path d="M20 20 C30 30, 40 15, 50 40" stroke="#5d2906" stroke-width="2" fill="none" stroke-dasharray="3,2"/>
    <circle cx="20" cy="20" r="3" fill="#5d2906"/>
    <circle cx="50" cy="40" r="3" fill="#d4881c" stroke="#5d2906" stroke-width="1"/>
    <path d="M44 40 L50 34 L56 40 L50 46 Z" fill="#d4881c" stroke="#5d2906" stroke-width="1" transform="translate(0, 0) scale(0.5)"/>
  </svg>`
};

// OSRS font URLs
const osrsFonts = {
  'runescape.woff2': 'https://cdn.thatbrickster.com/fonts/runescape.woff2',
  'runescape.woff': 'https://cdn.thatbrickster.com/fonts/runescape.woff',
  'runescape_bold.woff2': 'https://cdn.thatbrickster.com/fonts/runescape_bold.woff2',
  'runescape_bold.woff': 'https://cdn.thatbrickster.com/fonts/runescape_bold.woff'
};

// Function to download a file from URL
async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(destination, () => {}); // Delete the file if download fails
      reject(err);
    });
  });
}

// Create the specified directories
function createDirectories() {
  console.log('Creating image directories...');
  
  for (const dir of imageDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  }
}

// Create SVG files for UI elements
function createUiSvgs() {
  console.log('\nCreating UI SVG images...');
  
  const uiDir = path.join(__dirname, '..', 'public/images/ui');
  
  for (const [filename, svgContent] of Object.entries(uiSvgs)) {
    const filePath = path.join(uiDir, filename);
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, svgContent);
      console.log(`Created UI SVG image: ${filename}`);
    } else {
      console.log(`Image already exists: ${filename}`);
    }
  }
}

// Download OSRS Wiki images
async function downloadOsrsImages() {
  console.log('\nDownloading OSRS Wiki images...');
  
  for (const [category, images] of Object.entries(osrsImages)) {
    const categoryDir = path.join(__dirname, '..', `public/images/${category}`);
    
    for (const [filename, url] of Object.entries(images)) {
      const filePath = path.join(categoryDir, filename);
      
      if (!fs.existsSync(filePath)) {
        try {
          await downloadFile(url, filePath);
          console.log(`Downloaded ${category} image: ${filename}`);
        } catch (error) {
          console.error(`Error downloading ${filename}: ${error.message}`);
          
          // Create a fallback colored rectangle if download fails
          const color = getRandomColor(filename);
          const svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="${color}" rx="5" ry="5"/>
            <text x="50" y="55" font-family="Arial" font-size="10" text-anchor="middle" fill="#ffffff">${filename.replace('.png', '')}</text>
          </svg>`;
          
          fs.writeFileSync(filePath, svgContent);
          console.log(`Created fallback for ${category}: ${filename}`);
        }
      } else {
        console.log(`Image already exists: ${category}/${filename}`);
      }
    }
  }
}

// Download OSRS fonts
async function downloadOsrsFonts() {
  console.log('\nDownloading OSRS fonts...');
  
  const fontsDir = path.join(__dirname, '..', 'public/fonts');
  
  for (const [filename, url] of Object.entries(osrsFonts)) {
    const filePath = path.join(fontsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      try {
        await downloadFile(url, filePath);
        console.log(`Downloaded font: ${filename}`);
      } catch (error) {
        console.error(`Error downloading ${filename}: ${error.message}`);
      }
    } else {
      console.log(`Font already exists: ${filename}`);
    }
  }
}

// Generate a random color based on string input
function getRandomColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}

// Main execution
async function main() {
  console.log('Setting up OSRS image assets...\n');
  
  // Create directories
  createDirectories();
  
  // Create UI SVGs
  createUiSvgs();
  
  // Download OSRS Wiki images
  await downloadOsrsImages();
  
  // Download OSRS fonts
  await downloadOsrsFonts();
  
  console.log('\nImage and font setup complete!');
  console.log('Your OSRS Trivia Game now has the necessary assets.');
}

main().catch(error => {
  console.error('Error in setup:', error);
});
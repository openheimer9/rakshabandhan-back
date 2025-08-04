const fs = require('fs');
const path = require('path');

console.log('🎁 Rakshabandhan Photo Setup Helper\n');

const imagesDir = path.join(__dirname, 'public', 'images');

// Check if images directory exists
if (!fs.existsSync(imagesDir)) {
  console.log('📁 Creating public/images directory...');
  fs.mkdirSync(imagesDir, { recursive: true });
}

console.log('📸 Photo Setup Instructions:\n');

console.log('1. Add your sister\'s Main photo:');
console.log('   → Save as: public/images/childhood-photo.jpg\n');

console.log('2. Add 22 gallery photos:');
console.log('   → Save as: public/images/sister-photo-1.jpg');
console.log('   → Save as: public/images/sister-photo-2.jpg');
console.log('   → ... up to public/images/sister-photo-22.jpg\n');

console.log('3. Customize captions in src/App.js (lines 20-41)\n');

console.log('4. Build the website:');
console.log('   → npm run build\n');

console.log('5. Host on Netlify/Vercel:\n');
console.log('   → Upload the "build" folder to Netlify');
console.log('   → Or connect your GitHub repo to Vercel\n');

// Check for existing photos
const existingFiles = fs.readdirSync(imagesDir);
const expectedFiles = [
  'childhood-photo.jpg',
  ...Array.from({length: 22}, (_, i) => `sister-photo-${i + 1}.jpg`)
];

console.log('📋 Current photo status:');
expectedFiles.forEach(file => {
  const exists = existingFiles.includes(file);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${file}`);
});

if (existingFiles.length === 0) {
  console.log('\n💡 Tip: You can also upload photos through the website interface!');
  console.log('   → Run "npm start" to open the website');
  console.log('   → Use the upload buttons to add photos');
  console.log('   → Photos uploaded this way are temporary (lost on refresh)');
}

console.log('\n🎯 Next steps:');
console.log('1. Add your photos to public/images/');
console.log('2. Customize captions in src/App.js');
console.log('3. Run "npm run build"');
console.log('4. Host on Netlify/Vercel');
console.log('5. Share the link with your sister! 🎉'); 
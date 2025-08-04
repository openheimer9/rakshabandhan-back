// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5005;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'build')));
word
// In-memory storage for photo metadata
let photoDatabase = {
  childhoodPhoto: null,
  galleryPhotos: []
};

// Helper function to convert base64 to file
function saveBase64ToFile(base64String, filename) {
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(matches[2], 'base64');
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
}

// API Routes
app.get('/api/photos', (req, res) => {
  console.log('📸 GET /api/photos - Returning photo database');
  res.json(photoDatabase);
});

app.post('/api/photos', async (req, res) => {
  try {
    console.log('📸 POST /api/photos - Upload request received');
    const { type, photos, photo } = req.body;
    
    console.log('📸 Upload type:', type);
    console.log('📸 Photo data length:', photo ? photo.length : 'N/A');
    console.log('📸 Photos array length:', photos ? photos.length : 'N/A');

    if (type === 'childhood' && photo) {
      // Upload Main photo
      console.log('📸 Processing childhood photo upload...');
      
      const filename = `childhood-${Date.now()}.jpg`;
      const filePath = saveBase64ToFile(photo, filename);
      
      photoDatabase.childhoodPhoto = {
        src: `http://localhost:${PORT}${filePath}`,
        permanent: true
      };
      
      console.log('✅ Childhood photo uploaded successfully:', filePath);
      
      return res.status(200).json({
        success: true,
        photo: photoDatabase.childhoodPhoto,
        message: 'Main photo uploaded successfully!'
      });
      
    } else if (type === 'gallery' && photos && photos.length > 0) {
      // Upload gallery photos
      console.log('📸 Processing gallery photos upload...');
      
      const newPhotos = [];
      
      for (let i = 0; i < photos.length; i++) {
        const photoData = photos[i];
        const filename = `gallery-${Date.now()}-${i}.jpg`;
        const filePath = saveBase64ToFile(photoData, filename);
        
        newPhotos.push({
          id: Date.now() + i,
          src: `http://localhost:${PORT}${filePath}`,
          caption: `Photo ${photoDatabase.galleryPhotos.length + i + 1}`,
          permanent: true
        });
      }
      
      photoDatabase.galleryPhotos.push(...newPhotos);
      
      console.log(`✅ ${newPhotos.length} gallery photos uploaded successfully`);
      
      return res.status(200).json({
        success: true,
        photos: newPhotos,
        message: `${newPhotos.length} photos uploaded successfully!`
      });
      
    } else {
      console.log('❌ Invalid upload data');
      return res.status(400).json({ error: 'Invalid upload data' });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.put('/api/photos', (req, res) => {
  try {
    const { photoId } = req.query;
    const { caption } = req.body;

    const photo = photoDatabase.galleryPhotos.find(p => p.id == photoId);
    if (photo) {
      photo.caption = caption;
      console.log('✅ Caption updated for photo:', photoId);
      return res.status(200).json({ success: true, message: 'Caption updated successfully!' });
    } else {
      console.log('❌ Photo not found for caption update:', photoId);
      return res.status(404).json({ error: 'Photo not found' });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/photos', async (req, res) => {
  try {
    const { photoId } = req.query;

    if (photoId) {
      // Delete specific photo
      const photoIndex = photoDatabase.galleryPhotos.findIndex(p => p.id == photoId);
      if (photoIndex !== -1) {
        const photo = photoDatabase.galleryPhotos[photoIndex];
        
        // Delete file from disk
        try {
          const filePath = path.join(__dirname, 'public', photo.src);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error('Error deleting file:', error);
        }
        
        // Remove from database
        photoDatabase.galleryPhotos.splice(photoIndex, 1);
        
        console.log('✅ Photo deleted successfully:', photoId);
        return res.status(200).json({ success: true, message: 'Photo deleted successfully!' });
      } else {
        console.log('❌ Photo not found for deletion:', photoId);
        return res.status(404).json({ error: 'Photo not found' });
      }
    } else {
      // Clear all photos
      console.log('🗑️ Clearing all photos...');
      
      const photosToDelete = [
        ...photoDatabase.galleryPhotos,
        ...(photoDatabase.childhoodPhoto ? [photoDatabase.childhoodPhoto] : [])
      ];

      // Delete all files from disk
      for (const photo of photosToDelete) {
        try {
          const filePath = path.join(__dirname, 'public', photo.src);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // Clear database
      photoDatabase = {
        childhoodPhoto: null,
        galleryPhotos: []
      };

      console.log('✅ All photos cleared successfully');
      return res.status(200).json({ success: true, message: 'All photos cleared successfully!' });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Photo storage: Local filesystem (${uploadsDir})`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api/photos`);
  console.log(`🌐 App available at: http://localhost:${PORT}`);
  console.log(`📸 Uploads directory: ${uploadsDir}`);
}); 
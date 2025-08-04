// Vercel Serverless API for Photo Management
// This file should be placed in: api/photos.js

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// In-memory storage for photo metadata (in production, use a database)
let photoDatabase = {
  childhoodPhoto: null,
  galleryPhotos: []
};

// Helper function to convert base64 to buffer
function base64ToBuffer(base64String) {
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  return Buffer.from(matches[2], 'base64');
}

// Helper function to check if Cloudinary is configured
function isCloudinaryConfigured() {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary not configured. Please set environment variables.');
    return res.status(500).json({ 
      error: 'Cloud storage not configured. Please set CLOUDINARY_* environment variables.' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all photos
        return res.status(200).json(photoDatabase);

      case 'POST':
        // Upload photos
        const { type, photos, photo } = req.body;

        if (type === 'childhood' && photo) {
          // Upload Mainphoto
          const buffer = base64ToBuffer(photo);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'rakshabandhan',
                public_id: `childhood-${Date.now()}`,
                overwrite: true,
                resource_type: 'image'
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            ).end(buffer);
          });

          photoDatabase.childhoodPhoto = {
            src: result.secure_url,
            public_id: result.public_id,
            permanent: true
          };
          
          return res.status(200).json({
            success: true,
            photo: photoDatabase.childhoodPhoto,
            message: 'Mainphoto uploaded successfully!'
          });
        } else if (type === 'gallery' && photos && photos.length > 0) {
          // Upload gallery photos
          const newPhotos = [];
          
          for (const photoData of photos) {
            const buffer = base64ToBuffer(photoData);
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: 'rakshabandhan',
                  public_id: `gallery-${Date.now()}-${Math.random()}`,
                  overwrite: true,
                  resource_type: 'image'
                },
                (error, result) => {
                  if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              ).end(buffer);
            });

            newPhotos.push({
              id: Date.now() + Math.random(),
              src: result.secure_url,
              public_id: result.public_id,
              caption: `Photo ${photoDatabase.galleryPhotos.length + newPhotos.length + 1}`,
              permanent: true
            });
          }

          photoDatabase.galleryPhotos.push(...newPhotos);
          
          return res.status(200).json({
            success: true,
            photos: newPhotos,
            message: `${newPhotos.length} photos uploaded successfully!`
          });
        } else {
          return res.status(400).json({ error: 'Invalid upload data' });
        }
        break;

      case 'PUT':
        // Update caption
        const { photoId } = req.query;
        const { caption } = req.body;

        const photo = photoDatabase.galleryPhotos.find(p => p.id == photoId);
        if (photo) {
          photo.caption = caption;
          return res.status(200).json({ success: true, message: 'Caption updated successfully!' });
        } else {
          return res.status(404).json({ error: 'Photo not found' });
        }

      case 'DELETE':
        const { photoId: deletePhotoId } = req.query;

        if (deletePhotoId) {
          // Delete specific photo
          const photoIndex = photoDatabase.galleryPhotos.findIndex(p => p.id == deletePhotoId);
          if (photoIndex !== -1) {
            const photo = photoDatabase.galleryPhotos[photoIndex];
            
            // Delete from Cloudinary
            try {
              await cloudinary.uploader.destroy(photo.public_id);
            } catch (error) {
              console.error('Error deleting from Cloudinary:', error);
            }
            
            // Remove from database
            photoDatabase.galleryPhotos.splice(photoIndex, 1);
            
            return res.status(200).json({ success: true, message: 'Photo deleted successfully!' });
          } else {
            return res.status(404).json({ error: 'Photo not found' });
          }
        } else {
          // Clear all photos
          const photosToDelete = [
            ...photoDatabase.galleryPhotos,
            ...(photoDatabase.childhoodPhoto ? [photoDatabase.childhoodPhoto] : [])
          ];

          // Delete all photos from Cloudinary
          for (const photo of photosToDelete) {
            try {
              await cloudinary.uploader.destroy(photo.public_id);
            } catch (error) {
              console.error('Error deleting from Cloudinary:', error);
            }
          }

          // Clear database
          photoDatabase = {
            childhoodPhoto: null,
            galleryPhotos: []
          };

          return res.status(200).json({ success: true, message: 'All photos cleared successfully!' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
// Cloud Storage Configuration
// Choose one of the options below:

// ========================================
// OPTION 1: CLOUDINARY (Recommended for Vercel)
// ========================================

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload photo to Cloudinary
async function uploadToCloudinary(file, type = 'gallery') {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'rakshabandhan',
      public_id: `${type}-${Date.now()}`,
      overwrite: true,
      resource_type: 'image'
    });
    
    return {
      src: result.secure_url,
      public_id: result.public_id,
      permanent: true
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Delete photo from Cloudinary
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

// ========================================
// OPTION 2: AWS S3
// ========================================

const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Upload photo to S3
async function uploadToS3(file, type = 'gallery') {
  try {
    const fileName = `${type}-${Date.now()}.jpg`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `rakshabandhan/${fileName}`,
      Body: file,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };
    
    const result = await s3.upload(params).promise();
    
    return {
      src: result.Location,
      key: result.Key,
      permanent: true
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

// Delete photo from S3
async function deleteFromS3(key) {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
}

// ========================================
// OPTION 3: FIREBASE STORAGE
// ========================================

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

// Upload photo to Firebase Storage
async function uploadToFirebase(file, type = 'gallery') {
  try {
    const fileName = `${type}-${Date.now()}.jpg`;
    const storageRef = ref(storage, `rakshabandhan/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      src: downloadURL,
      path: snapshot.ref.fullPath,
      permanent: true
    };
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw error;
  }
}

// Delete photo from Firebase Storage
async function deleteFromFirebase(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Firebase delete error:', error);
    throw error;
  }
}

module.exports = {
  // Cloudinary functions
  uploadToCloudinary,
  deleteFromCloudinary,
  
  // S3 functions
  uploadToS3,
  deleteFromS3,
  
  // Firebase functions
  uploadToFirebase,
  deleteFromFirebase
}; 
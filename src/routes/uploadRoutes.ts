
import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware';
import { uploadCallRecording, logCallWithoutRecording } from '../controllers/uploadController';
import fs from 'fs';
import { 
    isCloudinaryConfigured, 
    cloudinaryImageStorage, 
    cloudinaryDocumentStorage, 
    cloudinaryRecordingStorage 
} from '../config/cloudinary';

const router = express.Router();

// Local Multer Storage Configuration for Recordings
const localRecordingStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/recordings');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `rec-${uniqueSuffix}${ext}`);
    }
});

// Local Multer Storage Configuration for Images
const localImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/images');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `img-${uniqueSuffix}${ext}`);
    }
});

// Local Multer Storage Configuration for Documents
const localDocumentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/documents');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});

// Use Cloudinary if configured, otherwise use local storage
const useCloudinary = isCloudinaryConfigured();
console.log(`📁 File storage: ${useCloudinary ? 'Cloudinary (Cloud)' : 'Local (Ephemeral)'}`);

const upload = multer({
    storage: useCloudinary ? cloudinaryRecordingStorage : localRecordingStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadImage = multer({
    storage: useCloudinary ? cloudinaryImageStorage : localImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const uploadDocument = multer({
    storage: useCloudinary ? cloudinaryDocumentStorage : localDocumentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed!'));
        }
    }
});

// Route: POST /api/upload/call-recording
router.post('/call-recording', protect, upload.single('recording'), uploadCallRecording);

// Route: POST /api/upload/log-call (for calls without recordings - Android 14/15 restriction)
router.post('/log-call', protect, logCallWithoutRecording);

// Route: POST /api/upload/image
import { uploadGenericImage, uploadDocument as uploadDocController } from '../controllers/uploadController';
router.post('/image', protect, uploadImage.single('image'), uploadGenericImage);

// Route: POST /api/upload/document
router.post('/document', protect, uploadDocument.single('document'), uploadDocController);

export default router;

import express from 'express';
import { getDocuments, getDocumentById, updateDocument, deleteDocument } from '../controllers/documentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all documents (with optional filters)
router.get('/', getDocuments);

// Get single document
router.get('/:id', getDocumentById);

// Update document metadata
router.put('/:id', updateDocument);

// Delete document (soft delete)
router.delete('/:id', deleteDocument);

export default router;

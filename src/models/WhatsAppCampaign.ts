import mongoose from 'mongoose';

const whatsAppCampaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    message: { type: String, required: true },
    templateId: { type: String },
    
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sent', 'failed'],
        default: 'draft'
    },
    
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    
    // Campaign statistics
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        replied: { type: Number, default: 0 }
    },
    
    // Recipients (can be lead IDs, contact IDs, or phone numbers)
    recipients: [{
        type: { type: String, enum: ['lead', 'contact', 'phone'], required: true },
        id: { type: String }, // Lead or Contact ID
        phone: { type: String }, // Direct phone number
        name: { type: String } // Optional name for phone numbers
    }],
    
    // Template parameters if using template
    templateParams: [String],
    
    // Organisation and user references
    organisationId: { type: String, required: true },
    createdById: { type: String, required: true },
    
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true,
});

whatsAppCampaignSchema.index({ organisationId: 1, isDeleted: 1 });
whatsAppCampaignSchema.index({ status: 1 });
whatsAppCampaignSchema.index({ scheduledAt: 1 });

const WhatsAppCampaign = mongoose.models.WhatsAppCampaign || mongoose.model('WhatsAppCampaign', whatsAppCampaignSchema);
export default WhatsAppCampaign;
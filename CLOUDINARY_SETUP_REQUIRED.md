# Cloudinary Setup Required - File 404 Errors

## Current Issue
Files uploaded to the CRM (documents, images, recordings) return 404 errors:
```
Cannot GET /uploads/documents/doc-1770890478730-779252480.pdf
```

## Root Cause
Render uses **ephemeral storage** - all files are deleted when:
- Server restarts
- New deployment happens
- Container is recycled

The uploaded files are saved locally but disappear after any restart/redeploy.

## Solution: Configure Cloudinary

Cloudinary provides persistent cloud storage with a generous free tier (25GB storage, 25GB bandwidth/month).

### Step 1: Create Cloudinary Account
1. Go to: https://cloudinary.com/users/register/free
2. Sign up for free account
3. Verify your email

### Step 2: Get API Credentials
1. Log in to Cloudinary dashboard
2. Go to **Dashboard** → **Account Details**
3. Copy these three values:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### Step 3: Add to Render Environment Variables
1. Go to Render dashboard: https://dashboard.render.com
2. Select your backend service (Dad-backend)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add these three variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

6. Click **Save Changes**
7. Render will automatically redeploy (takes 2-3 minutes)

### Step 4: Verify Setup
After deployment completes:
1. Check server logs in Render dashboard
2. Look for this message on startup:
   ```
   📁 File storage: Cloudinary (Cloud)
   ```
3. If you see this instead, Cloudinary is NOT configured:
   ```
   📁 File storage: Local (Ephemeral)
   ```

### Step 5: Test Upload
1. Upload a new document or image in the CRM
2. The URL should look like:
   ```
   https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/crm/documents/abc123.pdf
   ```
3. This URL will persist across deployments

## What Happens After Setup

### Before (Current State)
- Files saved to `/uploads/` folder on Render
- Files deleted on every restart/deployment
- 404 errors for all uploaded files

### After (With Cloudinary)
- Files uploaded directly to Cloudinary cloud storage
- Files persist forever (or until manually deleted)
- Fast CDN delivery worldwide
- No more 404 errors

## Code Already Integrated

The code is already set up to use Cloudinary automatically:
- ✅ Cloudinary config in `server/src/config/cloudinary.ts`
- ✅ Upload routes configured in `server/src/routes/uploadRoutes.ts`
- ✅ Controllers handle both Cloudinary and local storage
- ✅ Frontend displays both URL formats correctly

**You just need to add the environment variables!**

## Existing Files

Files uploaded before Cloudinary setup will still return 404. Only new uploads after configuration will work. Users will need to re-upload any important documents.

## Free Tier Limits

Cloudinary Free Tier is very generous:
- **25 GB** storage
- **25 GB** bandwidth per month
- **25,000** transformations per month
- Unlimited image/video transformations

This is more than enough for most CRM deployments.

## Alternative: Keep Local Storage

If you don't want to use Cloudinary, you would need to:
1. Use a paid Render plan with persistent disk storage, OR
2. Use AWS S3, Google Cloud Storage, or similar service

But Cloudinary is the easiest and has a great free tier.

## Summary

**Action Required:**
1. Create Cloudinary account (5 minutes)
2. Add 3 environment variables to Render (2 minutes)
3. Wait for automatic redeploy (3 minutes)
4. Test by uploading a new file

**Total time: ~10 minutes**

After this, all file uploads will be persistent and accessible forever.

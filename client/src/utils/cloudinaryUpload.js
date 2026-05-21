/**
 * Cloudinary image upload utility
 * Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables
 * IMPORTANT: Use an Unsigned Upload Preset to avoid 401 Unauthorized errors
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'yaatri-travel';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'yaatri_unsigned';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

console.log('[CLOUDINARY CONFIG]', {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  url: CLOUDINARY_URL
});

/**
 * Upload image to Cloudinary
 * @param {File} imageFile - Compressed image file
 * @returns {Promise<{url: string, publicId: string}>} - Cloudinary URL and public ID
 * @throws {Error} If upload fails
 */
export const uploadToCloudinary = async (imageFile) => {
  if (!imageFile) {
    throw new Error('No image file provided');
  }

  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
    throw new Error('Cloudinary cloud name not configured');
  }

  if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'your-upload-preset') {
    throw new Error('Cloudinary upload preset not configured');
  }

  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'yaatri-blogs');
  formData.append('resource_type', 'auto');

  try {
    console.log('[CLOUDINARY UPLOAD] Starting upload for file:', imageFile.name);
    
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[CLOUDINARY ERROR] Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: data.error,
        message: data.message
      });
      
      if (response.status === 401) {
        throw new Error('Cloudinary authorization failed. Check if upload preset is unsigned.');
      }
      
      throw new Error(`Cloudinary upload failed: ${data.error?.message || response.statusText}`);
    }

    console.log('[CLOUDINARY SUCCESS] Upload complete:', {
      url: data.secure_url,
      publicId: data.public_id
    });

    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('[CLOUDINARY UPLOAD ERROR]', error.message);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await fetch(`${CLOUDINARY_URL.replace('/upload', '/delete_by_token')}`, {
      method: 'POST',
      body: JSON.stringify({ token: publicId }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.warn('Failed to delete from Cloudinary');
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

export { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET };

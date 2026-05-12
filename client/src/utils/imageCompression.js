/**
 * Compress image to 480p and under 1MB
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions (max 480p on longest side, maintain aspect)
        const maxDimension = 480;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress with quality to get under 1MB
        canvas.toBlob(
          (blob) => {
            // Verify size is under 1MB (1048576 bytes)
            if (blob.size > 1048576) {
              console.warn(`Compressed image still ${(blob.size / 1024 / 1024).toFixed(2)}MB, further compressing...`);
              // Further reduce quality if needed
              canvas.toBlob(
                (finalBlob) => {
                  const compressedFile = new File([finalBlob], file.name, { type: 'image/jpeg' });
                  resolve(compressedFile);
                },
                'image/jpeg',
                0.6
              );
            } else {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

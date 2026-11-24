export type UploadedImage = { url: string; width: number; height: number };

/** Upload a picture and get back its address and its size in pixels as stored. */
export const uploadImageToCloudinary = async (file: File, folder: string): Promise<UploadedImage> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Cloudinary upload failed.');
  }

  const data = await response.json();
  return { url: data.secure_url, width: Number(data.width) || 0, height: Number(data.height) || 0 };
};

export const uploadToCloudinary = async (file: File, folder: string): Promise<string> =>
  (await uploadImageToCloudinary(file, folder)).url;

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export function cleanUrl(cloudinaryId: string, size = 800) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fit,w_${size}/${cloudinaryId}.jpg`;
}

export function downloadUrl(cloudinaryId: string, filename: string) {
  const name = filename.replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "_");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/fl_attachment:${name}/${cloudinaryId}.jpg`;
}

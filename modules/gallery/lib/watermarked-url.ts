const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export function watermarkedUrl(cloudinaryId: string, size = 800) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/l_text:Arial_28_bold:PREVIEW,co_white,o_40,g_center/c_fit,w_${size}/${cloudinaryId}.jpg`;
}

// next/image loader: Cloudinary resizes and encodes once. The default optimizer
// re-encoded Cloudinary's already-lossy output (q_auto → WebP q75), visibly degrading photos.

const UPLOAD = "/image/upload/";
const TRANSFORM_PARAM = /^(a|ac|af|ar|b|bo|br|c|co|cs|d|dl|dn|dpr|du|e|eo|f|fl|fn|fps|g|h|if|ki|l|o|p|pg|q|r|so|sp|t|u|vc|vs|w|x|y|z)_/;

const isTransform = (segment: string) => segment.split(",").every((part) => TRANSFORM_PARAM.test(part));

export default function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const at = src.indexOf(UPLOAD);
  if (!src.startsWith("https://res.cloudinary.com/") || at === -1) return src;

  const segments = src.slice(at + UPLOAD.length).split("/");
  const transforms = segments.findIndex((segment) => !isTransform(segment));
  segments.splice(transforms, 0, `c_limit,w_${width},q_auto:good,f_auto`);
  return src.slice(0, at + UPLOAD.length) + segments.join("/");
}

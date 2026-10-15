export type UploadSignature = {
  apiKey: string;
  timestamp: number | string;
  signature: string;
  folder: string;
  cloudName: string;
};

type Options = {
  resourceType: "image" | "video";
  filename?: string;
  context?: string;
};

export function signedUploadRequest(
  file: Blob,
  sig: UploadSignature,
  { resourceType, filename, context }: Options,
): { url: string; body: FormData } {
  const body = new FormData();
  if (filename) body.append("file", file, filename);
  else body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  if (context !== undefined) body.append("context", context);
  return {
    url: `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
    body,
  };
}

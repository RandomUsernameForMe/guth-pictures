import { describe, it, expect } from "vitest";
import { signedUploadRequest } from "../cloudinary-signed-upload";

const sig = { apiKey: "key", timestamp: 1700000000, signature: "sig", folder: "f", cloudName: "demo" };
const file = new Blob(["x"], { type: "image/jpeg" });

describe("signedUploadRequest", () => {
  it("sestaví URL podle typu zdroje", () => {
    expect(signedUploadRequest(file, sig, { resourceType: "image" }).url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    expect(signedUploadRequest(file, sig, { resourceType: "video" }).url).toBe("https://api.cloudinary.com/v1_1/demo/video/upload");
  });

  it("vyplní podepsaná pole, timestamp jako řetězec, bez contextu", () => {
    const { body } = signedUploadRequest(file, sig, { resourceType: "image" });
    expect(body.get("api_key")).toBe("key");
    expect(body.get("timestamp")).toBe("1700000000");
    expect(body.get("signature")).toBe("sig");
    expect(body.get("folder")).toBe("f");
    expect(body.has("context")).toBe(false);
    expect(body.has("file")).toBe(true);
  });

  it("přidá context a filename, když jsou zadané", () => {
    const { body } = signedUploadRequest(file, sig, { resourceType: "video", context: "alt=a", filename: "s.mp4" });
    expect(body.get("context")).toBe("alt=a");
    expect((body.get("file") as File).name).toBe("s.mp4");
  });
});

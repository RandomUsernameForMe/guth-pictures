import { describe, it, expect } from "vitest";
import cloudinaryLoader from "@/lib/cloudinary-loader";

const BASE = "https://res.cloudinary.com/demo/image/upload";

describe("cloudinaryLoader", () => {
  it("chains width after existing transformations", () => {
    expect(cloudinaryLoader({ src: `${BASE}/c_fill,w_1800,q_auto,f_auto/portfolio/abc`, width: 1200 }))
      .toBe(`${BASE}/c_fill,w_1800,q_auto,f_auto/c_limit,w_1200,q_auto:good,f_auto/portfolio/abc`);
  });

  it("handles multiple transformation segments (watermark overlay)", () => {
    expect(cloudinaryLoader({ src: `${BASE}/l_text:Arial_28_bold:PREVIEW,co_white,o_40,g_center/c_fit,w_800/gal/x.jpg`, width: 640 }))
      .toBe(`${BASE}/l_text:Arial_28_bold:PREVIEW,co_white,o_40,g_center/c_fit,w_800/c_limit,w_640,q_auto:good,f_auto/gal/x.jpg`);
  });

  it("handles URLs without transformations, folders with underscores and versions", () => {
    expect(cloudinaryLoader({ src: `${BASE}/v123/my_folder/abc`, width: 828 }))
      .toBe(`${BASE}/c_limit,w_828,q_auto:good,f_auto/v123/my_folder/abc`);
  });

  it("leaves non-Cloudinary sources untouched", () => {
    expect(cloudinaryLoader({ src: "/editorial/foceni-101-preview.webp", width: 640 }))
      .toBe("/editorial/foceni-101-preview.webp");
  });
});

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: "#C8A96E",
            fontFamily: "serif",
            lineHeight: 1,
            display: "flex",
            marginTop: -2,
          }}
        >
          G
        </div>
      </div>
    ),
    { width: 32, height: 32 }
  );
}

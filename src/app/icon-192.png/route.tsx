import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0D",
          color: "#FFFFFF",
          fontSize: 80,
          fontWeight: 700,
          fontFamily: "sans-serif"
        }}
      >
        <span style={{ color: "#C81E2C" }}>G</span>S
      </div>
    ),
    { width: 192, height: 192 }
  );
}

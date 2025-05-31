import { ImageResponse } from "next/og";

// Route segment config for static export
export const dynamic = "force-static";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // Brain emoji with custom styling
      <div
        style={{
          fontSize: 24,
          background: "transparent",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        🧠
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}

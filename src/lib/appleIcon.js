// Generate a PNG apple-touch-icon (180x180) from any logo URL (PNG/JPG/SVG/WebP).
// iOS' "Add to Home Screen" only reads <link rel="apple-touch-icon"> and does
// NOT support SVG. So we render the logo onto a canvas and use a data URL.
//
// Returns a Promise<string> with a data:image/png;base64,... URL, or null on failure.
export async function buildAppleTouchIconDataURL(logoUrl, { size = 180, bg = "#ffffff" } = {}) {
  if (!logoUrl || typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    let settled = false;
    const done = (val) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(null);

        // White background — iOS does not honor transparency well on home screen
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);

        // Contain the logo with padding so it doesn't touch the edges
        const padding = size * 0.12;
        const maxW = size - padding * 2;
        const maxH = size - padding * 2;
        const ratio = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        done(canvas.toDataURL("image/png"));
      } catch {
        done(null);
      }
    };
    img.onerror = () => done(null);

    // Add a cache-buster only for SVGs to avoid stale CORS/cache issues
    img.src = logoUrl;

    // Safety timeout
    setTimeout(() => done(null), 6000);
  });
}
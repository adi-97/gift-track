// Shared gift-box mark used by both scripts/generate-icons.mjs (PWA/web
// favicons) and scripts/generate-native-assets.mjs (Capacitor iOS/Android
// icons + splash screens), so the glyph only lives in one place.

export const PAPER = "#f2e7cd";
export const TEAL = "#1c6b66";
export const TEAL_STRONG = "#0f4f4b";
export const CREAM = "#f6f1e2";

/** Full-bleed square gift-box mark on a paper background, 512x512 viewBox. */
export function masterSvg() {
  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${PAPER}"/>

  <!-- bow -->
  <ellipse cx="210" cy="172" rx="48" ry="34" fill="${CREAM}" transform="rotate(-26 210 172)"/>
  <ellipse cx="302" cy="172" rx="48" ry="34" fill="${CREAM}" transform="rotate(26 302 172)"/>
  <circle cx="256" cy="182" r="22" fill="${TEAL_STRONG}"/>

  <!-- box lid -->
  <rect x="94" y="198" width="324" height="58" rx="14" fill="${TEAL_STRONG}"/>

  <!-- box body -->
  <rect x="118" y="256" width="276" height="196" rx="18" fill="${TEAL}"/>

  <!-- ribbon -->
  <rect x="236" y="198" width="40" height="254" fill="${CREAM}"/>
  <rect x="94" y="218" width="324" height="20" fill="${CREAM}"/>
</svg>`;
}

/**
 * Just the gift-box glyph (no background rect), for compositing onto
 * adaptive-icon foregrounds and splash screens at arbitrary sizes.
 */
export function glyphSvg({ size = 512, scale = 1 } = {}) {
  const s = (512 * (1 - scale)) / 2;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${s} ${s}) scale(${scale})">
    <ellipse cx="210" cy="172" rx="48" ry="34" fill="${CREAM}" transform="rotate(-26 210 172)"/>
    <ellipse cx="302" cy="172" rx="48" ry="34" fill="${CREAM}" transform="rotate(26 302 172)"/>
    <circle cx="256" cy="182" r="22" fill="${TEAL_STRONG}"/>
    <rect x="94" y="198" width="324" height="58" rx="14" fill="${TEAL_STRONG}"/>
    <rect x="118" y="256" width="276" height="196" rx="18" fill="${TEAL}"/>
    <rect x="236" y="198" width="40" height="254" fill="${CREAM}"/>
    <rect x="94" y="218" width="324" height="20" fill="${CREAM}"/>
  </g>
</svg>`;
}

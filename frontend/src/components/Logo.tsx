import logoUrl from '../assets/logo-original.png';

// Original PNG dimensions
const PNG_W = 440;
const PNG_H = 178;

// Width of just the icon/symbol area (left portion of the PNG)
const ICON_W = 148;

interface LogoProps {
  size?: 'full' | 'icon';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders the original logo PNG with a color-only transformation applied via SVG filter.
 *
 * Color matrix math:
 *   - Boosts R ×1.14, G ×1.13 — keeps warm hue but raises brightness to match #D9A93A
 *   - Boosts B ×1.90 — the biggest shift: original brass gold has very little blue;
 *     this raises it to match the metallic gold target (#D9A93A, #F1C75B)
 *   - White pixels: all values ≥ 1 after scaling, so they clamp to 1 → stay white ✅
 *   - Dark pixels: scale minimally, shift toward navy (#0B1D2D) direction ✅
 *   - Alpha channel: unchanged ✅
 *
 * size="icon": crops viewBox to show only the symbol (open-book + play button)
 * size="full": shows complete logo (symbol + text + tagline)
 */
export function Logo({ size = 'full', className = '', style }: LogoProps) {
  const vbW = size === 'icon' ? ICON_W : PNG_W;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${PNG_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <filter id="lgf" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="
              1.14 0    0    0 0
              0    1.13 0    0 0
              0    0    1.90 0 0
              0    0    0    1 0
            "
          />
        </filter>
      </defs>
      <image
        href={logoUrl}
        x="0"
        y="0"
        width={PNG_W}
        height={PNG_H}
        filter="url(#lgf)"
      />
    </svg>
  );
}

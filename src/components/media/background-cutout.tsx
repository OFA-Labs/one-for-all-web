/** Remove the flat paper background while retaining the supplied artwork. */
export function BackgroundCutout({
  id,
  monochrome = false,
  duotone = false,
}: {
  id: string;
  monochrome?: boolean;
  duotone?: boolean;
}) {
  return (
    <svg
      className="media-filter-definitions"
      aria-hidden="true"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id={id}
          colorInterpolationFilters="sRGB"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          <feColorMatrix
            type="matrix"
            values={`1 0 0 0 0
                     0 1 0 0 0
                     0 0 1 0 0
                     -1 -1 -1 0 ${monochrome ? "2.1" : "2.85"}`}
            result="cutout"
          />
          <feComposite
            in="cutout"
            in2="SourceGraphic"
            operator="in"
            result="cutout"
          />
          {monochrome && (
            <>
              <feFlood floodColor="currentColor" result="ink" />
              <feComposite in="ink" in2="cutout" operator="in" />
            </>
          )}
          {duotone && (
            <>
              {/* The live heart is the one raster glyph. Flatten it to a
                  luminance field, lift the matte mids, then map that field to
                  the shared silver ramp. Static filter; never animated. */}
              <feColorMatrix
                in="cutout"
                type="matrix"
                values="0.2126 0.7152 0.0722 0 0
                        0.2126 0.7152 0.0722 0 0
                        0.2126 0.7152 0.0722 0 0
                        0 0 0 1 0"
                result="luma"
              />
              <feComponentTransfer in="luma" result="lifted">
                <feFuncR type="gamma" amplitude="1" exponent="0.8" offset="0.015"/>
                <feFuncG type="gamma" amplitude="1" exponent="0.8" offset="0.015"/>
                <feFuncB type="gamma" amplitude="1" exponent="0.8" offset="0.015"/>
              </feComponentTransfer>
              {/* Luminance -> the shared silver ramp, alpha preserved. */}
              <feColorMatrix
                in="lifted"
                type="matrix"
                values="0.1859 0.6255 0.0631 0 0.0431
                        0.1892 0.6367 0.0643 0 0.0588
                        0.1926 0.6479 0.0654 0 0.0941
                        0 0 0 1 0"
                result="duotone"
              />
              <feComposite in="duotone" in2="cutout" operator="in" />
            </>
          )}
        </filter>
      </defs>
    </svg>
  );
}

/** Remove the flat paper background while retaining the supplied artwork. */
export function BackgroundCutout({
  id,
  monochrome = false,
}: {
  id: string;
  monochrome?: boolean;
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
        </filter>
      </defs>
    </svg>
  );
}

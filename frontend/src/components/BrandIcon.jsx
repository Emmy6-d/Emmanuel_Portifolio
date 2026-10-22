export function BrandIcon({ icon, size = 18 }) {
  const [width, height, , , pathData] = icon.icon
  const paths = Array.isArray(pathData) ? pathData : [pathData]
  return <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${width} ${height}`} fill="currentColor">{paths.map((path, index) => <path d={path} key={index} />)}</svg>
}

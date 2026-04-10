export default function Logo({ size = 20, className = '', light = false }) {
  const stroke = light ? '#E8E9ED' : '#6366F1'; // Bharat Indigo
  const accent = '#FF9933'; // Kesari Saffron
  const green = '#128807'; // India Green
  const fill = light ? '#E8E9ED' : '#0D0F14';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      {/* ── Outer hexagon frame (blockchain network) ── */}
      <polygon
        points="100,10 180,46 180,154 100,190 20,154 20,46"
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* ── Vertex nodes ── */}
      {[
        [100, 10], [180, 46], [180, 154], [100, 190], [20, 154], [20, 46]
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill={i % 2 === 0 ? accent : green} />
      ))}

      {/* ── Diagonal network lines ── */}
      <line x1="100" y1="10" x2="100" y2="60" stroke={stroke} strokeWidth="3.5" opacity="0.3" />
      <line x1="180" y1="46" x2="145" y2="75" stroke={stroke} strokeWidth="3.5" opacity="0.3" />
      <line x1="180" y1="154" x2="145" y2="125" stroke={stroke} strokeWidth="3.5" opacity="0.3" />
      <line x1="100" y1="190" x2="100" y2="140" stroke={stroke} strokeWidth="3.5" opacity="0.3" />
      <line x1="20" y1="154" x2="55" y2="125" stroke={stroke} strokeWidth="3.5" opacity="0.3" />
      <line x1="20" y1="46" x2="55" y2="75" stroke={stroke} strokeWidth="3.5" opacity="0.3" />

      {/* ── Inner shield ── */}
      <path
        d="M100 55 L140 72 V112 C140 132 122 148 100 155 C78 148 60 132 60 112 V72 Z"
        fill={fill}
        fillOpacity="0.15"
        stroke={stroke}
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* ── Central Hub (Chakra Influence) ── */}
      <circle cx="100" cy="102" r="24" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="100" cy="102" r="18" fill="none" stroke={stroke} strokeWidth="3" />
      
      {/* 24 Spokes (simplified representation) */}
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="100" y1="102"
          x2={100 + 18 * Math.cos((i * Math.PI) / 6)}
          y2={102 + 18 * Math.sin((i * Math.PI) / 6)}
          stroke={stroke}
          strokeWidth="1.5"
          opacity="0.6"
        />
      ))}

      {/* ── Blue verification checkmark ── */}
      <polyline
        points="108,96 118,108 138,82"
        fill="none"
        stroke={stroke}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const CatanHexIcon: React.FC<Props> = ({ className = 'w-6 h-6', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon */}
      <polygon
        points="24,3 43,14 43,36 24,47 5,36 5,14"
        fill="#D97706"
        stroke="#B45309"
        strokeWidth="2.5"
      />
      {/* Inner Hexagon Fill with Pasture / Earth tone */}
      <polygon
        points="24,6 40,15 40,34 24,43 8,34 8,15"
        fill="#F59E0B"
      />
      {/* Wooden Settlement / City silhouette in center */}
      <path
        d="M24 13L16 20V32H32V20L24 13Z"
        fill="#78350F"
        stroke="#451A03"
        strokeWidth="1.5"
      />
      {/* Small settlement chimney / tower */}
      <rect x="25" y="16" width="3" height="4" fill="#92400E" />
      {/* Door */}
      <rect x="22" y="26" width="4" height="6" rx="1" fill="#FEF3C7" />
    </svg>
  );
};

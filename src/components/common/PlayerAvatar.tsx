import React from 'react';

interface PlayerAvatarProps {
  name: string;
  photo?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glow?: boolean;
  className?: string;
}

// Exact brand colors matching the UI screenshot
const PLAYER_COLOR_MAP: Record<string, string> = {
  'elamaran': 'bg-[#10b981] text-white', // Green EL
  'elamaran j': 'bg-[#10b981] text-white',
  'arun': 'bg-[#2563eb] text-white',     // Blue AR
  'vijay': 'bg-[#e11d48] text-white',    // Magenta/Red VI
  'rahul': 'bg-[#7c3aed] text-white',    // Purple RA
  'ajay': 'bg-[#0d9488] text-white',     // Teal AJ
  'hari': 'bg-[#16a34a] text-white',     // Green HA
  'bharath': 'bg-[#9333ea] text-white',  // Purple BH
  'bharath m': 'bg-[#9333ea] text-white',
  'bala': 'bg-[#ea580c] text-white',     // Orange BA
};

const FALLBACK_PALETTES = [
  'bg-[#2563eb] text-white',
  'bg-[#10b981] text-white',
  'bg-[#e11d48] text-white',
  'bg-[#7c3aed] text-white',
  'bg-[#0d9488] text-white',
  'bg-[#ea580c] text-white',
];

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  photo,
  size = 'md',
  glow = false,
  className = '',
}) => {
  const getInitials = (str: string) => {
    if (!str) return '??';
    const clean = str.trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getColorClass = (str: string) => {
    const key = (str || '').trim().toLowerCase();
    if (PLAYER_COLOR_MAP[key]) return PLAYER_COLOR_MAP[key];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % FALLBACK_PALETTES.length;
    return FALLBACK_PALETTES[idx];
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs font-bold',
    md: 'w-8 h-8 text-xs font-bold',
    lg: 'w-11 h-11 text-sm font-extrabold',
    xl: 'w-16 h-16 text-lg font-black',
    '2xl': 'w-24 h-24 text-2xl font-black',
  }[size];

  const glowStyle = glow 
    ? 'ring-2 ring-blue-500 shadow-md' 
    : '';

  if (photo) {
    return (
      <div className={`relative inline-block rounded-full shrink-0 overflow-hidden ${sizeClasses} ${glowStyle} ${className}`}>
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const colorClass = getColorClass(name || '');

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 font-display tracking-normal select-none ${colorClass} ${sizeClasses} ${glowStyle} ${className}`}
      title={name}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};

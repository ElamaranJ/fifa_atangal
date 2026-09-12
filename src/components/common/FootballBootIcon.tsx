import React from 'react';

interface FootballBootIconProps {
  variant: 'gold' | 'silver' | 'bronze' | 'dark';
  className?: string;
  width?: number;
  height?: number;
}

export const FootballBootIcon: React.FC<FootballBootIconProps> = ({
  variant,
  className = '',
  width = 38,
  height = 22,
}) => {
  const gradientId = `boot_grad_${variant}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform hover:scale-110 ${className}`}
    >
      <defs>
        {variant === 'gold' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="35%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
        )}
        {variant === 'silver' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="40%" stopColor="#CBD5E1" />
            <stop offset="75%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        )}
        {variant === 'bronze' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="40%" stopColor="#EA580C" />
            <stop offset="75%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>
        )}
        {variant === 'dark' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        )}
        <linearGradient id="stud_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Main Boot Upper Body */}
      <path
        d="M6 14C8 10 12 7 17 6C23 5 28 8 32 11C36 13.5 41 15 45 17C46 17.5 46.5 18.5 46 19.5C45.5 20.5 44 21 42 21H10C7.5 21 6 19 6 17V14Z"
        fill={`url(#${gradientId})`}
      />

      {/* Modern Aerodynamic Boot Collar & Heel */}
      <path
        d="M6 14C6 11 8 8 11 7C11.5 6.8 12.5 7.5 12 8.5C11 10.5 10 13 10.5 16"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Boot Insole & Lacing Ribs */}
      <path
        d="M19 8.5L23 11.5M22 7.5L26 10.5M25 7L29 10"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Sole Plate */}
      <path
        d="M7 21C15 21 34 21.2 44 20.5C44.5 20.5 45 21 44.5 21.8C44 22.5 42 23 40 23H10C8 23 7 22.2 7 21Z"
        fill="#1e293b"
      />

      {/* Outsole Studs / Cleats */}
      <rect x="10" y="23" width="3" height="3" rx="0.8" fill="url(#stud_grad)" />
      <rect x="16" y="23" width="3" height="3" rx="0.8" fill="url(#stud_grad)" />
      <rect x="28" y="23" width="3" height="3.5" rx="0.8" fill="url(#stud_grad)" />
      <rect x="34" y="23" width="3" height="3.5" rx="0.8" fill="url(#stud_grad)" />
      <rect x="40" y="22.5" width="2.8" height="3.5" rx="0.8" fill="url(#stud_grad)" />

      {/* Swoosh / Speed Stripe Accent */}
      <path
        d="M14 17C19 16 26 14 36 17"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

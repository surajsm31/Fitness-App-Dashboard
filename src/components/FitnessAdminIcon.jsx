import React from 'react';

const FitnessAdminIcon = ({ 
  size = 24, 
  className = '', 
  color = 'currentColor' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Primary Sunset Gradient */}
        <linearGradient id="adminSunsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        
        {/* Soft Gold/Orange Glow */}
        <filter id="adminGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>
          {`
            @keyframes gearSpin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }

            @keyframes shieldGlow {
              0%, 100% {
                opacity: 0.85;
                filter: drop-shadow(0 0 1px rgba(245, 158, 11, 0.4));
              }
              50% {
                opacity: 1;
                filter: drop-shadow(0 0 3px rgba(249, 115, 22, 0.8));
              }
            }

            @keyframes dumbbellActive {
              0%, 100% {
                transform: scale(1) translate(0, 0);
              }
              50% {
                transform: scale(1.05) translate(0, -0.5px);
              }
            }

            .anim-gear {
              animation: gearSpin 15s linear infinite;
              transform-origin: 12px 12px;
            }

            .anim-shield {
              animation: shieldGlow 4s ease-in-out infinite;
              transform-origin: 12px 12px;
            }

            .anim-dumbbell {
              animation: dumbbellActive 3s ease-in-out infinite;
              transform-origin: 12px 12.5px;
            }
          `}
        </style>
      </defs>

      {/* Rotating Outer Administrative Gear */}
      <path
        className="anim-gear"
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke="url(#adminSunsetGrad)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />

      {/* Glowing Inner Shield representing Protection & Administration */}
      <path
        className="anim-shield"
        d="M 12 6.5 C 15 7.2 17.5 8.2 17.5 8.7 C 17.5 12.2 17 15.2 12 18 C 7 15.2 6.5 12.2 6.5 8.7 C 6.5 8.2 9 7.2 12 6.5 Z"
        stroke="url(#adminSunsetGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#090d16"
        fillOpacity="0.45"
        filter="url(#adminGlow)"
      />

      {/* Interactive Gym Dumbbell (Fitness element) in the center */}
      <g className="anim-dumbbell">
        {/* Dumbbell Bar */}
        <line
          x1="9.2"
          y1="12.5"
          x2="14.8"
          y2="12.5"
          stroke="url(#adminSunsetGrad)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        
        {/* Left Weight Plates */}
        <rect
          x="8.4"
          y="10.2"
          width="0.8"
          height="4.6"
          rx="0.3"
          fill="url(#adminSunsetGrad)"
        />
        <rect
          x="7.5"
          y="9.2"
          width="0.7"
          height="6.6"
          rx="0.3"
          fill="url(#adminSunsetGrad)"
          opacity="0.95"
        />
        
        {/* Right Weight Plates */}
        <rect
          x="14.8"
          y="10.2"
          width="0.8"
          height="4.6"
          rx="0.3"
          fill="url(#adminSunsetGrad)"
        />
        <rect
          x="15.8"
          y="9.2"
          width="0.7"
          height="6.6"
          rx="0.3"
          fill="url(#adminSunsetGrad)"
          opacity="0.95"
        />
      </g>
    </svg>
  );
};

export default FitnessAdminIcon;

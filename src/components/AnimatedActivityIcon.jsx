import React from 'react';

const AnimatedActivityIcon = ({ 
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
        {/* Gradient for professional look */}
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        
        {/* Green gradient for EKG line */}
        <linearGradient id="ekgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <style>
          {`
            @keyframes subtlePulse {
              0% { 
                opacity: 0.3;
                transform: scale(1);
              }
              50% { 
                opacity: 0.6;
                transform: scale(1.02);
              }
              100% { 
                opacity: 0.3;
                transform: scale(1);
              }
            }
            
            @keyframes smoothDraw {
              0% { 
                stroke-dashoffset: 120;
                opacity: 0.4;
              }
              20% {
                opacity: 0.8;
              }
              50% { 
                stroke-dashoffset: 0;
                opacity: 1;
              }
              80% {
                opacity: 0.8;
              }
              100% { 
                stroke-dashoffset: -120;
                opacity: 0.4;
              }
            }
            
            .heartbeat-line {
              stroke-dasharray: 120;
              stroke-dashoffset: 0;
              animation: smoothDraw 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            
            .background-circle {
              animation: subtlePulse 6s ease-in-out infinite;
              transform-origin: center;
            }
          `}
        </style>
      </defs>
      
      {/* Background circle with subtle pulse */}
      <circle
        cx="12"
        cy="12"
        r="11.5"
        fill="none"
        stroke="url(#iconGradient)"
        strokeWidth="1.5"
        className="background-circle"
      />
      
      {/* Main EKG/heartbeat line with green gradient */}
      <path
        d="M 3 12 L 5 12 L 7 6 L 13 18 L 15 12 L 21 12"
        stroke="url(#ekgGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="heartbeat-line"
        filter="url(#glow)"
      />
      
          </svg>
  );
};

export default AnimatedActivityIcon;

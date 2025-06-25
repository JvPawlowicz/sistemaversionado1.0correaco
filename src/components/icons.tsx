import * as React from 'react';

export const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
  >
    <path
      d="M30 20 C30 10, 40 10, 40 20 L40 80 C40 90, 30 90, 30 80 Z"
      className="stroke-primary"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M60 20 C60 10, 70 10, 70 20 L70 80 C70 90, 60 90, 60 80 Z"
      className="stroke-primary"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 50 L80 50"
      className="stroke-accent"
      strokeWidth="8"
      strokeLinecap="round"
    />
  </svg>
);

import * as React from 'react';

export const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
  >
    <circle
      cx="35"
      cy="50"
      r="12"
      className="stroke-primary"
      strokeWidth="8"
    />
    <circle
      cx="65"
      cy="50"
      r="12"
      className="stroke-primary"
      strokeWidth="8"
    />
    <path
      d="M47 50 L53 50"
      className="stroke-accent"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M35 38 V 25"
      className="stroke-primary"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M65 62 V 75"
      className="stroke-primary"
      strokeWidth="8"
      strokeLinecap="round"
    />
  </svg>
);

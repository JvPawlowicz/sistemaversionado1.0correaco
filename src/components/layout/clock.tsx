
'use client';

import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    // This function is only defined and called on the client side
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    
    // Set initial time to avoid hydration mismatch
    updateClock();

    // Update time every second
    const timerId = setInterval(updateClock, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timerId);
  }, []); // Empty dependency array ensures this runs once on mount

  if (!time) {
    return null; // Don't render on the server or before the first client-side render
  }

  return (
    <div className="hidden items-center gap-2 text-sm font-medium sm:flex">
      <span>{time}</span>
    </div>
  );
}

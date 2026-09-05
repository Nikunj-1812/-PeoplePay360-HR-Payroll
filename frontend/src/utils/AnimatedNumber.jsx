import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber component
 * Smoothly animates numerical KPI values on render and real-time updates.
 * Respects prefers-reduced-motion.
 */
export default function AnimatedNumber({ value, prefix = '', suffix = '', formatter }) {
  const [displayValue, setDisplayValue] = useState(() => Number(value) || 0);
  const prevValueRef = useRef(Number(value) || 0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const targetVal = Number(value) || 0;
    
    // Respect reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(targetVal);
      prevValueRef.current = targetVal;
      return;
    }

    const startVal = prevValueRef.current;
    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    const startTime = performance.now();
    const duration = 450; // ms

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        prevValueRef.current = targetVal;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value]);

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString('en-IN');

  return <span>{prefix}{formatted}{suffix}</span>;
}

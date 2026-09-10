import React, { useState, useEffect, useRef } from 'react';

interface AnimatedPriceProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  showDirectionBadge?: boolean;
}

export default function AnimatedPrice({
  value,
  className = '',
  prefix = 'Rs. ',
  suffix = '',
  duration = 600,
  showDirectionBadge = false
}: AnimatedPriceProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    setDirection(endValue > startValue ? 'up' : 'down');
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
        setTimeout(() => setDirection(null), 400);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      previousValueRef.current = endValue;
    };
  }, [value, duration]);

  const diff = value - previousValueRef.current;

  return (
    <span className="inline-flex items-center gap-1.5 transition-all duration-300 relative">
      <span
        className={`inline-block transition-all duration-300 font-numeric ${
          direction === 'up'
            ? 'text-emerald-600 scale-105 font-black drop-shadow-xs'
            : direction === 'down'
            ? 'text-amber-700 scale-95 font-black'
            : ''
        } ${className}`}
      >
        {prefix}
        {Math.round(displayValue).toLocaleString()}
        {suffix}
      </span>

      {showDirectionBadge && direction && (
        <span
          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse transition-all ${
            direction === 'up'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          {direction === 'up' ? `+Rs. ${Math.abs(diff).toLocaleString()}` : `-Rs. ${Math.abs(diff).toLocaleString()}`}
        </span>
      )}
    </span>
  );
}

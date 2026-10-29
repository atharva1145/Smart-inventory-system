import React from 'react';

interface BarcodeProps {
  value: string;
  className?: string;
  height?: number;
  showText?: boolean;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  className = '',
  height = 48,
  showText = true,
}) => {
  // Generate deterministic pseudo-barcode pattern from string chars
  const generateBars = (str: string) => {
    const bars: { width: number; isBlack: boolean }[] = [];
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const w1 = ((code * 3) % 3) + 1;
      const w2 = ((code * 5) % 2) + 1;
      const w3 = ((code * 7) % 3) + 1;
      bars.push({ width: w1, isBlack: true });
      bars.push({ width: w2, isBlack: false });
      bars.push({ width: w3, isBlack: true });
      bars.push({ width: 1, isBlack: false });
    }

    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 3, isBlack: true });
    return bars;
  };

  const bars = generateBars(value || 'SAMPLE');
  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        height={height}
        width={bars.reduce((sum, b) => sum + b.width * 2, 0) + 16}
        className="bg-white px-2 py-1 rounded"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          const barWidth = bar.width * 2;
          currentX += barWidth;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x + 8}
              y={2}
              width={barWidth}
              height={height - 4}
              fill="#111827"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-xs text-gray-600 mt-1 tracking-wider uppercase">
          {value}
        </span>
      )}
    </div>
  );
};

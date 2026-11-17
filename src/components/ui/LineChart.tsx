// src/components/ui/LineChart.tsx

import { COLORS } from '@/constants/theme';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function makeSeries(seed: number, n = 60, drift = 0.004, vol = 0.03) {
  const r = seeded(seed);
  let v = 100;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    v *= 1 + drift + (r() - 0.5) * vol;
    out.push(v);
  }
  return out;
}

interface LineChartProps {
  data: number[];
  height?: number;
  showDot?: boolean;
}

export function LineChart({ data, height = 180, showDot = true }: LineChartProps) {
  const w = 340;

  const validData = data.filter(Number.isFinite);
  const safeData = validData.length > 0 ? validData : [0, 0];
  const min = safeData.reduce((lowest, value) => Math.min(lowest, value), Infinity);
  const max = safeData.reduce((highest, value) => Math.max(highest, value), -Infinity);
  const range = max - min || 1; // Prevents division by zero if flat

  const pts = safeData.map((v, i) => [
    (i / (safeData.length - 1 || 1)) * w,
    height - 12 - ((v - min) / range) * (height - 32),
  ]);

  const d = pts
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');

  const last = pts[pts.length - 1];
  const id = useId().replace(/:/g, '');

  const isPositive = safeData[safeData.length - 1] >= safeData[0];
  const lineColor = isPositive ? COLORS.accent : COLORS.down;

  return (
    <View style={{ width: '100%', height }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            {/* Fade from the accent purple to transparent */}
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Horizontal Grid Lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1="0"
            x2={w}
            y1={height * f}
            y2={height * f}
            stroke={COLORS.line}
            strokeWidth="1"
            strokeDasharray="4 4" // Added dashes for a cleaner, premium look
          />
        ))}
        
        {/* The Gradient Fill */}
        <Path d={`${d} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
        
        {/* The Purple Line */}
        <Path
          d={d}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* The Live Dot at the end */}
        {showDot && <Circle cx={last[0]} cy={last[1]} r="4" fill={lineColor} />}
      </Svg>
    </View>
  );
}
// src/components/ui/LineChart.tsx

import { COLORS } from '@/constants/theme';
import { useMemo } from 'react';
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
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    height - 12 - ((v - min) / range) * (height - 32),
  ]);

  const d = pts
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');

  const last = pts[pts.length - 1];
  const id = useMemo(() => 'g' + Math.random().toString(36).slice(2, 8), []);

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
            <Stop offset="0" stopColor={COLORS.t1} stopOpacity="0.08" />
            <Stop offset="1" stopColor={COLORS.t1} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1="0"
            x2={w}
            y1={height * f}
            y2={height * f}
            stroke="#EEF0F2"
            strokeWidth="1"
          />
        ))}
        <Path d={`${d} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
        <Path
          d={d}
          fill="none"
          stroke={COLORS.t1}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {showDot && <Circle cx={last[0]} cy={last[1]} r="4" fill={COLORS.t1} />}
      </Svg>
    </View>
  );
}
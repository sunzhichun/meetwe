import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * 简约“图钉”图标（替代 emoji）
 * - 用描边轮廓风格，便于在选中态/未选中态做颜色区分
 */
export function PinIcon(props: { size?: number; color?: string; filled?: boolean }) {
  const size = props.size ?? 14;
  const color = props.color ?? '#0F3A4A';
  const filled = props.filled ?? false;

  // 参考图为“推钉/图钉”轮廓：圆头 + 下方针体。
  // - 未选中：使用白色更简约
  // - 选中：使用指定 color（如 #D2E0AA）
  const fillColor = filled ? color : '#ffffff';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      {/* 圆头 */}
      <Circle cx={12} cy={7.5} r={4.3} fill={fillColor} />
      {/* 针体：略带圆角的矩形 */}
      <Rect x={11} y={10} width={2} height={9} rx={1} fill={fillColor} />
      {/* 尖端（小三角） */}
      <Path d="M10 19.2 L12 16.5 L14 19.2 Z" fill={fillColor} />
    </Svg>
  );
}


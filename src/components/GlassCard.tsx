import React from 'react';
import { Box } from 'native-base';

/**
 * 玻璃拟态卡片壳
 *
 * 为什么不是纯白？
 * - 参考图的关键是“半透明/轻雾化”，让整体更灵动
 * - 本 MVP 用 NativeBase 的 shadow + 半透明背景来模拟
 */
export function GlassCard(props: {
  children: React.ReactNode;
  px?: number;
  py?: number;
  // 让卡片在父容器里占满宽度，避免在 ScrollView 布局下出现“内容向右挤”的问题
  w?: string | number;
}) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow={0}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
      }}
      px={props.px}
      py={props.py}
      w={props.w as any}
    >
      {props.children}
    </Box>
  );
}


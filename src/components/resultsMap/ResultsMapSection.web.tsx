import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Pressable, Text } from 'native-base';
import { useWindowDimensions } from 'react-native';
import { getAmapWebJsKey, getAmapWebSecurityJsCode } from '../../config/env';
import type { Recommendation } from '../../types';
import type { ResultsMapSectionProps } from './types';

type AMapLngLat = [number, number];

type AMapMarkerInstance = {
  off?: (eventName: string, handler: () => void) => void;
  on?: (eventName: string, handler: () => void) => void;
};

type AMapMapInstance = {
  add?: (overlays: unknown[]) => void;
  clearMap?: () => void;
  destroy?: () => void;
  setFitView?: (overlays?: unknown[], immediately?: boolean, avoid?: number[]) => void;
};

type AMapMarkerCtor = new (config: Record<string, unknown>) => AMapMarkerInstance;
type AMapMapCtor = new (container: HTMLElement, config: Record<string, unknown>) => AMapMapInstance;

type AMapWindow = Window & {
  AMap?: {
    Map: AMapMapCtor;
    Marker: AMapMarkerCtor;
  };
  _AMapSecurityConfig?: {
    securityJsCode?: string;
  };
  __meetweAmapLoader?: Promise<void>;
};

function getAmapWindow(): AMapWindow {
  return window as AMapWindow;
}

function participantMarkerHtml(label: string) {
  const safeLabel = label.replace(/"/g, '&quot;');
  return `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
      <div style="width:22px;height:22px;border-radius:50%;background:#3B82F6;border:2px solid #fff;
        box-sizing:border-box;display:flex;align-items:center;justify-content:center;">
        <div style="width:5px;height:5px;border-radius:50%;background:#fff;"></div>
      </div>
      <div style="margin-top:4px;max-width:120px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,0.92);
        border:1px solid rgba(15,58,74,0.18);font-size:11px;line-height:13px;font-weight:700;color:#0F3A4A;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${safeLabel}
      </div>
    </div>
  `;
}

function recommendationMarkerHtml(rank: number) {
  return `
    <div style="width:30px;height:30px;border-radius:50%;background:#E36D68;border:2px solid #fff;
      box-sizing:border-box;
      color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;
      transform:translate(-50%,-100%);">
      ${rank}
    </div>
  `;
}

async function loadAmapWebSdk() {
  const w = getAmapWindow();
  if (w.AMap?.Map && w.AMap?.Marker) return;
  if (w.__meetweAmapLoader) return w.__meetweAmapLoader;

  const key = getAmapWebJsKey();
  if (!key) {
    throw new Error('未配置 EXPO_PUBLIC_AMAP_WEB_JS_KEY（或 EXPO_PUBLIC_AMAP_KEY）');
  }
  const securityJsCode = getAmapWebSecurityJsCode();
  if (securityJsCode) {
    w._AMapSecurityConfig = { securityJsCode };
  }

  w.__meetweAmapLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-meetwe-amap-web="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('高德地图 JS SDK 加载失败')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.dataset.meetweAmapWeb = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('高德地图 JS SDK 加载失败'));
    document.head.appendChild(script);
  });

  return w.__meetweAmapLoader;
}

function useAmapMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  visible: boolean,
  participantPoints: Array<{ position: AMapLngLat; label: string }>,
  recommendationPoints: Array<{ position: AMapLngLat; rank: number; recommendation: Recommendation }>,
  onPickRecommendation: (recommendation: Recommendation) => void
) {
  const mapRef = useRef<AMapMapInstance | null>(null);

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    let cancelled = false;
    let markerCleanups: Array<() => void> = [];

    (async () => {
      try {
        await loadAmapWebSdk();
        if (cancelled || !containerRef.current) return;
        const { AMap } = getAmapWindow();
        if (!AMap?.Map || !AMap?.Marker) {
          throw new Error('高德地图 JS SDK 尚未就绪');
        }

        const map = new AMap.Map(containerRef.current, {
          viewMode: '2D',
          zoom: 11,
          mapStyle: 'amap://styles/normal',
          resizeEnable: true,
        });
        mapRef.current = map;

        const overlays: unknown[] = [];

        participantPoints.forEach((point) => {
          const marker = new AMap.Marker({
            position: point.position,
            content: participantMarkerHtml(point.label),
            anchor: 'bottom-center',
          });
          overlays.push(marker);
        });

        recommendationPoints.forEach((point) => {
          const marker = new AMap.Marker({
            position: point.position,
            content: recommendationMarkerHtml(point.rank),
            anchor: 'bottom-center',
          });
          const handler = () => onPickRecommendation(point.recommendation);
          marker.on?.('click', handler);
          markerCleanups.push(() => marker.off?.('click', handler));
          overlays.push(marker);
        });

        map.add?.(overlays);
        if (overlays.length > 0) {
          map.setFitView?.(overlays, false, [48, 48, 48, 48]);
        }
      } catch {
        // 交由外层 fallback UI 处理
      }
    })();

    return () => {
      cancelled = true;
      markerCleanups.forEach((fn) => fn());
      markerCleanups = [];
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, [containerRef, onPickRecommendation, participantPoints, recommendationPoints, visible]);
}

/**
 * Web：使用高德 JS 地图渲染结果页地图，尽量与 App 端保持一致：
 * - 预览地图
 * - 全屏查看
 * - 参与者蓝点
 * - 推荐红点与点击摘要
 */
export function ResultsMapSection(props: ResultsMapSectionProps) {
  const { onFullscreenChange } = props;
  const { height } = useWindowDimensions();
  const h = Math.min(240, Math.round(height * 0.28));
  const [fullscreen, setFullscreen] = useState(false);
  const [picked, setPicked] = useState<Recommendation | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fullRef = useRef<HTMLDivElement | null>(null);

  const participantPoints = useMemo(
    () => props.participantCoords.map((c, i) => ({ position: [c.lng, c.lat] as AMapLngLat, label: props.participantLabels[i] ?? `${i + 1}` })),
    [props.participantCoords, props.participantLabels]
  );

  const recommendationPoints = useMemo(
    () =>
      props.mapTopRecommendations.map((r, idx) => ({
        position: [r.place.coordinate.lng, r.place.coordinate.lat] as AMapLngLat,
        rank: idx + 1,
        recommendation: r,
      })),
    [props.mapTopRecommendations]
  );

  useEffect(() => {
    let cancelled = false;
    loadAmapWebSdk()
      .then(() => {
        if (!cancelled) setMapError(null);
      })
      .catch((e) => {
        if (!cancelled) {
          setMapError(
            e instanceof Error
              ? e.message
              : '网页地图加载失败。请检查高德 Web JS Key、securityJsCode 与域名/IP 白名单配置。'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onFullscreenChange?.(fullscreen);
    document.body.style.overflow = fullscreen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreen, onFullscreenChange]);

  useAmapMap(previewRef, !mapError, participantPoints, recommendationPoints, setPicked);
  useAmapMap(fullRef, fullscreen && !mapError, participantPoints, recommendationPoints, setPicked);

  if (props.mapTopRecommendations.length === 0 && props.participantCoords.length === 0) {
    return null;
  }

  return (
    <Box w="100%">
      <Box position="relative" w="100%" borderRadius="2xl" overflow="hidden" style={{ height: h }}>
        {mapError ? (
          <Box
            h="100%"
            w="100%"
            bg="rgba(255,255,255,0.45)"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.35)"
            justifyContent="center"
            alignItems="center"
            px={4}
          >
            <Text fontWeight="bold" color="gray.700">
              地图预览
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600" textAlign="center">
              {mapError}
            </Text>
          </Box>
        ) : (
          <div ref={previewRef} style={{ width: '100%', height: '100%' }} />
        )}
        <Pressable
          onPress={() => setFullscreen(true)}
          position="absolute"
          top="10px"
          right="10px"
          bg="rgba(255,255,255,0.92)"
          px={3}
          py={1.5}
          borderRadius={12}
          borderWidth={1}
          borderColor="rgba(15,58,74,0.2)"
          accessibilityLabel="全屏地图"
        >
          <Text fontSize="sm" fontWeight="medium" color="#4A4A4A">
            全屏
          </Text>
        </Pressable>
      </Box>

      {fullscreen
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                inset: '0',
                zIndex: 99999,
                background: '#000000',
              }}
            >
              <div ref={fullRef} style={{ width: '100%', height: '100%' }} />
              <Pressable
                onPress={() => setFullscreen(false)}
                position="absolute"
                top="16px"
                right="16px"
                bg="rgba(255,255,255,0.92)"
                px={4}
                py={2}
                borderRadius={12}
                borderWidth={1}
                borderColor="rgba(15,58,74,0.2)"
                accessibilityLabel="关闭全屏地图"
              >
                <Text fontSize="sm" fontWeight="medium" color="#1A1A1A">
                  关闭
                </Text>
              </Pressable>

              {picked ? (
                <Box
                  position="absolute"
                  left="20px"
                  right="20px"
                  bottom="20px"
                  bg="rgba(255,255,255,0.95)"
                  borderRadius="2xl"
                  p={4}
                >
                  <Text fontWeight="bold" color="#1A1A1A">
                    {picked.place.name}
                  </Text>
                  <Text mt={1} color="gray.700">
                    类别：{picked.place.category}
                  </Text>
                  <Text color="gray.700">评分：{picked.rating.toFixed(1)}</Text>
                  <Text color="#1A1A1A" fontWeight="bold">
                    平均耗时：{Math.round(picked.meanMinutes)} min
                  </Text>
                </Box>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </Box>
  );
}

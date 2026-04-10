import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text as RNText,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text } from 'native-base';
import type { LatLng, Recommendation } from '../../types';
import type { ResultsMapSectionProps } from './types';

type MapCoord = { latitude: number; longitude: number };

function toMapCoord(c: LatLng): MapCoord {
  return { latitude: c.lat, longitude: c.lng };
}

function fitMapToCoords(mapRef: React.RefObject<MapView | null>, coords: MapCoord[]) {
  if (!mapRef.current || coords.length === 0) return;
  if (coords.length === 1) {
    const c = coords[0]!;
    mapRef.current.animateToRegion(
      {
        ...c,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
      250
    );
    return;
  }
  mapRef.current.fitToCoordinates(coords, {
    edgePadding: { top: 56, right: 48, bottom: 48, left: 48 },
    animated: true,
  });
}

/**
 * 结果页地图：约 1/4 屏高预览、全屏缩放、红点 Top5 可点摘要弹窗；与列表共用「筛选后 Top5」数据。
 */
export function ResultsMapSection(props: ResultsMapSectionProps) {
  const { participantCoords, participantLabels, mapTopRecommendations, onFullscreenChange } = props;
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const previewH = Math.min(240, Math.round(winH * 0.28));

  const previewRef = useRef<MapView>(null);
  const fullRef = useRef<MapView>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [picked, setPicked] = useState<Recommendation | null>(null);

  useEffect(() => {
    onFullscreenChange?.(fullscreen);
  }, [fullscreen, onFullscreenChange]);

  const participantPoints = useMemo(
    () => participantCoords.map((c, i) => ({ coord: c, label: participantLabels[i] ?? `${i + 1}` })),
    [participantCoords, participantLabels]
  );

  const allCoords = useMemo(() => {
    const list: MapCoord[] = participantCoords.map(toMapCoord);
    for (const r of mapTopRecommendations) {
      list.push(toMapCoord(r.place.coordinate));
    }
    return list;
  }, [participantCoords, mapTopRecommendations]);

  const runFit = useCallback(() => {
    const ref = fullscreen ? fullRef : previewRef;
    requestAnimationFrame(() => {
      fitMapToCoords(ref, allCoords);
    });
  }, [allCoords, fullscreen]);

  useEffect(() => {
    runFit();
  }, [runFit]);

  useEffect(() => {
    if (!fullscreen) return;
    const t = setTimeout(() => fitMapToCoords(fullRef, allCoords), 400);
    return () => clearTimeout(t);
  }, [fullscreen, allCoords]);

  if (allCoords.length === 0) {
    return null;
  }

  const mapProps = {
    showsUserLocation: false,
    showsCompass: true,
    mapType: 'standard' as const,
  };

  const renderMarkers = () => (
    <>
      {participantPoints.map((p, idx) => (
        <Marker
          key={`p_${idx}_${p.coord.lat}_${p.coord.lng}`}
          coordinate={toMapCoord(p.coord)}
          tracksViewChanges={false}
        >
          <View style={styles.participantMarkerWrap}>
            <View style={styles.bluePin}>
              <RNText style={styles.pinText}>●</RNText>
            </View>
            <View style={styles.participantLabelPill}>
              <RNText style={styles.participantLabelText} numberOfLines={1}>
                {p.label}
              </RNText>
            </View>
          </View>
        </Marker>
      ))}
      {mapTopRecommendations.map((r, idx) => {
        const rank = idx + 1;
        return (
          <Marker
            key={r.place.id}
            coordinate={toMapCoord(r.place.coordinate)}
            tracksViewChanges={false}
            onPress={() => setPicked(r)}
          >
            <View style={styles.redPin}>
              <RNText style={styles.rankText}>{rank}</RNText>
            </View>
          </Marker>
        );
      })}
    </>
  );

  return (
    <Box w="100%">
      <Box position="relative" w="100%" borderRadius="2xl" overflow="hidden" style={{ height: previewH }}>
        <MapView
          ref={previewRef}
          style={StyleSheet.absoluteFill}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          {...mapProps}
        >
          {renderMarkers()}
        </MapView>
        <Pressable
          onPress={() => setFullscreen(true)}
          style={[styles.expandBtn, { top: 10, right: 10 }]}
          accessibilityLabel="全屏地图"
        >
          <RNText style={styles.expandBtnText}>全屏</RNText>
        </Pressable>
      </Box>

      <Modal visible={fullscreen} animationType="slide" onRequestClose={() => setFullscreen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPicked(null)} />
          <MapView
            ref={fullRef}
            style={StyleSheet.absoluteFill}
            scrollEnabled
            zoomEnabled
            rotateEnabled
            pitchEnabled
            {...mapProps}
          >
            {renderMarkers()}
          </MapView>
          <Pressable
            onPress={() => setFullscreen(false)}
            style={[
              styles.closeBtn,
              { top: insets.top + 10, right: 12 },
            ]}
            accessibilityLabel="关闭全屏地图"
          >
            <RNText style={styles.closeBtnText}>关闭</RNText>
          </Pressable>

          {picked ? (
            <View style={[styles.inlineInfoCard, { bottom: Math.max(insets.bottom + 14, 20) }]}>
              <RNText style={styles.inlineInfoTitle}>{picked.place.name}</RNText>
              <RNText style={styles.inlineInfoLine}>类别：{picked.place.category}</RNText>
              <RNText style={styles.inlineInfoLine}>评分：{picked.rating.toFixed(1)}</RNText>
              <RNText style={styles.inlineInfoStrong}>
                平均通勤时间：{Math.round(picked.meanMinutes)} 分钟
              </RNText>
            </View>
          ) : null}
        </View>
      </Modal>
    </Box>
  );
}

const styles = StyleSheet.create({
  bluePin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -1,
  },
  participantMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantLabelPill: {
    marginTop: 4,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,58,74,0.25)',
  },
  participantLabelText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: '#0F3A4A',
  },
  redPin: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#E36D68',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  expandBtn: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,58,74,0.2)',
  },
  expandBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F3A4A',
  },
  closeBtn: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inlineInfoCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inlineInfoTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  inlineInfoLine: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  inlineInfoStrong: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});

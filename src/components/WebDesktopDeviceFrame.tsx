import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

const DESKTOP_MIN_WIDTH = 1024;
const PHONE_WIDTH = 393;
const PHONE_HEIGHT = 852;
const STATUS_AREA_HEIGHT = 59;

export function WebDesktopDeviceFrame(props: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;

  if (!isDesktopWeb) {
    return <>{props.children}</>;
  }

  return (
    <View style={styles.desktopStage}>
      <View style={styles.phoneShell}>
        <View style={styles.statusArea}>
          <View style={styles.timeBadge} />
          <View style={styles.dynamicIsland} />
          <View style={styles.statusRight}>
            <View style={styles.signalBars}>
              <View style={[styles.signalBar, { height: 7 }]} />
              <View style={[styles.signalBar, { height: 9 }]} />
              <View style={[styles.signalBar, { height: 11 }]} />
              <View style={[styles.signalBar, { height: 13 }]} />
            </View>
            <View style={styles.batteryOutline}>
              <View style={styles.batteryFill} />
            </View>
          </View>
        </View>
        <View style={styles.phoneContent}>{props.children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#ECE9E3',
  },
  phoneShell: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: '#111111',
    overflow: 'hidden',
    backgroundColor: '#F9F8F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },
  statusArea: {
    height: STATUS_AREA_HEIGHT,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F8F6',
  },
  timeBadge: {
    position: 'absolute',
    left: 20,
    top: 21,
    width: 46,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(20,20,20,0.92)',
    opacity: 0.15,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 11,
    left: '50%',
    marginLeft: -63,
    width: 126,
    height: 37,
    borderRadius: 19,
    backgroundColor: '#111111',
    zIndex: 2,
  },
  statusRight: {
    position: 'absolute',
    right: 18,
    top: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#111111',
  },
  batteryOutline: {
    width: 22,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#111111',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  batteryFill: {
    width: 14,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#111111',
  },
  phoneContent: {
    height: PHONE_HEIGHT - STATUS_AREA_HEIGHT,
  },
});


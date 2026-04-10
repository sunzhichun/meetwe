import type { LatLng } from '../types';

/**
 * 地理计算：球面距离（Haversine），用于把经纬度差转换为“公里”。
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 计算两点球面距离（公里） */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

/** 计算多个点的经纬度质心（简单算术平均；MVP 足够） */
export function centroid(coords: LatLng[]): LatLng {
  if (coords.length === 0) {
    return { lat: 0, lng: 0 };
  }
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
}

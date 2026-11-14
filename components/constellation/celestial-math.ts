import * as THREE from "three";

export const CELESTIAL_SPHERE_RADIUS = 500;

/**
 * Converts astronomical Right Ascension (0-360 degrees) and Declination (-90 to +90 degrees)
 * into Cartesian 3D coordinates on the celestial sphere.
 *
 * Uses the standard interior celestial sphere convention where an observer at the origin
 * looks outward at the sky: Right Ascension increases eastward (leftward on screen when
 * looking toward the celestial equator facing south), matching the real night sky.
 */
export function raDecToVector3(
  raDeg: number,
  decDeg: number,
  radius: number = CELESTIAL_SPHERE_RADIUS
): THREE.Vector3 {
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  const x = -radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts Cartesian 3D coordinates back into Right Ascension (0-360 deg) and Declination (-90 to +90 deg).
 */
export function vector3ToRaDec(v: THREE.Vector3): { ra: number; dec: number } {
  const r = v.length();
  if (r === 0) return { ra: 0, dec: 0 };

  const decRad = Math.asin(Math.max(-1, Math.min(1, v.y / r)));
  let raRad = Math.atan2(v.z, -v.x);
  if (raRad < 0) {
    raRad += 2 * Math.PI;
  }

  return {
    ra: (raRad * 180) / Math.PI,
    dec: (decRad * 180) / Math.PI,
  };
}

/**
 * Formats Right Ascension in degrees into standard astronomical notation: XXh YYm
 */
export function formatRA(raDeg: number): string {
  const totalHours = ((raDeg % 360) + 360) % 360 / 15;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
}

/**
 * Formats Declination in degrees into standard astronomical notation: +XX° YY' or -XX° YY'
 */
export function formatDec(decDeg: number): string {
  const sign = decDeg >= 0 ? "+" : "-";
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  return `${sign}${d.toString().padStart(2, "0")}° ${m.toString().padStart(2, "0")}'`;
}

/**
 * Derives realistic star colors from astronomical spectral classification.
 */
export function getSpectralColor(spectralClass: string): THREE.Color {
  const prefix = spectralClass.charAt(0).toUpperCase();

  switch (prefix) {
    case "O":
      return new THREE.Color(0x9db4ff); // Deep blue
    case "B":
      return new THREE.Color(0xbbccff); // Blue-white
    case "A":
      return new THREE.Color(0xf8f9ff); // Pure white
    case "F":
      return new THREE.Color(0xfff6e5); // Yellow-white
    case "G":
      return new THREE.Color(0xffe499); // Sun-like yellow
    case "K":
      return new THREE.Color(0xffb566); // Warm orange
    case "M":
      return new THREE.Color(0xff684c); // Red supergiant
    default:
      return new THREE.Color(0xffffff);
  }
}

/**
 * Derives display point size from visual magnitude (brighter stars are larger).
 */
export function getMagnitudePointSize(magnitude: number): number {
  // Magnitude scale: smaller / negative is brighter
  const size = 6.0 - magnitude * 0.75;
  return Math.max(1.8, Math.min(size, 8.0));
}


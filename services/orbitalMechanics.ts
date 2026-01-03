/**
 * Orbital Mechanics Utility Functions
 * Implements Keplerian orbital mechanics for 2-body problem
 */

import { EARTH_RADIUS, EARTH_MU, EARTH_ROTATION_RATE } from '../constants';
import { SimulationState, Maneuver, OrbitalTarget } from '../types';

// Vector math utilities
export interface Vector2 {
  x: number;
  y: number;
}

export function vectorMagnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vectorAdd(v1: Vector2, v2: Vector2): Vector2 {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

export function vectorSubtract(v1: Vector2, v2: Vector2): Vector2 {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

export function vectorScale(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function vectorDot(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.x + v1.y * v2.y;
}

export function vectorNormalize(v: Vector2): Vector2 {
  const mag = vectorMagnitude(v);
  return mag > 0 ? { x: v.x / mag, y: v.y / mag } : { x: 0, y: 0 };
}

// Cross product for 2D (returns scalar z-component)
export function vectorCross2D(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.y - v1.y * v2.x;
}

/**
 * Calculate altitude-dependent gravity acceleration
 * Uses inverse-square law: g = μ / r²
 */
export function calculateGravity(altitude: number): number {
  const r = EARTH_RADIUS + altitude;
  return EARTH_MU / (r * r);
}

/**
 * Calculate orbital velocity for circular orbit at given altitude
 * v_circular = sqrt(μ / r)
 */
export function calculateCircularOrbitalVelocity(altitude: number): number {
  const r = EARTH_RADIUS + altitude;
  return Math.sqrt(EARTH_MU / r);
}

/**
 * Calculate escape velocity at given altitude
 * v_escape = sqrt(2μ / r)
 */
export function calculateEscapeVelocity(altitude: number): number {
  const r = EARTH_RADIUS + altitude;
  return Math.sqrt(2 * EARTH_MU / r);
}

/**
 * Calculate orbital elements from position and velocity vectors
 * Returns: apogee, perigee, eccentricity, semi-major axis, period, inclination
 */
export function calculateOrbitalElements(
  position: Vector2,
  velocity: Vector2
): {
  apogee: number;
  perigee: number;
  eccentricity: number;
  semiMajorAxis: number;
  orbitalPeriod: number;
  inclination: number;
  specificEnergy: number;
  angularMomentum: number;
} {
  const r = vectorMagnitude(position);
  const v = vectorMagnitude(velocity);

  // Specific orbital energy: ε = v²/2 - μ/r
  const specificEnergy = (v * v) / 2 - EARTH_MU / r;

  // Specific angular momentum (scalar for 2D): h = r × v
  const angularMomentum = vectorCross2D(position, velocity);

  // Semi-major axis: a = -μ / (2ε)
  const semiMajorAxis = -EARTH_MU / (2 * specificEnergy);

  // Eccentricity from energy and angular momentum
  // e = sqrt(1 + (2εh²/μ²))
  const eccentricity = Math.sqrt(
    1 + (2 * specificEnergy * angularMomentum * angularMomentum) / (EARTH_MU * EARTH_MU)
  );

  // Apogee and perigee distances from Earth center
  const apogeeDist = semiMajorAxis * (1 + eccentricity);
  const perigeeDist = semiMajorAxis * (1 - eccentricity);

  // Convert to altitude (distance from surface)
  const apogee = Math.max(0, apogeeDist - EARTH_RADIUS);
  const perigee = Math.max(0, perigeeDist - EARTH_RADIUS);

  // Orbital period: T = 2π * sqrt(a³/μ)
  const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(Math.abs(semiMajorAxis), 3) / EARTH_MU);

  // Inclination (angle between orbital plane and equator)
  // For 2D simulation, this is simplified - in 3D it would be more complex
  const inclination = Math.abs(Math.atan2(velocity.x, velocity.y) * (180 / Math.PI));

  return {
    apogee,
    perigee,
    eccentricity,
    semiMajorAxis,
    orbitalPeriod,
    inclination,
    specificEnergy,
    angularMomentum,
  };
}

/**
 * Check if current trajectory results in stable orbit
 * (perigee > Earth radius, velocity < escape velocity)
 */
export function isStableOrbit(position: Vector2, velocity: Vector2): boolean {
  const r = vectorMagnitude(position);
  const v = vectorMagnitude(velocity);
  const altitude = r - EARTH_RADIUS;

  // Check if velocity is sufficient for orbit
  const circularVelocity = calculateCircularOrbitalVelocity(altitude);
  const escapeVelocity = calculateEscapeVelocity(altitude);

  if (v < circularVelocity * 0.9 || v >= escapeVelocity) {
    return false;
  }

  // Calculate orbital elements to check perigee
  const elements = calculateOrbitalElements(position, velocity);

  // Stable if perigee is above atmosphere (100km safety margin)
  return elements.perigee > 100000 && elements.eccentricity < 1;
}

/**
 * Calculate time to apogee or perigee from current position
 * Uses Kepler's equation and true anomaly
 */
export function calculateTimeToApsides(
  position: Vector2,
  velocity: Vector2
): { timeToApogee: number; timeToPerigee: number } {
  const elements = calculateOrbitalElements(position, velocity);

  if (elements.eccentricity >= 1) {
    // Hyperbolic or parabolic trajectory - no apogee
    return { timeToApogee: Infinity, timeToPerigee: Infinity };
  }

  // Calculate true anomaly (angle from periapsis)
  const r = vectorMagnitude(position);
  const cosNu = vectorDot(position, velocity) / (r * vectorMagnitude(velocity));
  const trueAnomaly = Math.acos(cosNu);

  // Mean motion: n = 2π / T
  const meanMotion = (2 * Math.PI) / elements.orbitalPeriod;

  // Time to apogee (180° from periapsis)
  const angleToApogee = Math.PI - trueAnomaly;
  const timeToApogee = angleToApogee / meanMotion;

  // Time to perigee (0° or 360°)
  const angleToPerigee = (2 * Math.PI - trueAnomaly) % (2 * Math.PI);
  const timeToPerigee = angleToPerigee / meanMotion;

  return { timeToApogee, timeToPerigee };
}

/**
 * Calculate delta-V required for circularization burn at apogee
 */
export function calculateCircularizationDeltaV(
  currentApogee: number,
  currentPerigee: number
): number {
  // Current orbit parameters
  const ra = EARTH_RADIUS + currentApogee;
  const rp = EARTH_RADIUS + currentPerigee;
  const a = (ra + rp) / 2; // semi-major axis

  // Velocity at apogee in current elliptical orbit
  // v = sqrt(μ * (2/r - 1/a))
  const vElliptical = Math.sqrt(EARTH_MU * (2 / ra - 1 / a));

  // Velocity for circular orbit at apogee altitude
  const vCircular = Math.sqrt(EARTH_MU / ra);

  // Delta-V is the difference
  return Math.abs(vCircular - vElliptical);
}

/**
 * Calculate Hohmann transfer delta-V to target altitude
 */
export function calculateHohmannTransfer(
  currentAltitude: number,
  targetAltitude: number
): { deltaV1: number; deltaV2: number; totalDeltaV: number; transferTime: number } {
  const r1 = EARTH_RADIUS + currentAltitude;
  const r2 = EARTH_RADIUS + targetAltitude;

  // Transfer orbit semi-major axis
  const aTransfer = (r1 + r2) / 2;

  // Initial circular velocity
  const v1 = Math.sqrt(EARTH_MU / r1);

  // Transfer orbit velocity at periapsis
  const vTransferPeri = Math.sqrt(EARTH_MU * (2 / r1 - 1 / aTransfer));

  // First burn (at lower altitude)
  const deltaV1 = Math.abs(vTransferPeri - v1);

  // Transfer orbit velocity at apoapsis
  const vTransferApo = Math.sqrt(EARTH_MU * (2 / r2 - 1 / aTransfer));

  // Target circular velocity
  const v2 = Math.sqrt(EARTH_MU / r2);

  // Second burn (at higher altitude)
  const deltaV2 = Math.abs(v2 - vTransferApo);

  // Total delta-V
  const totalDeltaV = deltaV1 + deltaV2;

  // Transfer time (half period of transfer orbit)
  const transferTime = Math.PI * Math.sqrt(Math.pow(aTransfer, 3) / EARTH_MU);

  return { deltaV1, deltaV2, totalDeltaV, transferTime };
}

/**
 * Execute a maneuver by applying delta-V in specified direction
 */
export function executeManeuver(
  position: Vector2,
  velocity: Vector2,
  maneuver: Maneuver
): Vector2 {
  const r = vectorMagnitude(position);
  const v = vectorMagnitude(velocity);

  // Direction unit vectors
  const radialOut = vectorNormalize(position); // Away from Earth
  const progradeDir = vectorNormalize(velocity); // Direction of motion
  
  // Normal direction (perpendicular to orbital plane, right-hand rule)
  // For 2D: rotate prograde by 90° counterclockwise
  const normalDir = { x: -progradeDir.y, y: progradeDir.x };

  let deltaVVector: Vector2 = { x: 0, y: 0 };

  switch (maneuver.type) {
    case 'prograde':
      deltaVVector = vectorScale(progradeDir, maneuver.deltaV);
      break;
    case 'retrograde':
      deltaVVector = vectorScale(progradeDir, -maneuver.deltaV);
      break;
    case 'normal':
      deltaVVector = vectorScale(normalDir, maneuver.deltaV);
      break;
    case 'anti-normal':
      deltaVVector = vectorScale(normalDir, -maneuver.deltaV);
      break;
    case 'radial-in':
      deltaVVector = vectorScale(radialOut, -maneuver.deltaV);
      break;
    case 'radial-out':
      deltaVVector = vectorScale(radialOut, maneuver.deltaV);
      break;
    case 'circularize':
      // Special case: calculate direction and magnitude to circularize
      const elements = calculateOrbitalElements(position, velocity);
      const circDeltaV = calculateCircularizationDeltaV(elements.apogee, elements.perigee);
      deltaVVector = vectorScale(progradeDir, circDeltaV);
      break;
  }

  // Apply delta-V to velocity
  return vectorAdd(velocity, deltaVVector);
}

/**
 * Calculate relative position and velocity to target (for docking)
 */
export function calculateRelativeState(
  ownPosition: Vector2,
  ownVelocity: Vector2,
  targetPosition: Vector2,
  targetVelocity: Vector2
): {
  relativePosition: Vector2;
  relativeVelocity: Vector2;
  distance: number;
  closingSpeed: number;
} {
  const relativePosition = vectorSubtract(targetPosition, ownPosition);
  const relativeVelocity = vectorSubtract(targetVelocity, ownVelocity);

  const distance = vectorMagnitude(relativePosition);
  const closingSpeed = -vectorDot(
    vectorNormalize(relativePosition),
    relativeVelocity
  );

  return { relativePosition, relativeVelocity, distance, closingSpeed };
}

/**
 * Predict future orbital position after time dt
 * Uses simple Keplerian propagation
 */
export function propagateOrbit(
  position: Vector2,
  velocity: Vector2,
  dt: number
): { position: Vector2; velocity: Vector2 } {
  // For now, use simple Euler integration
  // TODO: Implement more accurate orbital propagator (SGP4 or two-body problem solution)
  
  const r = vectorMagnitude(position);
  const gravAccel = EARTH_MU / (r * r);
  const gravDir = vectorNormalize(vectorScale(position, -1));
  
  const acceleration = vectorScale(gravDir, gravAccel);
  
  const newVelocity = vectorAdd(velocity, vectorScale(acceleration, dt));
  const newPosition = vectorAdd(position, vectorScale(velocity, dt));
  
  return { position: newPosition, velocity: newVelocity };
}

/**
 * Calculate launch azimuth for desired orbital inclination
 * Takes into account Earth's rotation for launch site latitude
 */
export function calculateLaunchAzimuth(
  targetInclination: number,
  launchLatitude: number = 28.5 // Default: Cape Canaveral
): number {
  const targetIncRad = (targetInclination * Math.PI) / 180;
  const latRad = (launchLatitude * Math.PI) / 180;

  // Azimuth from north (simplified)
  const sinAz = Math.cos(targetIncRad) / Math.cos(latRad);

  // Clamp to valid range
  if (Math.abs(sinAz) > 1) {
    // Cannot achieve this inclination from this latitude
    return targetInclination > launchLatitude ? 0 : 180;
  }

  const azimuth = Math.asin(sinAz) * (180 / Math.PI);
  return azimuth;
}

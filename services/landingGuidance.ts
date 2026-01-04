/**
 * Landing Guidance System
 * Implements Falcon 9-style propulsive landing with suicide burn calculations
 */

import { SimulationState, RocketConfig } from '../types';
import { GRAVITY, EARTH_RADIUS } from '../constants';

export interface LandingGuidance {
  shouldStartBoostback: boolean;
  shouldStartReentry: boolean;
  shouldStartLanding: boolean;
  shouldDeployLegs: boolean;
  shouldDeployGridFins: boolean;
  targetThrottle: number; // 0-1
  targetAngle: number; // degrees from vertical
  timeToImpact: number; // seconds
  landingAccuracy: number; // meters from target
}

/**
 * Calculate suicide burn start altitude
 * Formula: h = v² / (2 * (a_thrust - g))
 * Accounts for mass change during burn
 */
export function calculateSuicideBurnAltitude(
  velocity: number,
  mass: number,
  thrust: number,
  burnRate: number = 0
): number {
  // Iterative approximation for mass change
  let estimatedBurnTime = velocity / ((thrust / mass) - GRAVITY);
  let avgMass = mass;

  if (burnRate > 0) {
    for (let i = 0; i < 3; i++) {
      const fuelConsumed = estimatedBurnTime * burnRate;
      const finalMass = Math.max(1, mass - fuelConsumed);
      avgMass = (mass + finalMass) / 2;
      const avgAccel = (thrust / avgMass) - GRAVITY;
      if (avgAccel <= 0) break;
      estimatedBurnTime = velocity / avgAccel;
    }
  }

  const thrustAccel = thrust / avgMass;
  const netAccel = thrustAccel - GRAVITY;
  
  if (netAccel <= 0) return 0; // Can't decelerate
  
  // Height needed to stop with suicide burn
  const burnAlt = (velocity * velocity) / (2 * netAccel);
  
  // Add safety margin (100m)
  return burnAlt + 100;
}

/**
 * Calculate time to impact (simplified ballistic trajectory)
 * Includes drag approximation
 */
export function calculateTimeToImpact(
  altitude: number,
  velocity: number
): number {
  if (velocity >= 0) return Infinity; // Going up
  
  // Solve: h = v*t + 0.5*g*t²
  // Quadratic formula
  // Using reduced gravity to approximate atmospheric drag
  const effectiveGravity = GRAVITY * 0.9;
  const a = 0.5 * effectiveGravity;
  const b = -velocity;
  const c = altitude;
  
  const discriminant = b * b + 4 * a * c;
  if (discriminant < 0) return 0;
  
  const t = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Math.max(0, t);
}

/**
 * Calculate optimal boostback burn parameters
 * Goal: Return stage 1 to launch site
 */
export function calculateBoostbackGuidance(
  state: SimulationState,
  config: RocketConfig
): { shouldStart: boolean; duration: number; angle: number } {
  // Boostback starts shortly after stage separation (around 70km altitude)
  const shouldStart = 
    state.activeStage === 1 && 
    state.altitude > 60000 &&
    state.altitude < 80000 &&
    state.phase === 'COASTING' &&
    !state.boostbackBurnComplete;
  
  // Burn duration: ~15 seconds
  // Burn angle: ~180 degrees (retrograde back to launch site)
  return {
    shouldStart,
    duration: 15,
    angle: 180 // Full reversal
  };
}

/**
 * Calculate re-entry burn guidance
 * Goal: Slow down before entering dense atmosphere
 */
export function calculateReentryGuidance(
  state: SimulationState,
  config: RocketConfig
): { shouldStart: boolean; duration: number } {
  // Re-entry burn starts around 70km on the way down
  const shouldStart = 
    state.activeStage === 1 &&
    state.altitude < 75000 &&
    state.altitude > 60000 &&
    state.velocity < -500 && // Falling fast
    state.boostbackBurnComplete &&
    !state.reentryBurnComplete;
  
  return {
    shouldStart,
    duration: 10 // ~10 second burn
  };
}

/**
 * Main landing guidance computer
 */
export function computeLandingGuidance(
  state: SimulationState,
  config: RocketConfig,
  landingTargetX: number = 0
): LandingGuidance {
  const stage1Config = config.stage1;
  const stage1Mass = stage1Config.dryMass + state.stage1Fuel;
  
  // Calculate suicide burn altitude
  const suicideBurnAlt = calculateSuicideBurnAltitude(
    Math.abs(state.velocity),
    stage1Mass,
    stage1Config.thrust,
    stage1Config.burnRate
  );
  
  // Time to impact
  const timeToImpact = calculateTimeToImpact(state.altitude, state.velocity);
  
  // Boostback guidance
  const boostback = calculateBoostbackGuidance(state, config);
  
  // Re-entry guidance
  const reentry = calculateReentryGuidance(state, config);
  
  // Landing burn should start at suicide burn altitude
  const shouldStartLanding = 
    state.activeStage === 1 &&
    state.altitude <= suicideBurnAlt &&
    state.altitude > 100 &&
    state.velocity < 0 &&
    state.reentryBurnComplete;
  
  // Deploy legs at 1km
  const shouldDeployLegs = state.altitude < 1000 && state.altitude > 0 && !state.landingLegsDeployed;
  
  // Deploy grid fins when falling (for steering during re-entry)
  const shouldDeployGridFins = 
    state.altitude < 70000 && 
    state.velocity < 0 && 
    !state.gridFinsDeployed &&
    state.boostbackBurnComplete;
  
  // Calculate landing accuracy (distance from target)
  const landingAccuracy = Math.abs(state.downrangeDistance - landingTargetX);
  
  // Target throttle based on phase
  let targetThrottle = 0;
  if (state.phase === 'BOOSTBACK') {
    targetThrottle = 1.0; // Full thrust
  } else if (state.phase === 'RE-ENTRY') {
    targetThrottle = 0.7; // 70% thrust
  } else if (state.phase === 'LANDING') {
    // PID Control for Landing
    // Target velocity decreases as we get closer to ground
    const targetV = -Math.max(2, state.altitude / 10); // e.g. at 100m, target -10m/s
    const error = targetV - state.velocity; // if v=-20, target=-10, error=10 (need thrust)
    
    const Kp = 0.1;
    const Kd = 0.05;
    
    // Estimate hover throttle
    const hoverThrottle = (stage1Mass * GRAVITY) / stage1Config.thrust;
    
    // Derivative term (using acceleration)
    // We want to oppose changes that move us away from target?
    // Actually, just P-control with feedforward (hover) is often good.
    // D-term: -Kd * acceleration (damping)
    
    const output = hoverThrottle + Kp * error - Kd * state.acceleration;
    
    targetThrottle = Math.min(1.0, Math.max(0.1, output));
  }
  
  // Target angle (for lateral correction toward landing pad)
  const lateralError = state.downrangeDistance - landingTargetX;
  let targetAngle = 0;
  if (Math.abs(lateralError) > 50 && state.phase === 'LANDING') {
    // Tilt slightly toward target
    targetAngle = Math.sign(-lateralError) * Math.min(10, Math.abs(lateralError) / 100);
  }
  
  return {
    shouldStartBoostback: boostback.shouldStart,
    shouldStartReentry: reentry.shouldStart,
    shouldStartLanding,
    shouldDeployLegs,
    shouldDeployGridFins,
    targetThrottle,
    targetAngle,
    timeToImpact,
    landingAccuracy,
  };
}

/**
 * Calculate landing recovery percentage based on touchdown conditions
 */
export function calculateRecoveryPercentage(
  landingVelocity: number,
  landingAccuracy: number,
  tiltAngle: number
): number {
  let recovery = 100;
  
  // Velocity penalty
  const velMagnitude = Math.abs(landingVelocity);
  if (velMagnitude < 2) {
    recovery = 100; // Perfect
  } else if (velMagnitude < 5) {
    recovery = 90; // Good
  } else if (velMagnitude < 10) {
    recovery = 70; // Hard but survivable
  } else if (velMagnitude < 20) {
    recovery = 30; // Damaged
  } else {
    recovery = 0; // Destroyed
  }
  
  // Accuracy penalty
  if (landingAccuracy > 100) {
    recovery *= 0.7; // Off pad
  } else if (landingAccuracy > 50) {
    recovery *= 0.85; // Edge of pad
  }
  
  // Tilt penalty
  if (Math.abs(tiltAngle) > 10) {
    recovery *= 0.5; // Tipped over
  } else if (Math.abs(tiltAngle) > 5) {
    recovery *= 0.8; // Leaning
  }
  
  return Math.max(0, Math.min(100, recovery));
}

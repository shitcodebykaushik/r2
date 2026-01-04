import { RocketConfig, SimulationState, TrajectoryPoint } from '../types';
import { GRAVITY, AIR_DENSITY_SEA_LEVEL, SCALE_HEIGHT, ROCKET_CROSS_SECTION_AREA, DT, ATMOSPHERE_LAYERS, SPEED_OF_SOUND_SEA_LEVEL, MAX_STRUCTURAL_LOAD, EARTH_MU, EARTH_RADIUS } from '../constants';

const SEPARATION_IMPULSE = 15; // m/s kick from pneumatic pushers
// EARTH_RADIUS imported from constants

// Helper function to get atmospheric properties at altitude
function getAtmosphericProperties(altitude: number): { density: number; temperature: number; pressure: number; layer: string } {
  // Find current layer
  let layer = ATMOSPHERE_LAYERS[0];
  let prevAlt = 0;
  
  for (const l of ATMOSPHERE_LAYERS) {
    if (altitude <= l.maxAlt) {
      layer = l;
      break;
    }
    prevAlt = l.maxAlt;
  }
  
  const altInLayer = altitude - prevAlt;
  const temp = layer.baseTemp + layer.tempGradient * altInLayer;
  
  // Barometric formula for pressure
  let pressure: number;
  if (layer.tempGradient !== 0) {
    pressure = layer.basePressure * Math.pow(temp / layer.baseTemp, -GRAVITY / (layer.tempGradient * 287.05));
  } else {
    pressure = layer.basePressure * Math.exp(-GRAVITY * altInLayer / (287.05 * layer.baseTemp));
  }
  
  // Ideal gas law: density = pressure / (R * T)
  // Using specific gas constant for dry air R = 287.058 J/(kg·K)
  const density = pressure / (287.058 * temp);
  
  return {
    density: Math.max(0, density),
    temperature: temp,
    pressure: Math.max(0, pressure),
    layer: layer.name
  };
}

// Calculate delta-V using Tsiolkovsky rocket equation
function calculateDeltaV(initialMass: number, finalMass: number, exhaustVelocity: number): number {
  if (finalMass <= 0 || initialMass <= 0) return 0;
  return exhaustVelocity * Math.log(initialMass / finalMass);
}

// Gravity turn simulation - automatic pitch program
function getGravityTurnAngle(altitude: number, velocity: number): number {
  if (altitude < 1000) return 0; // Vertical ascent
  if (altitude < 10000) {
    // Gradual turn between 1-10km
    return ((altitude - 1000) / 9000) * 45; // 0 to 45 degrees
  }
  if (altitude < 40000) {
    // Continue turning to 70 degrees by 40km
    return 45 + ((altitude - 10000) / 30000) * 25;
  }
  return Math.min(70, 45 + ((altitude - 10000) / 30000) * 25);
}

export const calculateNextState = (
  currentState: SimulationState,
  config: RocketConfig
): SimulationState => {
  const { altitude, velocity, time, activeStage, stage1Fuel, stage2Fuel, maxAltitude, maxVelocity, temperature, maxTemperature, deltaVExpended, maxGForce, maxDynamicPressure, downrangeDistance, thrustAngle: currentAngle } = currentState;
  
  // Initialize horizontal velocity if missing (legacy state support)
  const velocityX = currentState.velocityX || 0;
  // In this codebase, 'velocity' often refers to vertical velocity (Vy) or total velocity depending on context.
  // Based on the integration `newAltitude = altitude + newVelocity * DT`, `velocity` here acts as Vy.
  const velocityY = velocity; 
  const vTotal = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

  // 1. Determine Mass (including payload)
  let currentMass = 0;
  let dryMassOnly = 0;
  
  if (activeStage === 1) {
    currentMass = config.stage1.dryMass + stage1Fuel + config.stage2.dryMass + stage2Fuel + config.payloadMass;
    dryMassOnly = config.stage1.dryMass + config.stage2.dryMass + config.payloadMass;
  } else {
    currentMass = config.stage2.dryMass + stage2Fuel + config.payloadMass;
    dryMassOnly = config.stage2.dryMass + config.payloadMass;
  }

  // 2. Atmospheric Properties (Multi-layer model)
  const atm = getAtmosphericProperties(altitude);
  const airDensity = atm.density;
  
  // 3. Gravity Turn - Calculate thrust angle
  const targetAngle = getGravityTurnAngle(altitude, velocity);
  // Smooth angle transition
  const thrustAngle = currentState.phase === 'BURNING' 
    ? currentAngle + Math.sign(targetAngle - currentAngle) * Math.min(0.5, Math.abs(targetAngle - currentAngle))
    : currentAngle;
  
  const angleRad = (thrustAngle * Math.PI) / 180;

  // 4. Forces
  // Gravity (Altitude dependent)
  const r = EARTH_RADIUS + altitude;
  const localGravity = EARTH_MU / (r * r);
  const forceGravity = currentMass * localGravity;

  // Drag (velocity squared law)
  const dragMagnitude = 0.5 * airDensity * (vTotal * vTotal) * config.dragCoefficient * ROCKET_CROSS_SECTION_AREA;
  
  // Drag components (opposing motion)
  let dragX = 0;
  let dragY = 0;
  if (vTotal > 0) {
    dragX = -dragMagnitude * (velocityX / vTotal);
    dragY = -dragMagnitude * (velocityY / vTotal);
  }

  // Dynamic Pressure (Max Q indicator)
  const dynamicPressure = 0.5 * airDensity * (vTotal * vTotal);

  // 5. Thrust & Burn Logic
  let forceThrust = 0;
  let s1Consumption = 0;
  let s2Consumption = 0;
  let newPhase = currentState.phase;
  let newActiveStage = activeStage;
  let newSeparationTime = currentState.separationTime;
  let velocityAdjustment = 0;
  let deltaVThisStep = 0;

  if (currentState.phase === 'BURNING') {
    if (activeStage === 1) {
      if (stage1Fuel > 0) {
        forceThrust = config.stage1.thrust;
        s1Consumption = config.stage1.burnRate * DT;
        
        // Delta-V calculation (thrust * dt / mass)
        deltaVThisStep = (forceThrust * DT) / currentMass;
      } else {
        // Stage 1 Depleted -> Initiate Staging
        newPhase = 'STAGING';
        newSeparationTime = time;
        velocityAdjustment = SEPARATION_IMPULSE;
      }
    } else if (activeStage === 2) {
      if (stage2Fuel > 0) {
        forceThrust = config.stage2.thrust;
        s2Consumption = config.stage2.burnRate * DT;
        deltaVThisStep = (forceThrust * DT) / currentMass;
      } else {
        newPhase = 'COASTING';
      }
    }
  } else if (currentState.phase === 'STAGING') {
    if (currentState.separationTime && time - currentState.separationTime > 2.0) {
      newPhase = 'BURNING';
      newActiveStage = 2;
    }
  }

  // Net Force (decomposed into vertical and horizontal)
  const thrustVertical = forceThrust * Math.cos(angleRad);
  const thrustHorizontal = forceThrust * Math.sin(angleRad);
  
  const forceNetVertical = thrustVertical + dragY - forceGravity;
  const forceNetHorizontal = thrustHorizontal + dragX;

  // 6. Integration
  const accelerationVertical = forceNetVertical / currentMass;
  const accelerationHorizontal = forceNetHorizontal / currentMass;
  const acceleration = Math.sqrt(accelerationVertical * accelerationVertical + accelerationHorizontal * accelerationHorizontal);
  
  // G-Force calculation
  const gForce = acceleration / GRAVITY; // Keep using standard gravity for G-force reference
  
  const newVelocityY = velocityY + accelerationVertical * DT + velocityAdjustment;
  const newVelocityX = velocityX + accelerationHorizontal * DT;
  
  const newAltitude = altitude + newVelocityY * DT;
  
  // Downrange distance (horizontal travel)
  const newDownrange = downrangeDistance + newVelocityX * DT;
  
  // Total velocity magnitude
  const newVelocity = newVelocityY; // Keep 'velocity' as vertical for compatibility
  
  // 7. Thermodynamics with realistic atmosphere
  const T_ambient = atm.temperature;
  
  // Mach Number
  const localSpeedOfSound = Math.sqrt(1.4 * 287.05 * T_ambient);
  const mach = vTotal / localSpeedOfSound;

  // Recovery Temperature
  const T_recovery = T_ambient * (1 + 0.17 * mach * mach);
  const engineHeat = currentState.phase === 'BURNING' ? 50 : 0;
  
  const k_thermal = 0.05 * (airDensity / AIR_DENSITY_SEA_LEVEL) + 0.001;
  const targetTemp = T_recovery + engineHeat;
  const tempDiff = targetTemp - temperature;
  const newTemperature = temperature + (tempDiff * k_thermal * DT);

  // 8. Update Fuel
  const newS1Fuel = Math.max(0, stage1Fuel - s1Consumption);
  const newS2Fuel = Math.max(0, stage2Fuel - s2Consumption);

  // 9. Delta-V Budget
  const newDeltaVExpended = deltaVExpended + deltaVThisStep;
  
  // Calculate theoretical remaining delta-V
  const currentStageFuel = activeStage === 1 ? newS1Fuel : newS2Fuel;
  const currentStageConfig = activeStage === 1 ? config.stage1 : config.stage2;
  const exhaustVelocity = (currentStageConfig.thrust / currentStageConfig.burnRate) / GRAVITY; // Isp * g0
  
  let remainingDeltaV = 0;
  if (currentStageFuel > 0) {
    const finalMass = currentMass - currentStageFuel;
    remainingDeltaV = calculateDeltaV(currentMass, finalMass, exhaustVelocity);
  }
  
  // Add stage 2 potential if still on stage 1
  if (activeStage === 1 && newS2Fuel > 0) {
    const stage2Mass = config.stage2.dryMass + newS2Fuel + config.payloadMass;
    const stage2ExhaustVel = (config.stage2.thrust / config.stage2.burnRate) / GRAVITY;
    remainingDeltaV += calculateDeltaV(stage2Mass, config.stage2.dryMass + config.payloadMass, stage2ExhaustVel);
  }

  // 10. Structural Load (as percentage of max safe load)
  const structuralLoad = (gForce / MAX_STRUCTURAL_LOAD) * 100;

  // 11. Global Phase Checks
  if (newAltitude <= 0 && time > 1) {
    newPhase = Math.abs(newVelocity) > 10 ? 'CRASHED' : 'LANDED';
  } else if (newVelocity < 0 && newPhase !== 'DESCENT' && newPhase !== 'CRASHED' && newPhase !== 'LANDED') {
    newPhase = 'DESCENT';
  }

  const finalAltitude = Math.max(0, newAltitude);
  const finalVelocityY = finalAltitude === 0 ? 0 : newVelocityY;
  const finalVelocityX = finalAltitude === 0 ? 0 : newVelocityX;
  const finalVelocity = finalAltitude === 0 ? 0 : finalVelocityY; // Keeping as vertical velocity
  const finalAcceleration = finalAltitude === 0 ? 0 : acceleration;

  return {
    time: time + DT,
    altitude: finalAltitude,
    velocity: finalVelocity,
    acceleration: finalAcceleration,
    
    // 2D Position & Velocity
    positionX: newDownrange,
    positionY: finalAltitude + EARTH_RADIUS,
    velocityX: finalVelocityX,
    velocityY: finalVelocityY,
    
    stage1Fuel: newS1Fuel,
    stage2Fuel: newS2Fuel,
    activeStage: newActiveStage,
    separationTime: newSeparationTime,
    phase: newPhase,
    maxAltitude: Math.max(maxAltitude, finalAltitude),
    maxVelocity: Math.max(maxVelocity, finalVelocity),
    
    // Orbital Elements (placeholder)
    apogee: currentState.apogee || 0,
    perigee: currentState.perigee || 0,
    eccentricity: currentState.eccentricity || 0,
    semiMajorAxis: currentState.semiMajorAxis || 6371000,
    orbitalPeriod: currentState.orbitalPeriod || 0,
    inclination: currentState.inclination || 0,
    orbitalVelocity: currentState.orbitalVelocity || 0,
    isOrbiting: currentState.isOrbiting || false,
    timeToApogee: currentState.timeToApogee || 0,
    timeToPerigee: currentState.timeToPerigee || 0,
    orbitsCompleted: currentState.orbitsCompleted || 0,
    
    temperature: newTemperature,
    maxTemperature: Math.max(maxTemperature, newTemperature),
    gForce: gForce,
    maxGForce: Math.max(maxGForce, gForce),
    dynamicPressure: dynamicPressure,
    maxDynamicPressure: Math.max(maxDynamicPressure, dynamicPressure),
    atmosphericDensity: airDensity,
    atmosphereLayer: atm.layer,
    deltaVExpended: newDeltaVExpended,
    deltaVRemaining: remainingDeltaV,
    thrustAngle: thrustAngle,
    downrangeDistance: newDownrange,
    structuralLoad: structuralLoad,
    
    // Engine Reliability
    stage1FailedEngines: currentState.stage1FailedEngines || [],
    stage2FailedEngines: currentState.stage2FailedEngines || [],
    thrustPercentage: currentState.thrustPercentage || 100,
    
    // Wind
    windVelocityX: currentState.windVelocityX || 0,
    windVelocityY: currentState.windVelocityY || 0,
    crosswindSpeed: currentState.crosswindSpeed || 0,
    windForceX: currentState.windForceX || 0,
    
    // Fuel Slosh
    fuelSloshOffset: currentState.fuelSloshOffset || 0,
    centerOfMassX: currentState.centerOfMassX || 0,
    centerOfMassY: currentState.centerOfMassY || 0,
    sloshTorque: currentState.sloshTorque || 0,
    
    // RCS
    rcsFuel: currentState.rcsFuel || 0,
    rcsEnabled: currentState.rcsEnabled || false,
    rollAngle: currentState.rollAngle || 0,
    pitchRate: currentState.pitchRate || 0,
    yawRate: currentState.yawRate || 0,
    rollRate: currentState.rollRate || 0,
    manualControl: currentState.manualControl || false,
    
    // Maneuvers
    plannedManeuvers: currentState.plannedManeuvers || [],
    currentManeuver: currentState.currentManeuver || null,
    
    // Payload
    payloadDeployed: currentState.payloadDeployed || false,
    deploymentTime: currentState.deploymentTime || null,
    
    // Docking
    targetRelativePosition: currentState.targetRelativePosition || null,
    targetRelativeVelocity: currentState.targetRelativeVelocity || null,
    dockingAlignment: currentState.dockingAlignment || 0,
    isDocked: currentState.isDocked || false,
    
    // Landing System
    landingLegsDeployed: currentState.landingLegsDeployed || false,
    gridFinsDeployed: currentState.gridFinsDeployed || false,
    landingBurnStartAltitude: currentState.landingBurnStartAltitude || null,
    landingTargetX: currentState.landingTargetX || 0,
    landingAccuracy: currentState.landingAccuracy || 0,
    recoveryPercentage: currentState.recoveryPercentage || 0,
    boostbackBurnComplete: currentState.boostbackBurnComplete || false,
    reentryBurnComplete: currentState.reentryBurnComplete || false,
  };
};

// Predict future path with multi-stage logic
export const predictFlightPath = (
  startState: SimulationState,
  config: RocketConfig,
  horizonSeconds: number = 60
): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];
  let tempState = { ...startState };
  const predDT = 0.5; 
  const maxSteps = horizonSeconds / predDT;
  
  points.push({ time: tempState.time, altitude: null, predictedAltitude: tempState.altitude });

  for (let i = 0; i < maxSteps; i++) {
    let currentMass = 0;
    if (tempState.activeStage === 1) {
      currentMass = config.stage1.dryMass + tempState.stage1Fuel + config.stage2.dryMass + tempState.stage2Fuel + config.payloadMass;
    } else {
      currentMass = config.stage2.dryMass + tempState.stage2Fuel + config.payloadMass;
    }

    const atm = getAtmosphericProperties(tempState.altitude);
    const density = atm.density;
    const gravity = currentMass * GRAVITY;
    const drag = -0.5 * density * (tempState.velocity ** 2) * config.dragCoefficient * ROCKET_CROSS_SECTION_AREA * Math.sign(tempState.velocity);
    
    let thrust = 0;
    
    if (tempState.phase === 'BURNING') {
       if (tempState.activeStage === 1) {
          if (tempState.stage1Fuel > 0) {
             thrust = config.stage1.thrust;
             tempState.stage1Fuel -= config.stage1.burnRate * predDT;
          } else {
             tempState.activeStage = 2; 
             tempState.velocity += SEPARATION_IMPULSE;
          }
       } else {
          if (tempState.stage2Fuel > 0) {
             thrust = config.stage2.thrust;
             tempState.stage2Fuel -= config.stage2.burnRate * predDT;
          } else {
             tempState.phase = 'COASTING';
          }
       }
    }

    const acc = (thrust + drag - gravity) / currentMass;
    tempState.velocity += acc * predDT;
    tempState.altitude += tempState.velocity * predDT;
    tempState.time += predDT;

    if (tempState.altitude <= 0) {
      points.push({ time: tempState.time, altitude: null, predictedAltitude: 0 });
      break;
    }

    points.push({ time: tempState.time, altitude: null, predictedAltitude: tempState.altitude });
  }

  return points;
};
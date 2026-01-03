export interface StageConfig {
  fuelMass: number; // kg
  dryMass: number; // kg
  thrust: number; // Newtons
  burnRate: number; // kg/s
  propellantType: 'RP-1/LOX' | 'LH2/LOX' | 'Methane/LOX';
  ispSeaLevel: number; // seconds (specific impulse at sea level)
  ispVacuum: number; // seconds (specific impulse in vacuum)
  engineCount: number; // Number of engines in this stage
  minEngines: number; // Minimum engines needed to continue
  reliability: number; // 0.0 to 1.0 (0.999 = 99.9% reliable)
}

export interface RocketConfig {
  name: string; // e.g. "Falcon 9", "Starship"
  stage1: StageConfig;
  stage2: StageConfig;
  dragCoefficient: number; // Dimensionless
  payloadMass: number; // kg
  stagingType: 'cold' | 'hot' | 'ullage'; // Type of stage separation
  rcsFuel: number; // kg (reaction control system fuel)
  rcsThrust: number; // Newtons per thruster
}

export interface MissionObjectives {
  targetAltitude: number; // meters
  targetVelocity: number; // m/s
  missionType: string;
  missionName: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  requiredDeltaV: number; // m/s
  rewards?: string[];
  targetOrbit?: {
    apogee: number; // m
    perigee: number; // m
    inclination: number; // degrees
  };
}

export interface Maneuver {
  id: string;
  type: 'prograde' | 'retrograde' | 'normal' | 'anti-normal' | 'radial-in' | 'radial-out' | 'circularize';
  deltaV: number; // m/s
  burnTime: number; // seconds
  timeToManeuver: number; // seconds (countdown)
  executionTime: number | null; // mission time when executed
  executed: boolean;
}

export interface OrbitalTarget {
  name: string; // e.g., "ISS", "Hubble"
  altitude: number; // m
  inclination: number; // degrees
  positionX: number; // m (current position)
  positionY: number; // m
  velocityX: number; // m/s
  velocityY: number; // m/s
}

export interface SimulationState {
  time: number; // s
  altitude: number; // m (vertical distance from Earth surface)
  velocity: number; // m/s (total velocity magnitude)
  acceleration: number; // m/s^2
  
  // 2D Position & Velocity Vectors
  positionX: number; // m (horizontal from launch site)
  positionY: number; // m (vertical from Earth center)
  velocityX: number; // m/s (horizontal component)
  velocityY: number; // m/s (vertical component)
  
  // Multi-stage fuel tracking
  stage1Fuel: number; 
  stage2Fuel: number;
  activeStage: 1 | 2;
  separationTime: number | null; // Timestamp when separation occurred

  phase: 'PRE_LAUNCH' | 'BURNING' | 'STAGING' | 'COASTING' | 'APOGEE' | 'DESCENT' | 'RE-ENTRY' | 'CRASHED' | 'LANDED' | 'ORBITING' | 'BOOSTBACK' | 'LANDING';
  maxAltitude: number;
  maxVelocity: number;
  
  // Orbital Elements
  apogee: number; // m (highest orbital point above Earth surface)
  perigee: number; // m (lowest orbital point above Earth surface)
  eccentricity: number; // 0 = circular, <1 = elliptical
  semiMajorAxis: number; // m
  orbitalPeriod: number; // seconds
  inclination: number; // degrees
  orbitalVelocity: number; // m/s (velocity needed for current orbit)
  isOrbiting: boolean; // true if stable orbit achieved
  timeToApogee: number; // seconds
  timeToPerigee: number; // seconds
  orbitsCompleted: number; // counter
  
  // Thermodynamics
  temperature: number; // Kelvin (Skin temp)
  maxTemperature: number; // Kelvin
  
  // Advanced Physics
  gForce: number; // G-forces experienced
  maxGForce: number; // Peak G-force
  dynamicPressure: number; // Pa (Pascals)
  maxDynamicPressure: number; // Max Q
  atmosphericDensity: number; // kg/m³
  atmosphereLayer: string; // Current atmospheric layer name
  deltaVExpended: number; // m/s
  deltaVRemaining: number; // m/s
  thrustAngle: number; // degrees from vertical
  downrangeDistance: number; // m (horizontal distance)
  structuralLoad: number; // Percentage of max load
  
  // Engine Reliability
  stage1FailedEngines: number[]; // Array of failed engine indices
  stage2FailedEngines: number[]; // Array of failed engine indices
  thrustPercentage: number; // 0-100 (accounting for failures)
  
  // Atmospheric Wind
  windVelocityX: number; // m/s (wind speed, eastward positive)
  windVelocityY: number; // m/s (wind speed, upward positive)
  crosswindSpeed: number; // m/s (relative wind speed)
  windForceX: number; // N (lateral force from wind)
  
  // Fuel Slosh
  fuelSloshOffset: number; // m (lateral offset of fuel CoM)
  centerOfMassX: number; // m (from rocket centerline)
  centerOfMassY: number; // m (from rocket base)
  sloshTorque: number; // N⋅m (torque from CoM offset)
  
  // RCS & Attitude Control
  rcsFuel: number; // kg remaining
  rcsEnabled: boolean; // RCS system active
  rollAngle: number; // degrees (rotation about longitudinal axis)
  pitchRate: number; // deg/s (angular velocity)
  yawRate: number; // deg/s
  rollRate: number; // deg/s
  manualControl: boolean; // Manual attitude control enabled
  
  // Maneuvers
  plannedManeuvers: Maneuver[];
  currentManeuver: Maneuver | null;
  
  // Payload
  payloadDeployed: boolean;
  deploymentTime: number | null;
  
  // Docking (if applicable)
  targetRelativePosition: { x: number; y: number } | null; // m
  targetRelativeVelocity: { x: number; y: number } | null; // m/s
  dockingAlignment: number; // degrees (0 = perfectly aligned)
  isDocked: boolean;
  
  // Landing System
  landingLegsDeployed: boolean;
  gridFinsDeployed: boolean;
  landingBurnStartAltitude: number | null;
  landingTargetX: number; // meters from launch site
  landingAccuracy: number; // meters from target
  recoveryPercentage: number; // 0-100 (based on landing quality)
  boostbackBurnComplete: boolean;
  reentryBurnComplete: boolean;
}

export interface MissionLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface AnalysisRequest {
  config: RocketConfig;
  stats: SimulationState;
}

export interface TrajectoryPoint {
  time: number;
  altitude: number | null;
  predictedAltitude: number | null;
}
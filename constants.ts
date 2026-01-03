export const GRAVITY = 9.81; // m/s^2 (surface gravity - will be replaced by μ/r² in physics)
export const AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m^3
export const SCALE_HEIGHT = 8500; // m (atmosphere scale height)
export const ROCKET_CROSS_SECTION_AREA = 2.5; // m^2 (assumed constant for simplicity)
export const DT = 0.05; // Simulation time step in seconds (20 FPS physics update)
export const MAX_STRUCTURAL_LOAD = 4.0; // G-forces before structural failure warning
export const SPEED_OF_SOUND_SEA_LEVEL = 343; // m/s

// Orbital Mechanics Constants
export const EARTH_RADIUS = 6371000; // m (mean radius)
export const EARTH_MU = 3.986004418e14; // m³/s² (gravitational parameter = G × M_earth)
export const EARTH_ROTATION_RATE = 7.2921159e-5; // rad/s (sidereal rotation)
export const EARTH_MASS = 5.972e24; // kg
export const G_CONSTANT = 6.67430e-11; // m³/(kg⋅s²) (universal gravitational constant)

// Orbital Altitude Definitions
export const KARMAN_LINE = 100000; // m (100 km - boundary of space)
export const LEO_MIN = 200000; // m (200 km - minimum stable LEO)
export const LEO_MAX = 2000000; // m (2000 km)
export const MEO = 20200000; // m (20,200 km - GPS orbits)
export const GEO = 35786000; // m (35,786 km - geostationary)
export const MOON_DISTANCE = 384400000; // m (average)

// Propellant Properties (ISP = Specific Impulse)
export const PROPELLANT_TYPES = {
  'RP-1/LOX': {
    name: 'RP-1/LOX (Kerosene)',
    ispSeaLevel: 311, // seconds
    ispVacuum: 353, // seconds
    density: 1030, // kg/m³ (average of fuel + oxidizer)
    color: 'orange',
    description: 'Dense, high thrust. Used by Falcon 9, Soyuz.'
  },
  'LH2/LOX': {
    name: 'LH2/LOX (Hydrogen)',
    ispSeaLevel: 381, // seconds
    ispVacuum: 452, // seconds
    density: 360, // kg/m³ (very low density)
    color: 'blue',
    description: 'Highest efficiency, low density. Used by Space Shuttle, SLS.'
  },
  'Methane/LOX': {
    name: 'Methane/LOX',
    ispSeaLevel: 334, // seconds
    ispVacuum: 380, // seconds
    density: 820, // kg/m³
    color: 'green',
    description: 'Good balance, can be produced on Mars. Used by Starship, Vulcan.'
  }
};

// Atmospheric Layers (ISA - International Standard Atmosphere)
export const ATMOSPHERE_LAYERS = [
  { name: 'Troposphere', maxAlt: 11000, tempGradient: -0.0065, baseTemp: 288.15, basePressure: 101325 },
  { name: 'Tropopause', maxAlt: 20000, tempGradient: 0, baseTemp: 216.65, basePressure: 22632 },
  { name: 'Stratosphere', maxAlt: 47000, tempGradient: 0.001, baseTemp: 216.65, basePressure: 5474.9 },
  { name: 'Stratopause', maxAlt: 51000, tempGradient: 0.0028, baseTemp: 228.65, basePressure: 868.02 },
  { name: 'Mesosphere', maxAlt: 71000, tempGradient: -0.0028, baseTemp: 270.65, basePressure: 110.91 },
  { name: 'Mesopause', maxAlt: 85000, tempGradient: -0.002, baseTemp: 214.65, basePressure: 3.9564 },
  { name: 'Thermosphere', maxAlt: 200000, tempGradient: 0, baseTemp: 186.87, basePressure: 0.3734 },
  { name: 'Exosphere', maxAlt: Infinity, tempGradient: 0, baseTemp: 1000, basePressure: 0 }
];

export const DEFAULT_CONFIG = {
  stage1: {
    fuelMass: 8000,
    dryMass: 2000,
    thrust: 250000,
    burnRate: 80,
    propellantType: 'RP-1/LOX' as const,
    ispSeaLevel: 311,
    ispVacuum: 353,
    engineCount: 9,
    minEngines: 7,
    reliability: 0.995,
  },
  stage2: {
    fuelMass: 3000,
    dryMass: 800,
    thrust: 60000,
    burnRate: 20,
    propellantType: 'RP-1/LOX' as const,
    ispSeaLevel: 311,
    ispVacuum: 353,
    engineCount: 1,
    minEngines: 1,
    reliability: 0.998,
  },
  dragCoefficient: 0.75,
  payloadMass: 500,
  stagingType: 'cold' as const,
  rcsFuel: 100,
  rcsThrust: 400,
};

// Mission Profiles
export const MISSION_PROFILES = {
  suborbital: {
    id: 'suborbital',
    name: 'Suborbital Flight',
    description: 'Reach space (100km) and return. Perfect for testing and research.',
    targetAltitude: 100000, // 100km (Karman line)
    targetVelocity: 1500,
    requiredDeltaV: 1800,
    difficulty: 'easy' as const,
    icon: '🚀',
    rewards: ['First flight achievement', 'Atmospheric data'],
    color: 'emerald'
  },
  leo: {
    id: 'leo',
    name: 'Low Earth Orbit (LEO)',
    description: 'Achieve stable orbit at 300km altitude. Standard ISS orbit.',
    targetAltitude: 300000, // 300km
    targetVelocity: 7700, // Orbital velocity at 300km
    requiredDeltaV: 9400, // ~9.4 km/s including losses
    difficulty: 'medium' as const,
    icon: '🛰️',
    rewards: ['Orbital insertion', 'Satellite deployment capability'],
    color: 'blue'
  },
  sso: {
    id: 'sso',
    name: 'Sun-Synchronous Orbit (SSO)',
    description: 'Polar orbit at 600km. Used for Earth observation satellites.',
    targetAltitude: 600000, // 600km
    targetVelocity: 7600,
    requiredDeltaV: 9700,
    difficulty: 'medium' as const,
    icon: '🌍',
    rewards: ['Earth observation capability', 'Polar orbit mastery'],
    color: 'cyan'
  },
  gto: {
    id: 'gto',
    name: 'Geostationary Transfer Orbit (GTO)',
    description: 'Highly elliptical orbit (300km x 35,786km). Gateway to GEO.',
    targetAltitude: 35786000, // 35,786km apogee
    targetVelocity: 10200, // At perigee
    requiredDeltaV: 11300,
    difficulty: 'hard' as const,
    icon: '📡',
    rewards: ['Commercial satellite deployment', 'High orbit access'],
    color: 'purple'
  },
  lunar: {
    id: 'lunar',
    name: 'Trans-Lunar Injection (TLI)',
    description: 'Escape Earth orbit towards the Moon. Requires 11km/s delta-V.',
    targetAltitude: 400000, // LEO parking orbit
    targetVelocity: 11000, // Escape velocity component
    requiredDeltaV: 12500,
    difficulty: 'hard' as const,
    icon: '🌙',
    rewards: ['Lunar mission capability', 'Deep space pioneer'],
    color: 'indigo'
  },
  mars: {
    id: 'mars',
    name: 'Mars Transfer Orbit',
    description: 'Interplanetary trajectory to Mars. Ultimate challenge.',
    targetAltitude: 500000, // High Earth orbit
    targetVelocity: 12000, // Trans-Mars injection
    requiredDeltaV: 14000,
    difficulty: 'extreme' as const,
    icon: '🔴',
    rewards: ['Interplanetary pioneer', 'Mars mission unlocked'],
    color: 'red'
  }
};
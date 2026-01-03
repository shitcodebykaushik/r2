import { MissionObjectives } from './types';

export interface MissionData {
  id: string;
  name: string;
  type: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  objectives: MissionObjectives;
  icon: string;
  color: string;
  rewards: string[];
}

export const MISSIONS: MissionData[] = [
  {
    id: 'suborbital',
    name: 'Suborbital Test Flight',
    type: 'Training',
    description: 'Reach 100km altitude (Kármán line) and demonstrate basic flight systems.',
    difficulty: 'easy',
    objectives: {
      targetAltitude: 100000, // 100km
      targetVelocity: 1500,
      missionType: 'Suborbital',
      missionName: 'Suborbital Test Flight',
      description: 'Reach space boundary',
      difficulty: 'easy',
      requiredDeltaV: 1800,
      rewards: ['Basic Flight Data', 'Crew Training']
    },
    icon: '🚀',
    color: 'emerald',
    rewards: ['Flight Data', 'Training Complete']
  },
  {
    id: 'leo',
    name: 'Low Earth Orbit',
    type: 'Orbital',
    description: 'Achieve stable orbit at 200-400km altitude. Standard ISS resupply mission profile.',
    difficulty: 'medium',
    objectives: {
      targetAltitude: 400000, // 400km
      targetVelocity: 7800, // ~orbital velocity
      missionType: 'LEO',
      missionName: 'Low Earth Orbit Mission',
      description: 'Achieve orbital velocity',
      difficulty: 'medium',
      requiredDeltaV: 9400,
      rewards: ['Orbital Data', 'ISS Resupply']
    },
    icon: '🌍',
    color: 'blue',
    rewards: ['Orbital Mechanics Data', 'ISS Contract']
  },
  {
    id: 'polar',
    name: 'Polar Sun-Synchronous Orbit',
    type: 'Science',
    description: 'Launch into polar orbit for Earth observation satellites. Requires precise inclination.',
    difficulty: 'medium',
    objectives: {
      targetAltitude: 600000, // 600km
      targetVelocity: 7600,
      missionType: 'Polar Orbit',
      missionName: 'Sun-Synchronous Orbit',
      description: 'Polar observation mission',
      difficulty: 'medium',
      requiredDeltaV: 9600,
      rewards: ['Earth Observation Data']
    },
    icon: '🛰️',
    color: 'cyan',
    rewards: ['Earth Imaging', 'Climate Data']
  },
  {
    id: 'gto',
    name: 'Geostationary Transfer Orbit',
    type: 'Commercial',
    description: 'Deploy communications satellite to GTO. High energy orbit requiring maximum performance.',
    difficulty: 'hard',
    objectives: {
      targetAltitude: 35786000, // 35,786km (GEO altitude)
      targetVelocity: 10000,
      missionType: 'GTO',
      missionName: 'Geostationary Transfer',
      description: 'High-energy commercial orbit',
      difficulty: 'hard',
      requiredDeltaV: 12500,
      rewards: ['Commercial Contract', 'Heavy Payload']
    },
    icon: '📡',
    color: 'purple',
    rewards: ['Commercial Satellite', '$10M Contract']
  },
  {
    id: 'lunar',
    name: 'Trans-Lunar Injection',
    type: 'Exploration',
    description: 'Escape Earth gravity and head to the Moon. Requires precise trajectory and high delta-V.',
    difficulty: 'hard',
    objectives: {
      targetAltitude: 100000000, // Beyond Earth SOI
      targetVelocity: 11200, // Escape velocity
      missionType: 'Lunar',
      missionName: 'Moon Mission',
      description: 'Lunar trajectory injection',
      difficulty: 'hard',
      requiredDeltaV: 13000,
      rewards: ['Lunar Exploration Data']
    },
    icon: '🌙',
    color: 'slate',
    rewards: ['Deep Space Navigation', 'Artemis Program']
  },
  {
    id: 'mars',
    name: 'Mars Transfer Window',
    type: 'Interplanetary',
    description: 'Launch during optimal Hohmann transfer window to Mars. Ultimate challenge.',
    difficulty: 'extreme',
    objectives: {
      targetAltitude: 200000000, // High orbit for escape
      targetVelocity: 12000, // Hyperbolic excess velocity
      missionType: 'Mars',
      missionName: 'Mars Mission',
      description: 'Interplanetary transfer',
      difficulty: 'extreme',
      requiredDeltaV: 15000,
      rewards: ['Mars Colony', 'History Books']
    },
    icon: '🔴',
    color: 'red',
    rewards: ['Interplanetary Pioneer', 'Mars Colony Established']
  }
];

export interface AimPoint {
  x: number;
  z: number;
  y: number;
}

export type LightType = 'key' | 'fill' | 'rim' | 'beauty' | 'softbox';

export interface Light {
  id: string;
  type: LightType;
  x: number;
  z: number;
  height: number;
  power: number;
  kelvin: number;
  gel: string;
  size: number;
  on: boolean;
  aim: AimPoint | null;
}

export interface Tweaks {
  headStyle: 'realistic';
  focal: number;
  backdrop: string;
}

export interface TypeInfo {
  label: string;
  color: string;
  short: string;
}

export const TYPE_INFO: Record<LightType, TypeInfo> = {
  key:     { label: 'Key',     color: '#C8A96E', short: 'K' },
  fill:    { label: 'Fill',    color: '#78B4DC', short: 'F' },
  rim:     { label: 'Rim',     color: '#DC6EC8', short: 'R' },
  beauty:  { label: 'Beauty',  color: '#6EDCA0', short: 'B' },
  softbox: { label: 'Softbox', color: '#E8D49A', short: 'S' },
};

export interface GelSwatch {
  id: string;
  label: string;
  hex: string;
  css: string;
}

export const GEL_SWATCHES: GelSwatch[] = [
  { id: 'none',    label: 'None',  hex: 'none',    css: '#F2F0EB' },
  { id: 'warm',    label: 'CTO',   hex: '#FFB870', css: '#FFB870' },
  { id: 'cream',   label: 'Cream', hex: '#FFE6C8', css: '#FFE6C8' },
  { id: 'cool',    label: 'CTB',   hex: '#7AB4DC', css: '#7AB4DC' },
  { id: 'magenta', label: 'Mag',   hex: '#DC6EC8', css: '#DC6EC8' },
  { id: 'green',   label: 'Plus',  hex: '#7CDC9A', css: '#7CDC9A' },
];

export interface Preset {
  id: string;
  name: string;
  desc: string;
  lights: Omit<Light, 'id'>[];
}

export interface SavedSetup {
  id: string;
  name: string;
  lights: Light[];
  tweaks: Tweaks;
  cameraPos: { x: number; z: number };
  savedAt: number;
}

export const PRESETS: Preset[] = [
  {
    id: 'rembrandt',
    name: 'Rembrandt',
    desc: '3-light · classic',
    lights: [
      { type: 'key',  x:  1.6, z: -0.6, height: 2.2, power: 85, kelvin: 5400, gel: '#FFE6C8', size: 45, on: true, aim: null },
      { type: 'fill', x: -1.2, z:  0.8, height: 1.7, power: 35, kelvin: 5600, gel: 'none',    size: 70, on: true, aim: null },
      { type: 'rim',  x: -1.4, z: -1.4, height: 2.1, power: 65, kelvin: 6500, gel: 'none',    size: 30, on: true, aim: null },
    ],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    desc: 'Beauty · symmetric',
    lights: [
      { type: 'beauty', x: 0, z:  1.2, height: 2.4, power: 90, kelvin: 5500, gel: 'none', size: 55, on: true, aim: null },
      { type: 'fill',   x: 0, z:  0.8, height: 0.8, power: 40, kelvin: 5500, gel: 'none', size: 80, on: true, aim: null },
    ],
  },
  {
    id: 'split',
    name: 'Split',
    desc: 'Side · dramatic',
    lights: [
      { type: 'key', x: 2.2, z: 0, height: 1.7, power: 95, kelvin: 5200, gel: 'none', size: 35, on: true, aim: null },
    ],
  },
  {
    id: 'loop',
    name: 'Loop',
    desc: 'Soft · flattering',
    lights: [
      { type: 'softbox', x:  1.4, z:  0.6, height: 2.0, power: 80, kelvin: 5500, gel: '#FFE6C8', size: 75, on: true, aim: null },
      { type: 'fill',    x: -1.2, z:  0.6, height: 1.7, power: 30, kelvin: 5500, gel: 'none',    size: 70, on: true, aim: null },
    ],
  },
  {
    id: 'hollywood',
    name: 'Hollywood',
    desc: 'Key + rim · glamour',
    lights: [
      { type: 'key', x:  1.6, z:  0.5, height: 2.2, power: 80, kelvin: 5400, gel: 'none', size: 35, on: true, aim: null },
      { type: 'rim', x: -1.6, z: -1.2, height: 2.4, power: 80, kelvin: 6500, gel: 'none', size: 25, on: true, aim: null },
      { type: 'rim', x:  1.6, z: -1.2, height: 2.4, power: 80, kelvin: 6500, gel: 'none', size: 25, on: true, aim: null },
    ],
  },
];

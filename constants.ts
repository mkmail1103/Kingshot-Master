
import { BuildingDefinition, ResourceConfig } from './types';

// Helper to create levels 1-30 easily where applicable, though most are specific
const createLevels = (data: number[]): { level: number; powerIncrease: number }[] => {
  return data.map((val, idx) => ({ level: idx + 1, powerIncrease: val }));
};

// --- SCORE TABLES FOR DETAILS POPUP ---
export const LORD_EQUIPMENT_SCORES = [
  { rank: 'グッド', score: 1125 },
  { rank: 'グッド (★1)', score: 1875 },
  { rank: 'レア', score: 3000 },
  { rank: 'レア (★1)', score: 4500 },
  { rank: 'レア (★2)', score: 5100 },
  { rank: 'レア (★3)', score: 5440 },
  { rank: 'エピック', score: 3230 },
  { rank: 'エピック (★1)', score: 3230 },
  { rank: 'エピック (★2)', score: 3225 },
  { rank: 'エピック (★3)', score: 3225 },
  { rank: 'エピック T1', score: 3440 },
  { rank: 'エピック T1 (★1)', score: 3440 },
  { rank: 'エピック T1 (★2)', score: 4085 },
  { rank: 'エピック T1 (★3)', score: 4085 },
  { rank: 'レジェンド', score: 6250 },
  { rank: 'レジェンド (★1)', score: 6250 },
  { rank: 'レジェンド (★2)', score: 6250 },
  { rank: 'レジェンド (★3)', score: 6250 },
];

export const LORD_GEM_SCORES = [
  { level: 'Lv.1', score: 625 },
  { level: 'Lv.2', score: 1250 },
  { level: 'Lv.3', score: 3125 },
  { level: 'Lv.4', score: 8750 },
  { level: 'Lv.5', score: 11250 },
  { level: 'Lv.6', score: 12500 },
  { level: 'Lv.7', score: 12500 },
  { level: 'Lv.8', score: 13000 },
  { level: 'Lv.9', score: 14000 },
  { level: 'Lv.10', score: 15000 },
  { level: 'Lv.11', score: 16000 },
];

// --- ALLIANCE MOBILIZATION DATA ---
// Updated to use Ranks: 黄 (Yellow), 紫 (Purple), 青 (Blue) based on provided table
export const MOBILIZATION_QUESTS = [
  // 1. Gathering (Updated values)
  { type: 'gathering', label: '資源採集', category: 'gathering', unit: 'M', variants: [
     { cost: 30, points: 240, rank: '黄', color: 'text-yellow-400' },
     { cost: 25, points: 210, rank: '黄', color: 'text-yellow-400' },
     { cost: 20, points: 180, rank: '紫', color: 'text-purple-400' },
     { cost: 15, points: 150, rank: '青', color: 'text-blue-400' }, 
     { cost: 10, points: 120, rank: '青', color: 'text-blue-400' }, 
  ]},
  // 2. Giant Beast (Rally)
  { type: 'giant_beast', label: '巨獣討伐 (集結)', category: 'rally', unit: '回', variants: [
    { cost: 10, points: 300, rank: '黄', color: 'text-yellow-400' },
    { cost: 5, points: 200, rank: '紫', color: 'text-purple-400' },
  ]},
  // 3. Stamina (Wild Beast)
  { type: 'wild_beast', label: '野獣討伐', category: 'stamina', unit: '回', variants: [
    { cost: 30, points: 300, rank: '黄', color: 'text-yellow-400' }, // 30 times (300 stamina)
    { cost: 20, points: 240, rank: '紫', color: 'text-purple-400' }, // 20 times (200 stamina)
    { cost: 15, points: 200, rank: '紫', color: 'text-purple-400' }, // 15 times (150 stamina)
    { cost: 10, points: 160, rank: '青', color: 'text-blue-400' }, // 10 times (100 stamina)
    { cost: 5, points: 120, rank: '青', color: 'text-blue-400' }, // 5 times (50 stamina)
  ]},
  // 4. Troop Training (New)
  { type: 'training', label: '兵士訓練', category: 'training', unit: '戦力', variants: [
    { cost: 120000, points: 430, rank: '黄', color: 'text-yellow-400' },
    { cost: 30000, points: 210, rank: '紫', color: 'text-purple-400' },
    { cost: 15000, points: 130, rank: '青', color: 'text-blue-400' },
  ]},
  // 5. Speedup General
  { type: 'speedup_general', label: '一般加速', category: 'speedup', variants: [
    { cost: 7200, points: 450, rank: '黄', color: 'text-yellow-400' },
    { cost: 3600, points: 300, rank: '黄', color: 'text-yellow-400' }, 
    { cost: 1800, points: 220, rank: '紫', color: 'text-purple-400' }, 
    { cost: 900, points: 160, rank: '青', color: 'text-blue-400' },
  ]},
  // 6. Speedup Troop
  { type: 'speedup_troop', label: '兵士加速', category: 'speedup', variants: [
    { cost: 7200, points: 450, rank: '黄', color: 'text-yellow-400' },
    { cost: 3600, points: 300, rank: '黄', color: 'text-yellow-400' }, 
    { cost: 1800, points: 220, rank: '紫', color: 'text-purple-400' }, 
    { cost: 900, points: 160, rank: '青', color: 'text-blue-400' },
  ]},
  // 7. Speedup Building
  { type: 'speedup_building', label: '建築加速', category: 'speedup', variants: [
    { cost: 7200, points: 450, rank: '黄', color: 'text-yellow-400' },
    { cost: 3600, points: 300, rank: '黄', color: 'text-yellow-400' }, 
    { cost: 1800, points: 220, rank: '紫', color: 'text-purple-400' }, 
    { cost: 900, points: 160, rank: '青', color: 'text-blue-400' },
  ]},
  // 8. Speedup Research
  { type: 'speedup_research', label: '研究加速', category: 'speedup', variants: [
    { cost: 7200, points: 450, rank: '黄', color: 'text-yellow-400' },
    { cost: 3600, points: 300, rank: '黄', color: 'text-yellow-400' }, 
    { cost: 1800, points: 220, rank: '紫', color: 'text-purple-400' }, 
    { cost: 900, points: 160, rank: '青', color: 'text-blue-400' },
  ]},
  // 9. Diamonds
  { type: 'diamonds', label: 'ダイヤ消費', category: 'item', unit: '個', variants: [
    { cost: 50000, points: 670, rank: '黄', color: 'text-yellow-400' },
    { cost: 30000, points: 460, rank: '黄', color: 'text-yellow-400' },
    { cost: 15000, points: 360, rank: '紫', color: 'text-purple-400' },
    { cost: 10000, points: 280, rank: '紫', color: 'text-purple-400' },
    { cost: 5000, points: 200, rank: '青', color: 'text-blue-400' },
  ]},
  // 10. Hammer
  { type: 'hammer', label: 'ハンマー消費', category: 'item', unit: '個', variants: [
    { cost: 35, points: 550, rank: '黄', color: 'text-yellow-400' },
    { cost: 20, points: 400, rank: '黄', color: 'text-yellow-400' },
    { cost: 10, points: 300, rank: '紫', color: 'text-purple-400' },
  ]},
  // 11. Hero Shards
  { type: 'hero_shards', label: 'レジェンド英雄の欠片', category: 'item', unit: '個', variants: [
    { cost: 68, points: 490, rank: '黄', color: 'text-yellow-400' },
    { cost: 30, points: 320, rank: '黄', color: 'text-yellow-400' }, 
    { cost: 10, points: 200, rank: '紫', color: 'text-purple-400' }, 
  ]},
  // 12. Charge (Purchase)
  { type: 'charge', label: 'パック購入', category: 'charge', unit: 'pt', variants: [
    { cost: 50000, points: 1050, rank: '黄', color: 'text-yellow-400' },
    { cost: 25000, points: 750, rank: '黄', color: 'text-yellow-400' },
    { cost: 12500, points: 500, rank: '紫', color: 'text-purple-400' },
    { cost: 7500, points: 400, rank: '紫', color: 'text-purple-400' },
    { cost: 2500, points: 240, rank: '青', color: 'text-blue-400' },
  ]},
  // 13. Lord Equipment (New)
  { type: 'lord_equip', label: '領主装備', category: 'item', unit: 'pt', variants: [
    { cost: 8900, points: 0, rank: '黄', color: 'text-yellow-400' }, // Unknown points
    { cost: 6000, points: 350, rank: '紫', color: 'text-purple-400' },
    { cost: 3000, points: 250, rank: '紫', color: 'text-purple-400' },
  ]},
  // 14. Lord Gem (New)
  { type: 'lord_gem', label: '領主宝石', category: 'item', unit: 'pt', variants: [
    { cost: 4900, points: 440, rank: '黄', color: 'text-yellow-400' },
    { cost: 2500, points: 340, rank: '紫', color: 'text-purple-400' },
    { cost: 1200, points: 260, rank: '青', color: 'text-blue-400' },
    { cost: 600, points: 200, rank: '青', color: 'text-blue-400' },
  ]},
];

// Troop Data (Level 1-10)
export const TROOP_DATA = [
  { level: 1, name: '見習い', power: 3, trainingPoints: 90 },
  { level: 2, name: '一般', power: 4, trainingPoints: 120 },
  { level: 3, name: '優秀', power: 6, trainingPoints: 180 },
  { level: 4, name: '熟練', power: 9, trainingPoints: 265 },
  { level: 5, name: '豪胆', power: 13, trainingPoints: 385 },
  { level: 6, name: '勇猛', power: 20, trainingPoints: 595 },
  { level: 7, name: '不屈', power: 28, trainingPoints: 830 },
  { level: 8, name: '精鋭', power: 38, trainingPoints: 1130 },
  { level: 9, name: '名誉', power: 50, trainingPoints: 1485 },
  { level: 10, name: 'エース', power: 66, trainingPoints: 1960 },
];

// Resource Ratio Data by Soldier Level
export const SOLDIER_RESOURCE_RATIOS = [
  { level: 1, name: '見習い', ratios: { food: 20.00, wood: 20.00, stone: 6.67, iron: 0.00 } },
  { level: 2, name: '一般', ratios: { food: 20.00, wood: 18.67, stone: 4.00, iron: 0.00 } },
  { level: 3, name: '優秀', ratios: { food: 20.00, wood: 20.87, stone: 5.22, iron: 0.87 } },
  { level: 4, name: '熟練', ratios: { food: 20.00, wood: 19.35, stone: 3.87, iron: 1.94 } },
  { level: 5, name: '豪胆', ratios: { food: 20.00, wood: 19.50, stone: 4.00, iron: 1.50 } },
  { level: 6, name: '勇猛', ratios: { food: 20.00, wood: 19.57, stone: 3.83, iron: 1.28 } },
  { level: 7, name: '不屈', ratios: { food: 20.00, wood: 20.00, stone: 4.00, iron: 0.86 } },
  { level: 8, name: '精鋭', ratios: { food: 20.00, wood: 20.00, stone: 4.14, iron: 1.00 } },
  { level: 9, name: '名誉', ratios: { food: 20.00, wood: 20.06, stone: 4.02, iron: 1.03 } },
  { level: 10, name: 'エース', ratios: { food: 20.00, wood: 20.00, stone: 3.99, iron: 1.00 } },
];

// Data extracted from PDF/OCR
const cityHallData = [
  2000, 1800, 2700, 3600, 5400, 8100, 11700, 11700, 11700, 17000,
  17000, 17000, 28700, 28700, 28700, 40400, 40400, 40400, 57400, 57400,
  57400, 86100, 86100, 86100, 86100, 126500, 126500, 126500, 126500, 183900
];

const embassyGroupData = [
  440, 396, 594, 792, 1188, 1782, 2574, 2574, 2574, 3740,
  3740, 3740, 6314, 6314, 6314, 8888, 8888, 8888, 12628, 12628,
  12628, 18942, 18942, 18942, 18942, 27830, 27830, 27830, 27830, 40458
];

const barracksData = [
  400, 360, 540, 720, 1080, 1620, 2340, 2340, 2340, 3400,
  3400, 3400, 5740, 5740, 5740, 8080, 8080, 8080, 11480, 11480,
  11480, 17220, 17220, 17220, 17220, 25300, 25300, 25300, 25300, 36780
];

const hospitalData = [
  300, 270, 405, 540, 810, 1215, 1755, 1755, 1755, 2550,
  2550, 2550, 4305, 4305, 4305, 6060, 6060, 6060, 8610, 8610,
  8610, 12915, 12915, 12915, 12915, 18975, 18975, 18975, 18975, 27585
];

const commandCenterData = [
  280, 252, 378, 504, 756, 1134, 1638, 1638, 1638, 2380,
  2380, 2380, 4018, 4018, 4018, 5656, 5656, 5656, 8036, 8036,
  8036, 12054, 12054, 12054, 12054, 17710, 17710, 17710, 17710, 25746
];

const productionData = [
  40, 36, 54, 72, 108, 162, 234, 234, 234, 340,
  340, 340, 574, 574, 574, 808, 808, 808, 1148, 1148,
  1148, 1722, 1722, 1722, 1722, 2530, 2530, 2530, 2530, 3678
];

const defenseBureauData = [
  400, 2700, 6300, 12540, 25300, 39120, 63140, 67820, 50600, 36780
];

const infirmaryKitchenData = [
  100, 90, 135, 180, 270, 405, 585, 585, 585, 850
];

const houseWallData = [
  60, 54, 81, 108, 162, 243, 351, 351, 351, 510
];


export const BUILDINGS: BuildingDefinition[] = [
  {
    id: 'city_hall',
    name: '役場',
    levels: createLevels(cityHallData),
  },
  {
    id: 'embassy_group',
    name: '大使館、学院、倉庫',
    levels: createLevels(embassyGroupData),
  },
  {
    id: 'barracks',
    name: '兵舎',
    levels: createLevels(barracksData),
  },
  {
    id: 'hospital',
    name: '野戦病院',
    levels: createLevels(hospitalData),
  },
  {
    id: 'command_center',
    name: '指揮所',
    levels: createLevels(commandCenterData),
  },
  {
    id: 'production',
    name: '生産施設 (パン、木、石、鉄)',
    levels: createLevels(productionData),
  },
  {
    id: 'defense_bureau',
    name: '防衛局',
    levels: createLevels(defenseBureauData),
  },
  {
    id: 'infirmary_kitchen',
    name: '医務室、厨房',
    levels: createLevels(infirmaryKitchenData),
  },
  {
    id: 'house_wall',
    name: '民家、防衛塔、城壁',
    levels: createLevels(houseWallData),
  },
];

const COMMON_PACKS = [
  { id: 'p100', value: 100, label: '100' },
  { id: 'p1k', value: 1000, label: '1K' },
  { id: 'p1k_safe', value: 1000, label: '1K', isSafe: true },
  { id: 'p10k', value: 10000, label: '10K' },
  { id: 'p10k_safe', value: 10000, label: '10K', isSafe: true },
  { id: 'p100k', value: 100000, label: '100K' },
];

export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    id: 'food',
    name: 'パン',
    ratio: 20, 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500',
    ringColor: 'ring-orange-500',
    iconColor: '#f97316',
    packs: COMMON_PACKS
  },
  {
    id: 'wood',
    name: '木材',
    ratio: 20, 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500',
    iconColor: '#10b981',
    packs: COMMON_PACKS
  },
  {
    id: 'stone',
    name: '石材',
    ratio: 4, 
    color: 'text-slate-300',
    bgColor: 'bg-slate-500',
    ringColor: 'ring-slate-500',
    iconColor: '#94a3b8',
    packs: COMMON_PACKS
  },
  {
    id: 'iron',
    name: '鉄鉱',
    ratio: 1, 
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500',
    ringColor: 'ring-indigo-500',
    iconColor: '#6366f1',
    packs: COMMON_PACKS
  },
];

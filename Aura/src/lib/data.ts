import { type CSSProperties } from 'react';

/* ============================================================
 * VOILE Design Tokens & Data Specs
 * Modern 2026 Liquid Glassmorphism & Generative VTON Types
 * ============================================================ */

export type AngleId = 'front' | 'side' | 'back' | 'detail';

export interface AnglePhoto {
  id: AngleId;
  label: string;
  url?: string;
  hint?: string;
}

export interface Garment {
  id: string;
  name: string;
  brand: string;
  fabric: string;
  category: 'Outerwear' | 'Tops' | 'Bottoms' | 'Evening Wear' | 'Streetwear';
  price: string;
  url: string;
}

export interface ModelPreset {
  id: string;
  name: string;
  angles: Record<AngleId, string>;
}

export interface SavedFit {
  id: string;
  modelName: string;
  garmentName: string;
  thumbnail: string;
  timestamp: string;
  fitScore: number;
}

export interface FitMetric {
  label: string;
  value: number;
}

export interface LightingTheme {
  id: LightingPreset;
  label: string;
  description: string;
  orb1: string;
  orb2: string;
  orb3: string;
  ambient: string;
}

export type LightingPreset = 'neutral' | 'golden' | 'cyberpunk';

/* Helper to build deterministic high-resolution Unsplash image URLs */
const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

/* Sample Models for 2D VTON */
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'preset-aria',
    name: 'Aria · Editorial',
    angles: {
      front: U('photo-1534528741775-53994a69daeb'),
      side: U('photo-1534528741775-53994a69daeb'),
      back: U('photo-1534528741775-53994a69daeb'),
      detail: U('photo-1534528741775-53994a69daeb'),
    },
  },
  {
    id: 'preset-kai',
    name: 'Kai · Runway',
    angles: {
      front: U('photo-1507003211169-0a1dd7228f2d'),
      side: U('photo-1507003211169-0a1dd7228f2d'),
      back: U('photo-1507003211169-0a1dd7228f2d'),
      detail: U('photo-1507003211169-0a1dd7228f2d'),
    },
  },
  {
    id: 'preset-noor',
    name: 'Noor · Couture',
    angles: {
      front: U('photo-1539109136881-3be0616acf4b'),
      side: U('photo-1539109136881-3be0616acf4b'),
      back: U('photo-1539109136881-3be0616acf4b'),
      detail: U('photo-1539109136881-3be0616acf4b'),
    },
  },
];

export const ANGLE_DEFS: { id: AngleId; label: string; hint: string }[] = [
  { id: 'front', label: 'Front Angle', hint: 'Primary · facing camera' },
  { id: 'side', label: "3/4 Side", hint: 'Slight rotation' },
  { id: 'back', label: 'Back View', hint: 'Rear silhouette' },
  { id: 'detail', label: 'Close-Up', hint: 'Texture / fabric detail' },
];

/* ------------------------------------------------------------------
 * Curated Flat-Lay & Product-Only Garment Catalog (No Human Models)
 * 10 items covering Tops, Bottoms, Outerwear, Evening Wear
 * ------------------------------------------------------------------ */
export const GARMENTS: Garment[] = [
  {
    id: 'g1',
    name: 'Japanese Selvedge Denim Jacket',
    brand: 'INDIGO ATELIER',
    fabric: '14oz Raw Selvedge Denim',
    category: 'Outerwear',
    price: '$640',
    url: U('photo-1591047139829-d91aecb6caea', 700),
  },
  {
    id: 'g2',
    name: 'Structured Poplin Oxford Shirt',
    brand: 'ARC FORMA',
    fabric: 'Egyptian Poplin Cotton',
    category: 'Tops',
    price: '$340',
    url: U('photo-1603252109303-2751441dd157', 700),
  },
  {
    id: 'g3',
    name: 'Minimalist Black Pima Cotton Tee',
    brand: 'INDIGO ATELIER',
    fabric: 'Heavyweight Pima Cotton',
    category: 'Tops',
    price: '$180',
    url: U('photo-1521572267360-ee0c2909d518', 700),
  },
  {
    id: 'g4',
    name: 'Oversized Heavy Knit Crewneck',
    brand: 'ARC FORMA',
    fabric: 'Merino Wool Blend',
    category: 'Tops',
    price: '$480',
    url: U('photo-1620799140408-edc6dcb6d633', 700),
  },
  {
    id: 'g5',
    name: 'Mongolian Cashmere Drape Coat',
    brand: 'MAISON LUMIÈRE',
    fabric: '100% Mongolian Cashmere',
    category: 'Outerwear',
    price: '$2,100',
    url: U('photo-1539533018447-63fcce2678e3', 700),
  },
  {
    id: 'g6',
    name: 'Japanese Raw Selvedge Denim Jeans',
    brand: 'INDIGO ATELIER',
    fabric: '13.5oz Kurabo Denim',
    category: 'Bottoms',
    price: '$420',
    url: U('photo-1542272604-780c96856592', 700),
  },
  {
    id: 'g7',
    name: 'Tailored Italian Wool Trousers',
    brand: 'MAISON LUMIÈRE',
    fabric: 'Super 120s Italian Wool',
    category: 'Bottoms',
    price: '$590',
    url: U('photo-1624378439575-d8705ad7ae80', 700),
  },
  {
    id: 'g8',
    name: 'Pleated Minimalist Chino Shorts',
    brand: 'ARC FORMA',
    fabric: 'Heavy Cotton Twill',
    category: 'Bottoms',
    price: '$280',
    url: U('photo-1591195853828-11db59a44f6b', 700),
  },
  {
    id: 'g9',
    name: 'Relaxed Linen Drawstring Pants',
    brand: 'INDIGO ATELIER',
    fabric: '100% Organic Linen',
    category: 'Bottoms',
    price: '$310',
    url: U('photo-1509551388413-e18d0ac5d495', 700),
  },
  {
    id: 'g10',
    name: 'Technical Utility Cargo Trouser',
    brand: 'NEØN FORM',
    fabric: 'Coated Ripstop Nylon',
    category: 'Bottoms',
    price: '$450',
    url: U('photo-1517445312882-bc9910d016b7', 700),
  },
];

export const GALLERY_GARMENT: string = U('photo-1583743814966-8936f5b88be1', 800);

export const SAMPLE_MODEL_NOTE = 'Sample Editorial Model Active';

export const RESULT_IMAGES: Record<string, Record<AngleId, string>> = {
  'preset-aria': {
    front: U('photo-1534528741775-53994a69daeb', 900),
    side: U('photo-1517841905240-472988babdf9', 900),
    back: U('photo-1524504388940-b1c1722653e1', 900),
    detail: U('photo-1534528741775-53994a69daeb', 900),
  },
  'preset-kai': {
    front: U('photo-1507003211169-0a1dd7228f2d', 900),
    side: U('photo-1500648767791-00dcc994a43e', 900),
    back: U('photo-1506794778202-cad84cf45f1d', 900),
    detail: U('photo-1507003211169-0a1dd7228f2d', 900),
  },
  'preset-noor': {
    front: U('photo-1539109136881-3be0616acf4b', 900),
    side: U('photo-1539109136881-3be0616acf4b', 900),
    back: U('photo-1539109136881-3be0616acf4b'),
    detail: U('photo-1539109136881-3be0616acf4b'),
  },
};

export const FIT_LOGS: string[] = [
  '[LOG 01] Analyzing human pose and body proportions...',
  '[LOG 02] Segmenting garment structure and fabric texture...',
  '[LOG 03] Extracting tension vectors and drape physics...',
  '[LOG 04] Synthesizing high-fidelity neural try-on render...',
  '[LOG 05] Calibrating ambient lighting and shadow harmony...',
];

export const FIT_METRICS: FitMetric[] = [
  { label: 'Fabric Elasticity Match', value: 100 },
  { label: 'Lighting Synergy', value: 97 },
  { label: 'Drape Tension', value: 99 },
];

export const FIT_OVERALL = 98.7;

export const LIGHTING_THEMES: LightingTheme[] = [
  {
    id: 'neutral',
    label: 'Studio Neutral',
    description: 'Sleek dark grey, crisp white rim light',
    orb1: 'rgba(0, 229, 255, 0.20)',
    orb2: 'rgba(139, 63, 224, 0.25)',
    orb3: 'rgba(232, 196, 104, 0.15)',
    ambient: 'rgba(120, 130, 150, 0.04)',
  },
  {
    id: 'golden',
    label: 'Golden Hour Glow',
    description: 'Warm amber & champagne mesh gradient',
    orb1: 'rgba(245, 158, 11, 0.22)',
    orb2: 'rgba(232, 196, 104, 0.30)',
    orb3: 'rgba(255, 180, 120, 0.18)',
    ambient: 'rgba(232, 196, 104, 0.06)',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon',
    description: 'Electric cyan & hot magenta neon',
    orb1: 'rgba(0, 229, 255, 0.28)',
    orb2: 'rgba(255, 0, 170, 0.26)',
    orb3: 'rgba(139, 63, 224, 0.20)',
    ambient: 'rgba(0, 229, 255, 0.05)',
  },
];

export const STYLIST_SUGGESTIONS: string[] = [
  'Does this jacket complement my proportions?',
  'Suggest matching trousers for this top.',
  'What footwear completes an evening gown look?',
  'Layer this leather coat for a winter streetwear fit.',
];

export const INITIAL_SAVED_FITS: SavedFit[] = [
  {
    id: 'sf1',
    modelName: 'Aria · Editorial',
    garmentName: 'Italian Mulberry Silk Gown',
    thumbnail: U('photo-1581338834647-b0fb40704e21', 300),
    timestamp: '2h ago',
    fitScore: 98.7,
  },
  {
    id: 'sf2',
    modelName: 'Kai · Runway',
    garmentName: 'Japanese Selvedge Denim Jacket',
    thumbnail: U('photo-1591047139829-d91aecb6caea', 300),
    timestamp: 'Yesterday',
    fitScore: 99.1,
  },
];

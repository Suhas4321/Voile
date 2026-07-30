import { type CSSProperties } from 'react';

/* ============================================================
 * FitLabs Design Tokens & Data Specs
 * Modern 2026 Liquid Glassmorphism & Generative VTON Types
 * ============================================================ */

export type AngleId = 'front' | 'side' | 'back' | 'detail';

export interface AnglePhoto {
  id: AngleId;
  label: string;
  url?: string;
  hint?: string;
}

export type GarmentCategory =
  | 'All'
  | 'Outerwear'
  | 'Tops'
  | 'Bottoms'
  | 'Evening Wear'
  | 'Streetwear'
  | 'Accessories';

export interface Garment {
  id: string;
  name: string;
  brand: string;
  fabric: string;
  category: 'Outerwear' | 'Tops' | 'Bottoms' | 'Evening Wear' | 'Streetwear';
  price: string;
  url: string;
}

/** E-commerce stores surfaced in marketing UI (import support varies — see scraper_notes.md). */
export const SUPPORTED_STORES = [
  'Myntra',
  'Ajio',
  'Amazon Fashion',
  'Flipkart',
  'Meesho',
  'Nykaa Fashion',
  'Tata CLiQ',
] as const;

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
  /** Page base fill behind orbs */
  base: string;
  orb1: string;
  orb2: string;
  orb3: string;
  ambient: string;
}

export type LightingPreset = 'obsidian' | 'golden' | 'neutral' | 'cyberpunk';

/* Helper to build deterministic high-resolution Unsplash image URLs */
const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

/* Portrait full-body framing for model presets (preserves head→legs) */
const UM = (id: string, w = 640, h = 960) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=85`;

/* Sample Models for 2D VTON — full-body standing, plain/simple backgrounds */
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'preset-aria',
    name: 'Aria · Editorial',
    angles: {
      // Studio mustard backdrop, standing front, mid-thigh+ visible
      front: UM('photo-1572804013309-59a88b7e92f1'),
      side: UM('photo-1572804013309-59a88b7e92f1'),
      back: UM('photo-1572804013309-59a88b7e92f1'),
      detail: UM('photo-1572804013309-59a88b7e92f1'),
    },
  },
  {
    id: 'preset-kai',
    name: 'Kai · Runway',
    angles: {
      // Full-length standing male, head→feet, near-forward neutral pose
      front: UM('photo-1618886614638-80e3c103d31a'),
      side: UM('photo-1618886614638-80e3c103d31a'),
      back: UM('photo-1618886614638-80e3c103d31a'),
      detail: UM('photo-1618886614638-80e3c103d31a'),
    },
  },
  {
    id: 'preset-noor',
    name: 'Noor · Couture',
    angles: {
      // Studio plain backdrop, standing front, mid-thigh+ visible (alt pose)
      front: UM('photo-1572804013427-4d7ca7268217'),
      side: UM('photo-1572804013427-4d7ca7268217'),
      back: UM('photo-1572804013427-4d7ca7268217'),
      detail: UM('photo-1572804013427-4d7ca7268217'),
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
    // Single denim jacket on hanger, black studio bg
    url: U('photo-1611312449408-fcece27cdbb7', 700),
  },
  {
    id: 'g2',
    name: 'Structured Poplin Oxford Shirt',
    brand: 'ARC FORMA',
    fabric: 'Egyptian Poplin Cotton',
    category: 'Tops',
    price: '$340',
    // Single button-down shirt on hanger (garment-only, no face)
    url: U('photo-1596755094514-f87e34085b2c', 700),
  },
  {
    id: 'g3',
    name: 'Minimalist Black Pima Cotton Tee',
    brand: 'INDIGO ATELIER',
    fabric: 'Heavyweight Pima Cotton',
    category: 'Tops',
    price: '$180',
    // Single black tee on wooden hanger, white bg
    url: U('photo-1618354691373-d851c5c3a990', 700),
  },
  {
    id: 'g4',
    name: 'Oversized Heavy Knit Crewneck',
    brand: 'ARC FORMA',
    fabric: 'Merino Wool Blend',
    category: 'Tops',
    price: '$480',
    // White crewneck flat-lay product photo
    url: U('photo-1620799140408-edc6dcb6d633', 700),
  },
  {
    id: 'g5',
    name: 'Mongolian Cashmere Drape Coat',
    brand: 'MAISON LUMIÈRE',
    fabric: '100% Mongolian Cashmere',
    category: 'Outerwear',
    price: '$2,100',
    // Camel wrap coat as clear subject (face cropped out)
    url: U('photo-1539533113208-f6df8cc8b543', 700),
  },
  {
    id: 'g6',
    name: 'Japanese Raw Selvedge Denim Jeans',
    brand: 'INDIGO ATELIER',
    fabric: '13.5oz Kurabo Denim',
    category: 'Bottoms',
    price: '$420',
    // Single pair of jeans on wooden hanger
    url: U('photo-1602293589930-45aad59ba3ab', 700),
  },
  {
    id: 'g7',
    name: 'Tailored Italian Wool Trousers',
    brand: 'MAISON LUMIÈRE',
    fabric: 'Super 120s Italian Wool',
    category: 'Bottoms',
    price: '$590',
    // Dark trousers flat-lay, plain background
    url: U('photo-1624378439575-d8705ad7ae80', 700),
  },
  {
    id: 'g8',
    name: 'Pleated Minimalist Chino Shorts',
    brand: 'ARC FORMA',
    fabric: 'Heavy Cotton Twill',
    category: 'Bottoms',
    price: '$280',
    // Single shorts flat-lay product photo
    url: U('photo-1591195853828-11db59a44f6b', 700),
  },
  {
    id: 'g9',
    name: 'Relaxed Linen Drawstring Pants',
    brand: 'INDIGO ATELIER',
    fabric: '100% Organic Linen',
    category: 'Bottoms',
    price: '$310',
    // Drawstring pants as clear garment subject on white bg
    url: U('photo-1594633312681-425c7b97ccd1', 700),
  },
  {
    id: 'g10',
    name: 'Technical Utility Cargo Trouser',
    brand: 'NEØN FORM',
    fabric: 'Coated Ripstop Nylon',
    category: 'Bottoms',
    price: '$450',
    // Cargo trousers as clear visual subject
    url: U('photo-1552902865-b72c031ac5ea', 700),
  },
];

export const GALLERY_GARMENT: string = U('photo-1583743814966-8936f5b88be1', 800);

export const SAMPLE_MODEL_NOTE = 'Sample Editorial Model Active';

export const RESULT_IMAGES: Record<string, Record<AngleId, string>> = {
  'preset-aria': {
    front: UM('photo-1572804013309-59a88b7e92f1', 720, 1080),
    side: UM('photo-1572804013309-59a88b7e92f1', 720, 1080),
    back: UM('photo-1572804013309-59a88b7e92f1', 720, 1080),
    detail: UM('photo-1572804013309-59a88b7e92f1', 720, 1080),
  },
  'preset-kai': {
    front: UM('photo-1618886614638-80e3c103d31a', 720, 1080),
    side: UM('photo-1618886614638-80e3c103d31a', 720, 1080),
    back: UM('photo-1618886614638-80e3c103d31a', 720, 1080),
    detail: UM('photo-1618886614638-80e3c103d31a', 720, 1080),
  },
  'preset-noor': {
    front: UM('photo-1572804013427-4d7ca7268217', 720, 1080),
    side: UM('photo-1572804013427-4d7ca7268217', 720, 1080),
    back: UM('photo-1572804013427-4d7ca7268217', 720, 1080),
    detail: UM('photo-1572804013427-4d7ca7268217', 720, 1080),
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

/**
 * Studio / page atmospheres.
 * Black & Gold (obsidian) is the classic FitLabs charcoal luxury look.
 */
export const LIGHTING_THEMES: LightingTheme[] = [
  {
    id: 'obsidian',
    label: 'Black & Gold',
    description: 'Deep charcoal black with pure metallic gold — signature FitLabs look',
    base: '#0C0A09',
    orb1: 'rgba(212, 175, 55, 0.20)',
    orb2: 'rgba(180, 83, 9, 0.18)',
    orb3: 'rgba(232, 196, 104, 0.14)',
    ambient: 'rgba(212, 175, 55, 0.05)',
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    description: 'Warm amber & champagne gold — editorial luxury glow',
    base: '#0A0908',
    orb1: 'rgba(212, 175, 55, 0.26)',
    orb2: 'rgba(245, 158, 11, 0.24)',
    orb3: 'rgba(232, 196, 104, 0.20)',
    ambient: 'rgba(212, 175, 55, 0.08)',
  },
  {
    id: 'neutral',
    label: 'Studio Neutral',
    description: 'Cool slate & soft silver rim — clean daylight studio',
    base: '#0B0D10',
    orb1: 'rgba(148, 163, 184, 0.16)',
    orb2: 'rgba(71, 85, 105, 0.22)',
    orb3: 'rgba(226, 232, 240, 0.10)',
    ambient: 'rgba(148, 163, 184, 0.05)',
  },
  {
    id: 'cyberpunk',
    label: 'Midnight Neon',
    description: 'Electric cyan & violet edge — night runway energy',
    base: '#07060C',
    orb1: 'rgba(34, 211, 238, 0.18)',
    orb2: 'rgba(139, 92, 246, 0.22)',
    orb3: 'rgba(236, 72, 153, 0.12)',
    ambient: 'rgba(99, 102, 241, 0.06)',
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

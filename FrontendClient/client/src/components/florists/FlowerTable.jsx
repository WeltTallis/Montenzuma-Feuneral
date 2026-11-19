// FlowerTable.jsx
const FLOWERS = [
  {
    id: 'ft-001',
    name: 'Evergreen Casket Spray',
    type: 'Casket Spray',
    size: 'Large (6 ft)',
    price: 18500,
    image: 'https://images.unsplash.com/photo-1590037888872-3edb5dc3f896?q=80&w=1000&auto=format&fit=crop',
    description: 'A classic evergreen casket spray with white lilies, roses and seasonal greenery. Suitable for standard caskets and chapel services.',
    occasion: 'Funeral Service',
    featured: true,
  },
  {
    id: 'ft-002',
    name: 'Peaceful Heart Wreath',
    type: 'Wreath',
    size: '24 inch',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1518570777216-b19996206969?q=80&w=1000&auto=format&fit=crop',
    description: 'Heart-shaped standing wreath of white chrysanthemums and roses, symbolising eternal love and peace.',
    occasion: 'Funeral Service',
    featured: false,
  },
  {
    id: 'ft-003',
    name: 'Lily &amp; Rose Sympathy Bouquet',
    type: 'Bouquet',
    size: 'Standard',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1552317637-3d42c03c33e2?q=80&w=1000&auto=format&fit=crop',
    description: 'Hand-tied sympathy bouquet with white lilies, garden roses and eucalyptus. Delivered to the family home or funeral home.',
    occasion: 'Sympathy',
    featured: false,
  },
  {
    id: 'ft-004',
    name: 'Pure White Standing Cross',
    type: 'Standing Cross',
    size: '4 ft',
    price: 15500,
    image: 'https://images.unsplash.com/photo-1519866221471-688bf97301e1?q=80&w=1000&auto=format&fit=crop',
    description: 'Elegant standing cross arrangement of white orchids and lilies for church funeral services.',
    occasion: 'Church Service',
    featured: true,
  },
  {
    id: 'ft-005',
    name: 'Gentle Memories Basket',
    type: 'Basket Arrangement',
    size: 'Medium',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1582232629369-84992c0838e2?q=80&w=1000&auto=format&fit=crop',
    description: 'Low-profile sympathy basket with mixed seasonal blooms, ideal for the family table or reception.',
    occasion: 'Sympathy',
    featured: false,
  },
  {
    id: 'ft-006',
    name: 'Cemetery Memorial Posy',
    type: 'Grave Posy',
    size: '12 inch',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1518707043343-7431f89b2853?q=80&w=1000&auto=format&fit=crop',
    description: 'Fresh grave-side posy with hardy blooms for cemetery visits and memorial anniversaries.',
    occasion: 'Cemetery',
    featured: false,
  },
  {
    id: 'ft-007',
    name: 'Casket Pillow - White Roses',
    type: 'Casket Pillow',
    size: 'Standard',
    price: 9500,
    image: 'https://images.unsplash.com/photo-1577368810651-27959a6c0b9c?q=80&w=1000&auto=format&fit=crop',
    description: 'White rose casket pillow for the casket lid, a traditional final tribute for burial services.',
    occasion: 'Burial',
    featured: false,
  },
  {
    id: 'ft-008',
    name: 'Chaplain Standing Spray',
    type: 'Standing Spray',
    size: '5 ft',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1586650820376-306c0351c1ca?q=80&w=1000&auto=format&fit=crop',
    description: 'Easel standing spray of lilies, gladioli and roses for chapel and graveside services.',
    occasion: 'Chapel Service',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Funeral Service', 'Sympathy', 'Church Service', 'Burial', 'Cemetery', 'Chapel Service'];
// Public-facing flower arrangement catalogue rendered as a searchable table.
// SEO-optimised page for funeral flower arrangements in Kenya.
// No authentication required.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, Mail, Phone, Clock, Truck, CheckCircle, Search, Filter } from '../../utils/icons/icons';

const C = {
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  line: '#E3DDD0',
  gray: '#6B6862',
  accent: '#C77B5E',
};

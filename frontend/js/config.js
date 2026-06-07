export const API_BASE = import.meta.env?.VITE_API_URL ?? 'https://your-app.railway.app';

export const DRINKS = [
  {
    id: 'rum-1',
    category: 'rum',
    name: 'Dark & Stormy',
    photo: 'assets/drinks/rum-1.jpg',
    description: 'A classic rum-based cocktail with ginger beer and lime.',
    ingredients: ['2oz dark rum', 'Ginger beer', 'Lime juice', 'Lime wedge'],
  },
  {
    id: 'rum-2',
    category: 'rum',
    name: 'Jungle Bird',
    photo: 'assets/drinks/rum-2.jpg',
    description: 'A tropical rum cocktail with Campari and pineapple.',
    ingredients: ['1.5oz dark rum', '0.75oz Campari', 'Pineapple juice', 'Lime juice', 'Simple syrup'],
  },
  {
    id: 'gin-1',
    category: 'gin',
    name: "Bee's Knees",
    photo: 'assets/drinks/gin-1.jpg',
    description: 'A classic gin cocktail with honey syrup and lemon juice.',
    ingredients: ['2oz gin', 'Honey syrup', 'Lemon juice'],
  },
  {
    id: 'bourbon-1',
    category: 'bourbon',
    name: 'Old Fashioned',
    photo: 'assets/drinks/bourbon-1.jpg',
    description: 'A classic bourbon cocktail with sugar, bitters, and orange peel.',
    ingredients: ['2oz bourbon', 'Sugar cube', 'Angostura bitters', 'Orange peel'],
  },
  {
    id: 'spritz-1',
    category: 'spritz',
    name: 'Aperol Spritz',
    photo: 'assets/drinks/spritz-1.jpg',
    description: 'A refreshing aperitif with Prosecco, Aperol, and soda water.',
    ingredients: ['3oz Prosecco', '2oz Aperol', '1oz soda water', 'Orange slice'],
  },
];

export const CATEGORIES = [
  { id: 'rum',     label: 'Rum Drinks' },
  { id: 'gin',     label: 'Gin Drinks' },
  { id: 'bourbon', label: 'Bourbon Drinks' },
  { id: 'spritz',  label: 'Spritz' },
];

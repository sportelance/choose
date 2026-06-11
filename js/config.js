// AWS — injected by GitHub Actions during build
export const AWS_REGION        = 'us-east-1';
export const AWS_ACCESS_KEY_ID = '__AWS_ACCESS_KEY_ID__';
export const AWS_SECRET_ACCESS_KEY = '__AWS_SECRET_ACCESS_KEY__';
export const DYNAMO_TABLE      = 'DrinkVotes';

export const DRINKS = [
  {
    id: 'rum-1',
    category: 'rum',
    name: 'Saintly Habit',
    photo: 'assets/drinks/rum-1.jpg',
    description: 'I think this is the first cocktail to have orange marinade in it',
    ingredients: ['.05oz dark rum', '.05 oz cognac', '.75 oz benedectine', '.75 oz Falernum', '1oz Naranja Agria'],
  },
  {
    id: 'rum-2',
    category: 'rum',
    name: 'RedMercedes',
    photo: 'assets/drinks/rum-2.jpg',
    description: 'Trunk so big it could fit my reverend',
    ingredients: ['.75oz jamaican rum', '.75oz Gin', '.75 oz ginger liqueur', '.75 oz lime juice'],
  },
  {
    id: 'rum-3',
    category: 'rum',
    name: 'Marge Simpson',
    photo: 'assets/drinks/rum-3.jpg',
    description: 'Yellow with broad appeal',
    ingredients: ['1.5 oz Spiced Rum', '.5 oz Cognac', '.75 oz falernum', '.75 oz lime', '.5 oz orgeat'],
  },
  {
    id: 'rum-4',
    category: 'rum',
    name: 'Fleur Du Sol',
    photo: 'assets/drinks/rum-4.jpg',
    description: 'Elevated, but down to earth.',
    ingredients: ['1 oz Dark Rum', '.5 oz cherry brandy', '.5 oz gin', '.5 oz dry curacao', '.75 oz lime juice', '.5 oz orgeat'],
  },
  {
    id: 'rum-5',
    category: 'rum',
    name: 'Flowah Powah',
    photo: 'assets/drinks/rum-5.jpg',
    description: 'Ok, the other one was a little pretentious. This one is punchy.',
    ingredients: ['1 oz Jamaican Rum', '.5 oz overproof rum', '.5 oz brandy', '.75 oz dry curacao', '.75 oz lime juice', '.75 oz orgeat'],
  },
  {
    id: 'rum-6',
    category: 'rum',
    name: 'Swallowtail',
    photo: 'assets/drinks/rum-6.jpg',
    description: 'A moth fleeing the heat of the tropics, seeking refuge in the coolness of the glass.',
    ingredients: ['1 oz Jamaican Rum', '.5 oz gin', '.75 oz lemon', '.5 oz cynar', '.5 oz cynar', '.5 oz chambord', '.5 oz Thai Basil Syrup', '4 Dashes Cherry Bitters'],
  },
  {
    id: 'gin-1',
    category: 'gin',
    name: "Peacebone",
    photo: 'assets/drinks/gin-1.jpg',
    description: 'Supposedly leaking the most intersting colors.',
    ingredients: ['2oz gin', '.5 oz Orange Curacao', '.5 oz Kombucha', '1 oz Lemon', '.75 oz Simple syrup', '1 Tbsb Strawberry Jam', 'Mint and Basil'],
  },
  {
    id: 'bourbon-1',
    category: 'bourbon',
    name: 'Blue Bear',
    photo: 'assets/drinks/bourbon-1.jpg',
    description: 'A summery bourbon cocktail with fruit and honey.',
    ingredients: ['1.5 oz bourbon', '0.75 oz lemon juice', '0.75 oz Blueberry Liqueur', '.75 oz Gran Gala', '.5 oz Honey syrup'],
  },
  {
    id: 'tequila-1',
    category: 'tequila',
    name: 'Pitayita',
    photo: 'assets/drinks/tequila-1.jpg',
    description: 'Just bit of dragonfruit (actually quite a bit of dragonfruit).',
    ingredients: ['1oz Tequila Anejo', '.5oz Cognac', '1 oz Dragonfruit Liqueur', '.75 oz Lime Juice', '.5 oz Lillet Blanc'],
  },
  {
    id: 'spritz-1',
    category: 'spritz',
    name: 'White Noise',
    photo: 'assets/drinks/spritz-1.jpg',
    description: 'A refreshing aperitif with Cocchi Americano, Elderflower liqueur, and soda water.',
    ingredients: ['1.5oz Cocchi Americano', '1oz Elderflower liqueur', '1oz Soda water'],
  },
];

export const CATEGORIES = [
  { id: 'rum',     label: 'Rum Drinks' },
  { id: 'gin',     label: 'Gin Drinks' },
  { id: 'bourbon', label: 'Bourbon Drinks' },
  { id: 'spritz',  label: 'Spritzes' },
  { id: 'tequila', label: 'Tequila Drinks' },
];

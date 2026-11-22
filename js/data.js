// Dummy, static data for the first-run flow. Screens read through store.js.
// Photos are relative paths (GitHub Pages safe). `photo: null` means we do
// not have a photo yet → the UI shows a bowl icon in a meal tint.

export const PHOTO_DIR = 'assets/photos/';
export const THUMB_DIR = 'assets/photos/thumb/';

export const photoUrl = (id) => (id ? `${PHOTO_DIR}${id}.jpg` : null);
export const thumbUrl = (id) => (id ? `${THUMB_DIR}${id}.jpg` : null);

export const HERO_PHOTO = 'hero-thali';

/** Demo values used to simulate SMS and the server. */
export const DEMO = {
  otp: '482719',
  resendSeconds: 30,
  smsDelayMs: 1800,
  verifyMs: 900,
  sendMs: 800,
};

export const ALLERGIES = [
  { id: 'milk', name: 'Milk' },
  { id: 'egg', name: 'Egg' },
  { id: 'peanut', name: 'Peanut' },
  { id: 'treenuts', name: 'Tree nuts' },
  { id: 'wheat', name: 'Wheat' },
  { id: 'mustard', name: 'Mustard' },
];

/** Shown in the "Add another" allergy sheet. */
/** Milk foods a milk allergy may or may not include. The parent chooses which (setup asks). */
export const MILK_PARTS = [
  { id: 'curd', name: 'Curd', long: 'Curd (dahi)', hi: 'दही' },
  { id: 'paneer', name: 'Paneer', long: 'Paneer', hi: 'पनीर' },
  { id: 'ghee', name: 'Ghee', long: 'Ghee', hi: 'घी' },
];

export const MORE_ALLERGIES = [
  { id: 'soy', name: 'Soy' },
  { id: 'sesame', name: 'Sesame' },
  { id: 'fish', name: 'Fish' },
  { id: 'shellfish', name: 'Shellfish' },
  { id: 'coconut', name: 'Coconut' },
  { id: 'corn', name: 'Corn' },
];

export const HOUSE_RULES = [
  { id: 'sugar', name: 'No added sugar', icon: 'sugar', defaultOn: true },
  { id: 'salt', name: 'No added salt or spice', icon: 'leaf', defaultOn: true },
  { id: 'biscuits', name: 'No biscuits or jam', icon: 'cookie', defaultOn: false },
  { id: 'outside', name: 'No outside food', icon: 'store', defaultOn: false },
];

export const DIETS = [
  { id: 'veg', name: 'Veg' },
  { id: 'egg', name: 'Egg' },
  { id: 'nonveg', name: 'Non-veg' },
  { id: 'jain', name: 'Jain' },
];

export const CUISINES = [
  { id: 'north-indian', name: 'North Indian', meta: 'Dal, roti, sabzi', photo: 'cuisine-north-indian' },
  { id: 'south-indian', name: 'South Indian', meta: 'Idli, dosa, sambar', photo: 'cuisine-south-indian' },
  { id: 'maharashtrian', name: 'Maharashtrian', meta: 'Poha, bhakri, varan', photo: 'cuisine-maharashtrian' },
  { id: 'gujarati', name: 'Gujarati', meta: 'Thepla, khichdi, kadhi', photo: 'cuisine-gujarati' },
  { id: 'mixed', name: 'Mixed or other', meta: 'Tell us in your words', photo: 'cuisine-mixed', opensSheet: true },
];

export const REGIONAL_CUISINES = ['Konkani', 'Punjabi', 'Bengali', 'Kerala', 'Rajasthani', 'Bihari', 'Sindhi'];

/**
 * Food library (on-phone). `allergens` drive the safety checks; `backup`
 * marks foods most toddlers accept, used to suggest backups first.
 */
export const FOODS = [
  { id: 'dal-rice', name: 'Dal-rice', photo: 'dal-rice', allergens: [], backup: 3 },
  { id: 'khichdi', name: 'Khichdi', photo: 'khichdi', allergens: [], backup: 4 },
  { id: 'poha', name: 'Poha', photo: 'poha', allergens: [] },
  { id: 'idli', name: 'Idli', photo: 'idli', allergens: [], backup: 5 },
  { id: 'ragi-porridge', name: 'Ragi porridge', photo: 'ragi-porridge', allergens: [] },
  { id: 'upma', name: 'Upma', photo: 'upma', allergens: ['wheat'] },
  { id: 'curd-rice', name: 'Curd-rice', photo: 'curd-rice', allergens: ['curd'], backup: 2 },
  { id: 'banana', name: 'Banana', photo: 'mashed-banana', allergens: [], backup: 1 },
  { id: 'cheela', name: 'Cheela', photo: 'cheela', allergens: [] },
  { id: 'palak-khichdi', name: 'Palak khichdi', photo: 'palak-khichdi', allergens: [] },
  { id: 'egg-bhurji-rice', name: 'Egg bhurji with rice', photo: 'egg-bhurji-rice', allergens: ['egg'] },
  { id: 'ragi-malt', name: 'Ragi malt', photo: 'ragi-malt', allergens: ['milk'] },
  { id: 'curd-rice-cucumber', name: 'Curd rice with cucumber', photo: 'curd-rice-cucumber', allergens: ['curd'] },
  { id: 'khichdi-bhindi', name: 'Dal khichdi with bhindi', photo: 'khichdi-bhindi', allergens: [] },
  { id: 'khichdi-balls', name: 'Khichdi balls', photo: 'khichdi-balls', allergens: [] },
  { id: 'egg-dal-rice', name: 'Egg dal-rice', photo: 'egg-dal-rice', allergens: ['egg'] },
  // Bhurji could be egg or paneer, so both allergens are checked to stay safe.
  { id: 'khichdi-bhurji', name: 'Dal khichdi with bhurji', photo: 'khichdi-bhurji', allergens: ['egg', 'paneer'] },
  { id: 'ragi-laddoo', name: 'Ragi laddoo', photo: null, allergens: [] },
  { id: 'ragi-dosa', name: 'Ragi dosa', photo: null, allergens: [] },
  { id: 'ragi-idli', name: 'Ragi idli', photo: null, allergens: [] },
  { id: 'moong-cheela', name: 'Moong dal cheela', photo: null, allergens: [] },
  { id: 'sabudana-khichdi', name: 'Sabudana khichdi', photo: null, allergens: ['peanut'] },
  { id: 'veg-pulao', name: 'Vegetable pulao', photo: null, allergens: [] },
  { id: 'rajma-rice', name: 'Rajma rice', photo: null, allergens: [] },
  { id: 'roti-dal', name: 'Soft roti with dal', photo: null, allergens: ['wheat'] },
  { id: 'paneer-paratha', name: 'Paneer paratha', photo: null, allergens: ['paneer', 'wheat', 'ghee'] },
  { id: 'thepla', name: 'Methi thepla', photo: null, allergens: ['wheat'] },
  { id: 'dhokla', name: 'Dhokla', photo: null, allergens: ['mustard'] },
  { id: 'pongal', name: 'Ven pongal', photo: null, allergens: [] },
  { id: 'dosa', name: 'Dosa', photo: null, allergens: [] },
  { id: 'uttapam', name: 'Vegetable uttapam', photo: null, allergens: [] },
  { id: 'sheera', name: 'Sooji sheera', photo: null, allergens: ['wheat', 'milk', 'ghee'] },
  { id: 'kheer', name: 'Rice kheer', photo: null, allergens: ['milk'] },
  { id: 'dalia', name: 'Dalia', photo: null, allergens: ['wheat'] },
  { id: 'oats-porridge', name: 'Oats porridge', photo: null, allergens: [] },
  { id: 'sweet-potato', name: 'Mashed sweet potato', photo: null, allergens: [] },
  { id: 'stewed-apple', name: 'Stewed apple', photo: null, allergens: [] },
  { id: 'papaya', name: 'Papaya', photo: null, allergens: [] },
  { id: 'mango', name: 'Mango', photo: null, allergens: [] },
  { id: 'chikoo', name: 'Chikoo', photo: null, allergens: [] },
  { id: 'peanut-chikki', name: 'Peanut chikki', photo: null, allergens: ['peanut'] },
  { id: 'badam-milk', name: 'Badam milk', photo: null, allergens: ['milk', 'treenuts'] },
  { id: 'sarson-saag', name: 'Sarson ka saag', photo: null, allergens: ['mustard'] },
  { id: 'boiled-egg', name: 'Boiled egg', photo: null, allergens: ['egg'] },
  { id: 'fish-curry-rice', name: 'Fish curry rice', photo: null, allergens: ['fish'] },
  // Twists: a food he already eats plus one new thing (from the interviews:
  // "I usually give variations of food he already likes"). They join "Foods he eats"
  // once he has them.
  { id: 'palak-cheela', name: 'Palak moong cheela', photo: 'palak-cheela', allergens: [], twistOf: 'cheela' },
  { id: 'carrot-poha', name: 'Poha with carrot', photo: 'carrot-poha', allergens: [], twistOf: 'poha' },
  { id: 'ragi-apple', name: 'Ragi porridge with apple', photo: 'ragi-apple', allergens: [], twistOf: 'ragi-porridge' },
  { id: 'carrot-curd-rice', name: 'Curd rice with carrot', photo: 'carrot-curd-rice', allergens: ['curd'], twistOf: 'curd-rice' },
  { id: 'banana-oats', name: 'Banana and oats mash', photo: 'banana', allergens: [], twistOf: 'banana' },
  { id: 'ragi-date', name: 'Ragi and date porridge', photo: 'ragi-date', allergens: [], twistOf: 'ragi-porridge' },
  { id: 'egg-khichdi', name: 'Egg khichdi', photo: 'egg-dal-rice', allergens: ['egg'], twistOf: 'khichdi' },
  { id: 'dal-rice-egg', name: 'Dal-rice with soft egg', photo: 'khichdi-bhurji', allergens: ['egg'], twistOf: 'dal-rice' },
  { id: 'paneer-peas-khichdi', name: 'Paneer and peas khichdi', photo: 'paneer-peas-khichdi', allergens: ['paneer'], twistOf: 'khichdi' },
  { id: 'paneer-bhurji-rice', name: 'Soft paneer bhurji with rice', photo: 'paneer-bhurji-rice', allergens: ['paneer'], twistOf: 'egg-bhurji-rice' },
  { id: 'palak-paneer-rice', name: 'Palak paneer rice', photo: 'palak-paneer-rice', allergens: ['paneer'], twistOf: 'palak-khichdi' },
];

/** The chips shown on W07 before she adds any of her own. */
export const STARTER_FOODS = ['dal-rice', 'khichdi', 'poha', 'idli', 'ragi-porridge', 'upma', 'curd-rice', 'banana', 'cheela'];

/** Shown in the add-food sheet before she types. */
export const POPULAR_SEARCH = ['ragi-laddoo', 'palak-khichdi', 'khichdi-balls', 'khichdi-bhindi', 'dosa', 'veg-pulao'];

/** Mock Google accounts on this phone (dummy). */
export const GOOGLE_ACCOUNTS = [
  { id: 'g1', name: 'Priya Kulkarni', email: 'priya.k@example.com', initial: 'P' },
  { id: 'g2', name: 'Rahul Kulkarni', email: 'rahul.k@example.com', initial: 'R' },
];

/**
 * What the server would return for "I already have an account".
 * Used only when a returning parent signs in on a fresh phone.
 */
export const RETURNING_PROFILE = {
  child: { name: 'Aarav', gender: 'boy', birth: { y: 2025, m: 3 } },
  allergies: ['peanut', 'mustard'],
  noKnownAllergies: false,
  customAllergies: [],
  rules: { sugar: true, salt: true, biscuits: false, outside: false },
  // Eggs appear in his ideas (Figma T09/T10), so the family diet is "Egg".
  diet: 'egg',
  cuisines: ['maharashtrian', 'mixed'],
  mixed: { text: 'Konkani at home, Punjabi on Sundays', regions: ['Konkani', 'Punjabi'] },
  foods: {
    list: [...STARTER_FOODS, 'palak-khichdi', 'egg-bhurji-rice', 'curd-rice-cucumber', 'khichdi-balls', 'ragi-malt'],
    selected: ['poha', 'khichdi', 'dal-rice', 'banana', 'curd-rice', 'idli', 'ragi-porridge', 'upma', 'cheela', 'palak-khichdi', 'egg-bhurji-rice', 'curd-rice-cucumber', 'khichdi-balls', 'ragi-malt'],
    custom: [],
  },
  // Eats well · sometimes · not now (Memory → Foods he eats)
  foodStatus: {
    poha: 'well', khichdi: 'well', 'dal-rice': 'well', banana: 'well', 'curd-rice': 'well', idli: 'well',
    'ragi-porridge': 'well', 'curd-rice-cucumber': 'well', 'khichdi-balls': 'well',
    upma: 'some', cheela: 'some', 'palak-khichdi': 'some',
    'egg-bhurji-rice': 'not', 'ragi-malt': 'not',
  },
  backup: { list: ['banana', 'curd-rice', 'idli'], selected: 'banana', picked: ['banana', 'curd-rice'], custom: [] },
  parentName: 'Deepali',
};

/* ==========================================================================
   Meals, ingredients and the recipe library (flows R2–R7)
   ========================================================================== */

export const MEALS = [
  { id: 'breakfast', name: 'Breakfast', icon: 'breakfast', hi: 'सुबह का नाश्ता', en: 'breakfast' },
  { id: 'lunch', name: 'Lunch', icon: 'lunch', hi: 'दोपहर का खाना', en: 'lunch' },
  { id: 'snack', name: 'Snack', icon: 'snack', hi: 'शाम का नाश्ता', en: 'snack' },
  { id: 'dinner', name: 'Dinner', icon: 'dinner', hi: 'रात का खाना', en: 'dinner' },
];

/** When each meal "is now", by the hour (24 h). */
export const MEAL_HOURS = { breakfast: [5, 11], lunch: [11, 15], snack: [15, 18], dinner: [18, 29] };

export const TIME_CHOICES = [
  { id: 10, name: '10 min' },
  { id: 20, name: '20 min' },
  { id: 30, name: '30 min or more' },
];

export const INGREDIENT_GROUPS = [
  { id: 'grains', name: 'Grains, dal and flour' },
  { id: 'veg', name: 'Vegetables' },
  { id: 'dairy', name: 'Dairy and eggs' },
  { id: 'fruit', name: 'Fruit' },
];

// `words` = what parents actually type or say: English, Hindi, Marathi (Latin and Devanagari).
export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', group: 'grains', words: ['rice', 'chawal', 'chaawal', 'bhat', 'bhaat', 'chaval', 'चावल', 'भात'] },
  { id: 'moong-dal', name: 'Moong dal', group: 'grains', words: ['moong', 'mung', 'moong dal', 'dal', 'daal', 'varan', 'मूंग', 'दाल', 'वरण'] },
  { id: 'toor-dal', name: 'Toor dal', group: 'grains', words: ['toor', 'tuvar', 'arhar', 'तूर', 'अरहर'] },
  { id: 'atta', name: 'Atta', group: 'grains', allergens: ['wheat'], words: ['atta', 'wheat flour', 'gehu', 'kanik', 'आटा', 'कणिक'] },
  { id: 'poha', name: 'Poha', group: 'grains', words: ['poha', 'pohe', 'flattened rice', 'पोहा', 'पोहे'] },
  { id: 'besan', name: 'Besan', group: 'grains', words: ['besan', 'gram flour', 'chickpea flour', 'बेसन'] },
  { id: 'rava', name: 'Rava', group: 'grains', allergens: ['wheat'], words: ['rava', 'sooji', 'suji', 'semolina', 'रवा', 'सूजी'] },
  { id: 'ragi', name: 'Ragi flour', group: 'grains', words: ['ragi', 'nachni', 'nachani', 'finger millet', 'रागी', 'नाचणी'] },
  { id: 'oats', name: 'Oats', group: 'grains', words: ['oats', 'oat', 'ओट्स'] },
  { id: 'carrot', name: 'Carrot', group: 'veg', words: ['carrot', 'gajar', 'gajjar', 'गाजर'] },
  { id: 'potato', name: 'Potato', group: 'veg', words: ['potato', 'aloo', 'alu', 'batata', 'आलू', 'बटाटा'] },
  { id: 'spinach', name: 'Spinach', group: 'veg', words: ['spinach', 'palak', 'palakh', 'पालक'] },
  { id: 'bhindi', name: 'Bhindi', group: 'veg', words: ['bhindi', 'okra', 'lady finger', 'ladyfinger', 'bhendi', 'भिंडी', 'भेंडी'] },
  { id: 'tomato', name: 'Tomato', group: 'veg', words: ['tomato', 'tamatar', 'tamater', 'टमाटर'] },
  { id: 'peas', name: 'Peas', group: 'veg', words: ['peas', 'pea', 'matar', 'mattar', 'vatana', 'मटर', 'वाटाणा'] },
  { id: 'cucumber', name: 'Cucumber', group: 'veg', words: ['cucumber', 'kheera', 'khira', 'kakdi', 'kakadi', 'खीरा', 'काकडी'] },
  { id: 'curd', name: 'Curd', group: 'dairy', allergens: ['curd'], words: ['curd', 'dahi', 'yogurt', 'yoghurt', 'दही'] },
  { id: 'milk', name: 'Milk', group: 'dairy', allergens: ['milk'], words: ['milk', 'doodh', 'dudh', 'दूध'] },
  { id: 'eggs', name: 'Eggs', group: 'dairy', allergens: ['egg'], diet: 'egg', words: ['egg', 'eggs', 'anda', 'ande', 'अंडा', 'अंडे'] },
  { id: 'paneer', name: 'Paneer', group: 'dairy', allergens: ['paneer'], words: ['paneer', 'cottage cheese', 'पनीर'] },
  { id: 'ghee', name: 'Ghee', group: 'dairy', allergens: ['ghee'], words: ['ghee', 'tup', 'घी', 'तूप'] },
  { id: 'banana', name: 'Banana', group: 'fruit', words: ['banana', 'kela', 'keli', 'केला', 'केळी'] },
  { id: 'apple', name: 'Apple', group: 'fruit', words: ['apple', 'seb', 'safarchand', 'सेब', 'सफरचंद'] },
  { id: 'papaya', name: 'Papaya', group: 'fruit', words: ['papaya', 'papita', 'पपीता'] },
  { id: 'chikoo', name: 'Chikoo', group: 'fruit', words: ['chikoo', 'chiku', 'sapota', 'चीकू'] },
  { id: 'dates', name: 'Dates', group: 'fruit', words: ['dates', 'date', 'khajur', 'khajoor', 'खजूर'] },
];

/** Request words that are not ingredients: how she wants it. */
export const REQUEST_FLAGS = {
  soft: ['soft', 'mash', 'mashed', 'teeth', 'teething', 'naram', 'narm', 'मऊ', 'नरम'],
  finger: ['finger food', 'finger', 'hold', 'self feed', 'self-feed', 'blw'],
  quick: ['quick', 'fast', 'jaldi', 'lavkar', 'easy', '5 min', '10 min', 'जल्दी'],
  sweet: ['sweet', 'meetha', 'mitha', 'god', 'गोड', 'मीठा'],
  noCook: ['no cooking', 'no cook', 'without cooking', 'bina pakaye', 'no gas'],
  light: ['light', 'halka', 'sick', 'unwell', 'cold', 'cough', 'fever'],
};
export const REQUEST_NEGATIONS = ['no', 'without', 'not', 'bina', 'except', 'nahi', 'nako'];

/** Ticked by default for a new parent; she unticks what she does not keep. */
/** How much to buy, for the shopping list (not the toddler portion). */
export const BUY_QTY = {
  rice: '1 kg', 'moong-dal': '500 g', 'toor-dal': '500 g', atta: '1 kg', poha: '500 g', besan: '500 g', rava: '500 g', ragi: '500 g', oats: '500 g',
  carrot: '4', potato: '1 kg', spinach: '1 bunch', bhindi: '250 g', tomato: '4', peas: '250 g', cucumber: '2',
  curd: '500 g', milk: '1 litre', eggs: '6', paneer: '200 g', ghee: '200 g', banana: '6', apple: '4', papaya: '1', chikoo: '4', dates: '200 g',
};

export const DEFAULT_USUAL = ['rice', 'moong-dal', 'atta', 'poha', 'carrot', 'potato', 'tomato', 'curd', 'milk', 'ghee', 'banana'];
export const RETURNING_USUAL = ['rice', 'moong-dal', 'eggs', 'carrot', 'curd', 'atta', 'poha', 'potato', 'bhindi', 'tomato', 'milk', 'ghee', 'banana', 'ragi'];

/**
 * Recipes. `needs` = ingredient ids that must be at home; `diet` = lowest diet
 * that allows it (veg < egg < nonveg); `groups` feed Memory → Food groups.
 * Toddler notes are general feeding tips, not medical advice.
 */
export const RECIPES = [
  {
    id: 'veg-khichdi', name: 'Vegetable khichdi', hi: 'सब्ज़ी वाली खिचड़ी', photo: 'khichdi', mins: 15,
    meta: 'One pot', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal', 'carrot', 'peas'], allergens: [], diet: 'veg',
    tags: ['onePot', 'soft'], groups: ['grains', 'dal', 'veg'], food: 'khichdi',
    tip: 'mash it soft. Take his part out before salt or spice.',
    ingredients: [['rice', 'Rice', '½ cup'], ['moong-dal', 'Moong dal', '¼ cup'], ['carrot', 'Carrot, chopped', '1 small'], ['peas', 'Peas', '2 tbsp'], ['ghee', 'Ghee', '1 tsp'], ['turmeric', 'Turmeric', 'a pinch']],
    swaps: { carrot: 'peas', peas: 'carrot' },
    steps: ['Wash the rice and moong dal 2 to 3 times.', 'Pressure cook with carrot, peas, turmeric and 2 cups of water for 3 whistles.', 'Take out his part. Mash it soft and add a little ghee.', 'Add salt and tadka to the rest for the family.'],
  },
  {
    id: 'curd-rice-cucumber', name: 'Curd rice with cucumber', hi: 'खीरे वाला दही-चावल', photo: 'curd-rice-cucumber', mins: 5,
    meta: 'No cooking', meals: ['lunch', 'dinner', 'snack'], needs: ['rice', 'curd'], allergens: ['curd'], diet: 'veg',
    tags: ['noCook', 'soft', 'cool'], groups: ['grains', 'dairy', 'veg'], food: 'curd-rice-cucumber',
    tip: 'use rice cooked today and cooled to warm, never leftover rice. Grate the cucumber fine.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['curd', 'Fresh curd', '3 tbsp'], ['cucumber', 'Cucumber, grated', '2 tbsp']],
    steps: ['Mash the cooked rice lightly with a spoon.', 'Mix in the curd until it is creamy.', 'Stir in the grated cucumber and serve at room temperature.'],
  },
  {
    id: 'soft-dal-rice', name: 'Soft dal-rice', hi: 'नरम दाल-चावल', photo: 'dal-rice', mins: 10,
    meta: 'Same as family', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal'], allergens: [], diet: 'veg',
    tags: ['soft', 'sameFamily'], groups: ['grains', 'dal'], food: 'dal-rice',
    tip: 'take his dal out before the tadka. Mash it with the rice.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['moong-dal', 'Cooked moong dal', '¼ cup'], ['ghee', 'Ghee', '½ tsp']],
    steps: ['Take his dal out before the tadka.', 'Mash the rice and dal together until soft.', 'Add a little ghee and serve warm.'],
  },
  {
    id: 'moong-cheela', name: 'Moong dal cheela', hi: 'मूंग दाल चीला', photo: 'cheela', mins: 15,
    meta: 'Soft, he can hold it', meals: ['breakfast', 'dinner', 'snack'], needs: ['moong-dal'], allergens: [], diet: 'veg',
    tags: ['finger'], groups: ['dal'], food: 'cheela', prep: 'Soak moong dal before bed', prepShort: 'Soak dal tonight',
    tip: 'cook it thin and soft, then cut into strips he can hold.',
    ingredients: [['moong-dal', 'Moong dal, soaked', '¼ cup'], ['carrot', 'Carrot, grated', '1 tbsp'], ['ghee', 'Ghee', '1 tsp']],
    steps: ['Grind the soaked moong dal with a little water into a smooth batter.', 'Stir in the grated carrot.', 'Spread thin on a hot tawa with a little ghee and cook both sides.', 'Cool and cut into strips he can hold.'],
  },
  {
    id: 'poha-peas', name: 'Poha with peas', hi: 'मटर वाला पोहा', photo: 'poha', mins: 10,
    meta: 'No prep', meals: ['breakfast', 'dinner', 'snack'], needs: ['poha', 'peas'], allergens: [], diet: 'veg',
    tags: ['quick'], groups: ['grains', 'veg'], food: 'poha',
    tip: 'make his part without peanuts or chilli and keep it soft.',
    ingredients: [['poha', 'Poha', '½ cup'], ['peas', 'Peas', '2 tbsp'], ['turmeric', 'Turmeric', 'a pinch'], ['ghee', 'Ghee', '1 tsp']],
    steps: ['Rinse the poha and let it soften for 2 minutes.', 'Cook the peas in a little ghee with turmeric until soft.', 'Mix in the poha and cook for 2 minutes. Mash his part lightly.'],
  },
  {
    id: 'ragi-porridge', name: 'Ragi porridge', hi: 'रागी दलिया', photo: 'ragi-porridge', mins: 7,
    meta: 'No chopping', meals: ['breakfast', 'snack'], needs: ['ragi'], allergens: [], diet: 'veg',
    tags: ['soft', 'quick'], groups: ['grains'], food: 'ragi-porridge',
    tip: 'make it smooth and let it cool to warm before serving.',
    ingredients: [['ragi', 'Ragi flour', '2 tbsp'], ['water', 'Water', '¾ cup'], ['banana', 'Ripe banana, mashed', '¼']],
    steps: ['Mix the ragi flour in cold water with no lumps.', 'Cook on low heat, stirring, for 5 minutes until thick.', 'Cool a little and stir in the mashed banana.'],
  },
  {
    id: 'veg-upma', name: 'Vegetable upma', hi: 'सब्ज़ी उपमा', photo: 'upma', mins: 15,
    meta: 'No prep', meals: ['breakfast', 'dinner'], needs: ['rava', 'carrot', 'peas'], allergens: ['wheat'], diet: 'veg',
    tags: ['quick', 'soft'], groups: ['grains', 'veg'], food: 'upma',
    tip: 'add a little more water so it stays soft.',
    ingredients: [['rava', 'Rava', '¼ cup'], ['carrot', 'Carrot, chopped fine', '1 tbsp'], ['peas', 'Peas', '1 tbsp'], ['ghee', 'Ghee', '1 tsp']],
    steps: ['Roast the rava in ghee until it smells nutty.', 'Add the vegetables and 1 cup of hot water.', 'Stir until thick and soft. Mash the peas lightly for him and cool before serving.'],
  },
  {
    id: 'idli-dal', name: 'Soft idli with a little dal', hi: 'दाल के साथ नरम इडली', photo: 'idli', mins: 5,
    meta: 'Use the family’s idli, dip it in dal', meals: ['breakfast', 'lunch', 'dinner'], needs: ['moong-dal'], allergens: [], diet: 'veg',
    tags: ['soft', 'sameFamily'], groups: ['grains', 'dal'], food: 'idli', familyOnly: true,
    tip: 'tear the idli into small pieces and soak them in warm dal.',
    ingredients: [['idli', 'Idli from the family', '1 to 2'], ['moong-dal', 'Plain dal or sambar without chilli', '3 tbsp']],
    steps: ['Take 1 or 2 idlis before any chutney.', 'Tear into small pieces.', 'Pour warm dal over them and let them soak for a minute.'],
  },
  {
    id: 'banana-oats', name: 'Banana and oats mash', hi: 'केला और ओट्स', photo: 'banana', mins: 5,
    meta: 'Soft · Naturally sweet', meals: ['breakfast', 'snack'], needs: ['banana', 'oats'], allergens: [], diet: 'veg',
    tags: ['soft', 'quick', 'sweet'], groups: ['grains', 'fruit'], food: 'banana-oats', adds: 'oats',
    tip: 'no sugar needed; ripe banana is sweet enough.',
    ingredients: [['oats', 'Oats', '2 tbsp'], ['banana', 'Ripe banana', '½'], ['water', 'Water', '½ cup']],
    steps: ['Cook the oats in water for 3 minutes until soft.', 'Mash the banana and stir it in.', 'Serve warm.'],
  },
  {
    id: 'ragi-date', name: 'Ragi and date porridge', hi: 'रागी और खजूर दलिया', photo: 'ragi-date', mins: 10,
    meta: 'Made with water', meals: ['breakfast', 'snack'], needs: ['ragi', 'dates'], allergens: [], diet: 'veg',
    tags: ['soft', 'sweet'], groups: ['grains', 'fruit'], food: 'ragi-date', adds: 'dates',
    tip: 'blend the soaked dates smooth so there are no pieces.',
    ingredients: [['ragi', 'Ragi flour', '2 tbsp'], ['dates', 'Dates, soaked', '2'], ['water', 'Water', '¾ cup']],
    steps: ['Blend the soaked dates with a little water.', 'Cook the ragi in water, stirring, for 5 minutes.', 'Stir in the date paste and cool to warm.'],
  },
  {
    id: 'egg-khichdi', name: 'Egg khichdi', hi: 'अंडा खिचड़ी', photo: 'egg-dal-rice', mins: 20,
    meta: 'Soft · Uses your eggs and carrot', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal', 'eggs', 'carrot'], allergens: ['egg'], diet: 'egg',
    tags: ['soft', 'onePot'], groups: ['grains', 'dal', 'egg', 'veg'], food: 'egg-khichdi', adds: 'eggs',
    tip: 'cook the egg fully and break it into small soft pieces.',
    ingredients: [['rice', 'Rice', '¼ cup'], ['moong-dal', 'Moong dal', '2 tbsp'], ['eggs', 'Egg', '1'], ['carrot', 'Carrot, grated', '1 tbsp']],
    steps: ['Pressure cook rice, dal and carrot until very soft.', 'Scramble the egg fully in a little ghee.', 'Mix the egg into his khichdi and mash lightly.'],
  },
  {
    id: 'dal-rice-egg', name: 'Dal-rice with soft egg', hi: 'अंडे के साथ दाल-चावल', photo: 'khichdi-bhurji', mins: 15,
    meta: 'Soft', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal', 'eggs'], allergens: ['egg'], diet: 'egg',
    tags: ['soft'], groups: ['grains', 'dal', 'egg'], food: 'dal-rice-egg', adds: 'eggs',
    tip: 'cook the egg through and crumble it small.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['moong-dal', 'Cooked dal', '¼ cup'], ['eggs', 'Egg', '1']],
    steps: ['Scramble the egg until fully cooked.', 'Mash the dal and rice together.', 'Serve the egg crumbled on the side.'],
  },
  {
    id: 'egg-bhurji-rice', name: 'Egg bhurji with rice', hi: 'अंडा भुर्जी और चावल', photo: 'egg-bhurji-rice', mins: 10,
    meta: 'Easy to chew', meals: ['breakfast', 'lunch', 'dinner'], needs: ['eggs', 'rice'], allergens: ['egg'], diet: 'egg',
    tags: ['quick'], groups: ['grains', 'egg'], food: 'egg-bhurji-rice',
    tip: 'no chilli in his part; cook the egg fully.',
    ingredients: [['eggs', 'Egg', '1'], ['tomato', 'Tomato, chopped fine', '1 tbsp'], ['rice', 'Rice, cooked today', '¼ cup']],
    steps: ['Cook the tomato in a little ghee until soft.', 'Add the beaten egg and stir until fully cooked.', 'Serve with soft rice.'],
  },
  {
    id: 'paneer-bhurji-rice', name: 'Soft paneer bhurji with rice', hi: 'पनीर भुर्जी और चावल', photo: 'paneer-bhurji-rice', mins: 15,
    meta: 'Soft · Grate the paneer fine', meals: ['lunch', 'dinner'], needs: ['paneer', 'rice'], allergens: ['paneer'], diet: 'veg',
    tags: ['soft', 'paneer'], groups: ['grains', 'dairy'], food: 'paneer-bhurji-rice', adds: 'paneer',
    tip: 'grate the paneer fine so it is easy to chew.',
    ingredients: [['paneer', 'Paneer, grated', '3 tbsp'], ['tomato', 'Tomato, chopped fine', '1 tbsp'], ['rice', 'Rice, cooked today', '¼ cup']],
    steps: ['Soften the tomato in a little ghee.', 'Add the grated paneer and cook for 2 minutes.', 'Serve with soft rice.'],
  },
  {
    id: 'palak-paneer-rice', name: 'Palak paneer rice', hi: 'पालक पनीर चावल', photo: 'palak-paneer-rice', mins: 20,
    meta: 'Soft · Same as family', meals: ['lunch', 'dinner'], needs: ['spinach', 'paneer', 'rice'], allergens: ['paneer'], diet: 'veg',
    tags: ['soft', 'paneer', 'sameFamily'], groups: ['grains', 'dairy', 'veg'], food: 'palak-paneer-rice', adds: 'paneer',
    tip: 'blend the palak smooth and crumble the paneer small.',
    ingredients: [['spinach', 'Spinach', '1 handful'], ['paneer', 'Paneer, crumbled', '2 tbsp'], ['rice', 'Rice, cooked today', '½ cup']],
    steps: ['Blanch and blend the spinach.', 'Cook it with the crumbled paneer for 2 minutes.', 'Mix with soft rice.'],
  },
  {
    id: 'paneer-peas-khichdi', name: 'Paneer and peas khichdi', hi: 'पनीर मटर खिचड़ी', photo: 'paneer-peas-khichdi', mins: 20,
    meta: 'One pot', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal', 'paneer', 'peas'], allergens: ['paneer'], diet: 'veg',
    tags: ['onePot', 'paneer', 'soft'], groups: ['grains', 'dal', 'dairy', 'veg'], food: 'paneer-peas-khichdi', adds: 'paneer',
    tip: 'add the paneer at the end and mash the peas.',
    ingredients: [['rice', 'Rice', '¼ cup'], ['moong-dal', 'Moong dal', '2 tbsp'], ['paneer', 'Paneer, crumbled', '2 tbsp'], ['peas', 'Peas', '2 tbsp']],
    steps: ['Pressure cook the rice, dal and peas until soft.', 'Stir in the crumbled paneer.', 'Mash his part and serve warm.'],
  },
  {
    id: 'palak-dal-rice', name: 'Palak dal-rice', hi: 'पालक दाल-चावल', photo: 'palak-khichdi', mins: 20,
    meta: 'Adds spinach', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal', 'spinach'], allergens: [], diet: 'veg',
    tags: ['soft', 'onePot'], groups: ['grains', 'dal', 'veg'], food: 'palak-khichdi',
    tip: 'blend the spinach so there are no leaves to chew.',
    ingredients: [['rice', 'Rice', '¼ cup'], ['moong-dal', 'Moong dal', '2 tbsp'], ['spinach', 'Spinach, blended', '1 handful']],
    steps: ['Pressure cook rice and dal until soft.', 'Stir in the blended spinach and cook 2 minutes.', 'Mash and serve warm.'],
  },
  {
    id: 'dal-rice-balls', name: 'Dal-rice balls he can hold', hi: 'दाल-चावल के लड्डू', photo: 'khichdi-balls', mins: 10,
    meta: 'Finger food', meals: ['lunch', 'dinner', 'snack'], needs: ['rice', 'moong-dal'], allergens: [], diet: 'veg',
    tags: ['finger'], groups: ['grains', 'dal'], food: 'khichdi-balls',
    tip: 'make the balls small and soft enough to squash between your fingers.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['moong-dal', 'Thick cooked dal', '3 tbsp']],
    steps: ['Mash the rice and thick dal together.', 'Roll into small balls with wet hands.', 'Let him pick them up himself.'],
  },
  {
    id: 'dal-rice-bhindi', name: 'Soft dal-rice with bhindi', hi: 'भिंडी के साथ नरम दाल-चावल', photo: 'khichdi-bhindi', mins: 5,
    meta: 'Easiest · no extra cooking', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal', 'bhindi'], allergens: [], diet: 'veg',
    tags: ['soft', 'sameFamily'], groups: ['grains', 'dal', 'veg'], food: 'dal-rice', familyOnly: true,
    tip: 'take his dal out before the tadka. Mash with rice; serve bhindi soft and small.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['moong-dal', 'Dal, before tadka', '¼ cup'], ['bhindi', 'Bhindi, soft pieces', '2 tbsp']],
    steps: ['Take his dal out before the tadka.', 'Mash the dal with the rice.', 'Cut a little soft bhindi into small pieces on the side.'],
  },
  {
    id: 'roti-sabzi-curd', name: 'Roti, sabzi and curd', hi: 'रोटी, सब्ज़ी और दही', photo: 'cuisine-north-indian', mins: 5,
    meta: 'Same as family', meals: ['lunch', 'dinner'], needs: ['atta', 'curd'], allergens: ['wheat', 'curd'], diet: 'veg',
    tags: ['sameFamily', 'finger'], groups: ['grains', 'veg', 'dairy'], food: null,
    tip: 'tear the roti into strips and soak them in curd or dal.',
    ingredients: [['atta', 'Soft roti', '1'], ['potato', 'Sabzi, mashed (no chilli)', '2 tbsp'], ['curd', 'Curd', '2 tbsp']],
    steps: ['Take his sabzi out before chilli.', 'Tear the roti into strips.', 'Serve with curd to dip.'],
  },
  {
    id: 'moong-khichdi', name: 'Moong dal khichdi', hi: 'मूंग दाल खिचड़ी', photo: 'moong-khichdi', mins: 20,
    meta: 'One pot', meals: ['lunch', 'dinner'], needs: ['rice', 'moong-dal'], allergens: [], diet: 'veg',
    tags: ['onePot', 'soft'], groups: ['grains', 'dal'], food: 'khichdi',
    tip: 'cook it soft and mash his part.',
    ingredients: [['rice', 'Rice', '¼ cup'], ['moong-dal', 'Moong dal', '¼ cup'], ['ghee', 'Ghee', '1 tsp']],
    steps: ['Wash rice and dal.', 'Pressure cook with 2 cups of water for 3 whistles.', 'Mash his part with ghee.'],
  },
  {
    id: 'plain-curd-rice', name: 'Curd-rice', hi: 'दही-चावल', photo: 'curd-rice', mins: 5,
    meta: 'No cooking', meals: ['lunch', 'dinner', 'snack'], needs: ['rice', 'curd'], allergens: ['curd'], diet: 'veg',
    tags: ['noCook', 'soft', 'cool'], groups: ['grains', 'dairy'], food: 'curd-rice',
    tip: 'use rice cooked today, never leftover rice. Mash it well and serve cool, not cold.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['curd', 'Fresh curd', '3 tbsp']],
    steps: ['Mash the rice.', 'Mix in the curd.', 'Serve at room temperature.'],
  },
  {
    id: 'mashed-banana', name: 'Mashed banana', hi: 'मसला हुआ केला', photo: 'mashed-banana', mins: 2,
    meta: 'No cooking', meals: ['breakfast', 'snack'], needs: ['banana'], allergens: [], diet: 'veg',
    tags: ['noCook', 'soft', 'quick'], groups: ['fruit'], food: 'banana',
    tip: 'a ripe banana with brown spots mashes smooth.',
    ingredients: [['banana', 'Ripe banana', '1']],
    steps: ['Peel and mash with a fork.', 'Serve straight away.'],
  },
  /* ---- Twists: same base and method as a food he accepts, plus ONE new ingredient ---- */
  {
    id: 'palak-cheela', name: 'Palak moong cheela', hi: 'पालक मूंग चीला', photo: 'palak-cheela', mins: 15,
    meta: 'Soft, he can hold it', meals: ['breakfast', 'dinner', 'snack'], needs: ['moong-dal', 'spinach'], allergens: [], diet: 'veg',
    tags: ['finger'], groups: ['dal', 'veg'], food: 'palak-cheela', adds: 'spinach', prep: 'Soak moong dal before bed', prepShort: 'Soak dal tonight',
    tip: 'blend the palak into the batter so there are no leaves to chew.',
    ingredients: [['moong-dal', 'Moong dal, soaked', '¼ cup'], ['spinach', 'Spinach, blanched', 'a small handful'], ['ghee', 'Ghee', '1 tsp']],
    steps: ['Blanch the spinach for 1 minute.', 'Grind it with the soaked moong dal into a smooth batter.', 'Spread thin on a hot tawa with a little ghee and cook both sides.', 'Cool and cut into strips he can hold.'],
  },
  {
    id: 'carrot-poha', name: 'Poha with carrot', hi: 'गाजर वाला पोहा', photo: 'carrot-poha', mins: 10,
    meta: 'No prep', meals: ['breakfast', 'snack', 'dinner'], needs: ['poha', 'carrot'], allergens: [], diet: 'veg',
    tags: ['quick', 'soft'], groups: ['grains', 'veg'], food: 'carrot-poha', adds: 'carrot',
    tip: 'grate the carrot fine and cook it soft before adding the poha.',
    ingredients: [['poha', 'Poha', '½ cup'], ['carrot', 'Carrot, grated fine', '2 tbsp'], ['turmeric', 'Turmeric', 'a pinch'], ['ghee', 'Ghee', '1 tsp']],
    steps: ['Rinse the poha and let it soften for 2 minutes.', 'Cook the grated carrot in a little ghee with turmeric until soft.', 'Mix in the poha and cook for 2 minutes. Mash his part lightly.'],
  },
  {
    id: 'ragi-apple', name: 'Ragi porridge with apple', hi: 'सेब वाला रागी दलिया', photo: 'ragi-apple', mins: 10,
    meta: 'Naturally sweet', meals: ['breakfast', 'snack'], needs: ['ragi', 'apple'], allergens: [], diet: 'veg',
    tags: ['soft', 'sweet'], groups: ['grains', 'fruit'], food: 'ragi-apple', adds: 'apple',
    tip: 'stew the apple until it mashes with a spoon; no sugar needed.',
    ingredients: [['ragi', 'Ragi flour', '2 tbsp'], ['apple', 'Apple, peeled and chopped', '¼'], ['water', 'Water', '1 cup']],
    steps: ['Cook the chopped apple in a little water until very soft, then mash.', 'Mix the ragi flour in cold water with no lumps.', 'Cook on low heat, stirring, for 5 minutes.', 'Stir in the apple and cool to warm.'],
  },
  {
    id: 'carrot-curd-rice', name: 'Curd rice with carrot', hi: 'गाजर वाला दही-चावल', photo: 'carrot-curd-rice', mins: 7,
    meta: 'Cool and soft', meals: ['lunch', 'dinner', 'snack'], needs: ['rice', 'curd', 'carrot'], allergens: ['curd'], diet: 'veg',
    tags: ['soft', 'cool'], groups: ['grains', 'dairy', 'veg'], food: 'carrot-curd-rice', adds: 'carrot',
    tip: 'steam the grated carrot for 2 minutes so it is soft.',
    ingredients: [['rice', 'Rice, cooked today', '½ cup'], ['curd', 'Fresh curd', '3 tbsp'], ['carrot', 'Carrot, grated and steamed', '1 tbsp']],
    steps: ['Steam the grated carrot for 2 minutes.', 'Mash the cooked rice lightly and mix in the curd.', 'Stir in the carrot and serve at room temperature.'],
  },
];

/**
 * Prep worth doing the night before: only steps that take real time (soak, chop, cut,
 * grate, shell, knead, roast, clean greens, set curd). Dishes with none get no step.
 * `prep` on a recipe = must do (soaking); `ahead` = nice to do (cut, wash, set curd).
 * Shown on Today the evening before a planned meal.
 */
export const AHEAD = {
  'veg-khichdi': 'Chop the carrot and shell the peas. Keep them covered in the fridge.',
  'curd-rice-cucumber': 'Set fresh curd.',
  'poha-peas': 'Shell the peas and keep them covered in the fridge.',
  'veg-upma': 'Dry-roast the rava and keep it in a jar. Chop the carrot and keep it covered in the fridge.',
  'ragi-date': 'Soak 2 dates in water in the fridge before bed.',
  'egg-khichdi': 'Grate the carrot and keep it covered in the fridge.',
  'egg-bhurji-rice': 'Chop the tomato fine and keep it covered in the fridge.',
  'paneer-bhurji-rice': 'Grate the paneer and keep it covered in the fridge.',
  'palak-paneer-rice': 'Wash the spinach and keep it wrapped in a cloth in the fridge.',
  'paneer-peas-khichdi': 'Shell the peas and keep them covered in the fridge.',
  'palak-dal-rice': 'Wash and dry the spinach. Keep it wrapped in the fridge.',
  'roti-sabzi-curd': 'Cut the sabzi vegetables and knead the atta. Keep both covered in the fridge, and set the curd.',
  'plain-curd-rice': 'Set fresh curd.',
  'carrot-poha': 'Grate the carrot and keep it covered in the fridge.',
  'carrot-curd-rice': 'Grate the carrot, keep it covered in the fridge, and set fresh curd.',
  'idli-dal': 'Soak the idli rice and dal for the batter.',
  'dal-rice-bhindi': 'Wash and cut the bhindi. Dry it well so it is not sticky.',
};
// Dates need soaking for a smooth paste: a must-do, like moong dal for cheela.
RECIPES.forEach((r) => {
  if (r.id === 'ragi-date') { r.prep = 'Soak 2 dates before bed'; r.prepShort = 'Soak dates tonight'; }
  // No step for dishes that need no real prep (no filler like "check you have it").
  r.ahead = r.prep || AHEAD[r.id] || null;
});

/** Dishes she often cooks (T07 chips). `plate` = his version. */
export const FAMILY_DISHES = [
  { id: 'dal-rice', name: 'Dal-rice', photo: 'dal-rice' },
  { id: 'khichdi', name: 'Khichdi', photo: 'khichdi' },
  { id: 'poha', name: 'Poha', photo: 'poha' },
  { id: 'upma', name: 'Upma', photo: 'upma' },
  { id: 'roti-sabzi', name: 'Roti-sabzi', photo: 'cuisine-north-indian' },
];

/**
 * How the family's dinner becomes his plate. First rule whose words match wins.
 * feature = easiest version; more = two variations for a little more time.
 */
export const FAMILY_RULES = [
  { words: ['idli', 'dosa', 'sambar'], title: 'Idli', feature: 'idli-dal', more: ['dal-rice-balls', 'plain-curd-rice'] },
  { words: ['bhindi'], title: 'Dal-rice', feature: 'dal-rice-bhindi', more: ['dal-rice-balls', 'palak-dal-rice'] },
  { words: ['khichdi', 'khichri'], title: 'Khichdi', feature: 'veg-khichdi', more: ['dal-rice-balls', 'palak-dal-rice'] },
  { words: ['dal', 'chawal', 'rice', 'varan', 'bhat'], title: 'Dal-rice', feature: 'soft-dal-rice', more: ['dal-rice-balls', 'palak-dal-rice'] },
  { words: ['poha'], title: 'Poha', feature: 'poha-peas', more: ['mashed-banana', 'ragi-porridge'] },
  { words: ['upma', 'rava', 'sooji', 'suji'], title: 'Upma', feature: 'veg-upma', more: ['poha-peas', 'mashed-banana'] },
  { words: ['paneer'], title: 'Paneer', feature: 'paneer-bhurji-rice', more: ['palak-paneer-rice', 'paneer-peas-khichdi'] },
  { words: ['egg', 'anda', 'omelette'], title: 'Egg', feature: 'egg-bhurji-rice', more: ['dal-rice-egg', 'egg-khichdi'] },
  { words: ['roti', 'chapati', 'sabzi', 'paratha', 'phulka', 'bhakri'], title: 'Roti-sabzi', feature: 'roti-sabzi-curd', more: ['soft-dal-rice', 'dal-rice-balls'] },
];

/** Words in her text that point to an allergen (English, Hindi, Marathi). */
export const ALLERGEN_WORDS = {
  peanut: ['peanut', 'groundnut', 'mungfali', 'moongphali', 'shengdana', 'singdana'],
  milk: ['milk', 'doodh', 'dudh', 'cheese', 'khoa', 'malai', 'butter', 'kheer', 'दूध'],
  curd: ['curd', 'dahi', 'yogurt', 'yoghurt', 'raita', 'lassi', 'chaas', 'buttermilk', 'shrikhand', 'दही'],
  paneer: ['paneer', 'chhena', 'पनीर'],
  ghee: ['ghee', 'tup', 'घी', 'तूप'],
  egg: ['egg', 'anda', 'omelette'],
  wheat: ['wheat', 'atta', 'roti', 'chapati', 'paratha', 'rava', 'sooji', 'suji', 'maida', 'bread', 'pasta', 'noodle', 'maggi', 'biscuit', 'cake', 'pav', 'bun', 'naan', 'kulcha', 'puri', 'dalia', 'semolina', 'upma', 'sevai', 'vermicelli'],
  mustard: ['mustard', 'sarson', 'rai'],
  treenuts: ['cashew', 'kaju', 'badam', 'almond', 'walnut', 'akhrot', 'pista'],
  sesame: ['sesame', 'til'],
  soy: ['soy', 'soya'],
  fish: ['fish', 'machli', 'macchi'],
  shellfish: ['prawn', 'shrimp', 'crab', 'jhinga'],
  coconut: ['coconut', 'nariyal'],
  corn: ['corn', 'makka', 'bhutta'],
};

/** "Ask for something specific" quick picks (T05s). */
export const REQUEST_PICKS = ['Something with palak', 'No rice tonight', 'Extra soft, he is teething', 'Finger food', 'Sweet, but no sugar'];

/** He did not eat → optional reasons (K05) and what changes (K05b). */
export const REFUSAL_REASONS = [
  { id: 'full', name: 'Full', title: 'He may just be full', body: 'Small appetites are normal at his age. Offer water and try again at the next meal.', action: 'done' },
  { id: 'tired', name: 'Tired', title: 'Keep it easy tonight', body: 'Tired toddlers eat less. A few bites of something he loves is enough.', action: 'backup' },
  { id: 'teething', name: 'Teething', title: 'Try something soft and cool', body: 'Chewing can hurt. Curd-rice or mashed banana may be easier today.', action: 'recipe', recipe: 'plain-curd-rice', safeAlt: 'mashed-banana' },
  { id: 'unwell', name: 'Unwell', title: 'Keep it light and give fluids', body: 'Offer small sips often. Food can wait a little while he feels better.', action: 'done' },
  { id: 'unsure', name: 'Not sure', title: 'That’s okay. Try this.', body: 'Toddlers often refuse food they ate before.', action: null },
];

/** "Serve it a different way" (K06). */
export const SERVE_WAYS = [
  { id: 'balls', name: 'Make small balls', sub: 'He can pick them up himself', icon: 'balls', meal: 'breakfast' },
  { id: 'dal', name: 'Give dal on the side', sub: 'Let him dip or drink it', icon: 'dalSide', meal: 'lunch' },
  { id: 'curd', name: 'Mix in a spoon of curd', sub: 'Softer and milder', icon: 'spoon', meal: 'snack', allergens: ['curd'] },
  { id: 'mash', name: 'Mash it smoother', sub: 'Easier to swallow', icon: 'spoon', meal: 'snack', fallbackFor: 'curd' },
];

/* ==========================================================================
   Learn (LN01, LN02). General guidance; sources named on every article.
   ========================================================================== */
export const ARTICLES = [
  {
    id: 'eats-less', title: 'Why he eats less on some days', tag: 'Common at his age', read: '3 min read', mood: 'calm', tint: 'dinner', featured: true,
    intro: ['After the first birthday, growth slows down, so toddlers often need less food than parents expect.', 'It is normal for him to eat well one day and very little the next. Look at the whole week, not one meal.'],
    tips: ['Serve small portions; he can always ask for more', 'Keep regular meal and snack times', 'Offer water between meals, milk with meals', 'Let him decide how much to eat'],
    doctor: 'Talk to his doctor if he seems unwell, is losing weight, or refuses most food for many days.',
  },
  {
    id: 'teething', title: 'Teething can stop him eating', short: 'Teething can stop him eating', icon: 'tooth', tint: 'snack', read: '2 min read', mood: 'calm',
    intro: ['Sore gums can make chewing hurt for a few days.', 'He may prefer soft, cool foods and eat less for a while.'],
    tips: ['Offer soft, cool food like curd-rice or mashed banana', 'Give a clean, cool teething ring before meals', 'Avoid hard or crunchy food for a few days', 'Do not use numbing gels unless his doctor says so'],
    doctor: 'Call his doctor if he has a high fever, will not drink, or seems very unwell. Teething does not cause high fever.',
  },
  {
    id: 'self-feeding', title: 'He wants to feed himself', short: 'He wants to feed himself', icon: 'hand', tint: 'breakfast', read: '2 min read', mood: 'happy',
    intro: ['Wanting to hold the spoon is a good sign of growing skills.', 'It will be messy for a while, and that is part of learning.'],
    tips: ['Give finger foods like soft cheela strips or small idli pieces', 'Let him hold a spoon while you feed with another', 'Put a mat under his chair to make clean-up easy', 'Stay with him the whole time he eats'],
    doctor: 'Always sit with him while he eats. Avoid whole nuts, whole grapes and hard pieces that can cause choking.',
  },
  {
    id: 'meals-longer', title: 'Meals take longer now', short: 'Meals take longer now', icon: 'clock', tint: 'dinner', read: '2 min read', mood: 'calm',
    intro: ['Toddlers are curious and easily distracted, so meals can stretch on.', 'A calm, short mealtime usually works better than a long one.'],
    tips: ['Keep meals to about 20 to 30 minutes', 'Turn off the TV and phones at the table', 'Eat together when you can', 'End the meal calmly when he stops eating'],
    doctor: 'Talk to his doctor if he often coughs, gags or seems to struggle to swallow.',
  },
  {
    id: 'refused-liked', title: 'He refused food he liked before', read: '2 min read', mood: 'calm', tint: 'dinner',
    intro: ['Very common between 1 and 3 years. Growth slows after the first birthday, so appetite drops.', 'A food he refuses today is often eaten again next week.'],
    tips: ['Offer a small amount next to a food he likes', 'Change the shape or texture', 'Keep mealtime calm, without pressure', 'Try again another day'],
    doctor: 'Talk to his doctor if he seems unwell, is losing weight, or refuses most food for many days.',
  },
  {
    id: 'enough', title: 'Is he eating enough?', read: '3 min read', mood: 'happy', tint: 'lunch',
    intro: ['Most toddlers eat enough over a week, even if some days look small.', 'His energy, sleep and growth at check-ups tell you more than one plate.'],
    tips: ['Look at the week in Memory, not one meal', 'Offer foods from different groups across the day', 'Limit milk to what his doctor suggests so he stays hungry for meals', 'Keep sweet snacks and juices small'],
    doctor: 'Talk to his doctor if he is losing weight, seems tired all the time, or has fewer wet nappies.',
  },
  {
    id: 'throwing', title: 'Throwing food or not sitting', read: '2 min read', mood: 'calm', tint: 'snack',
    intro: ['Throwing food is often a sign he is full or bored, not naughty.', 'Short, calm meals and a steady routine help him sit longer.'],
    tips: ['Give small amounts at a time', 'When he starts throwing, end the meal calmly', 'Use a high chair or a fixed seat', 'Praise him when he sits and eats'],
    doctor: 'If mealtimes are a struggle every day for weeks, his doctor can help.',
  },
];
export const ARTICLE_SOURCE = { name: 'American Academy of Pediatrics (HealthyChildren.org) and WHO', url: 'https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/default.aspx' };

/* ==========================================================================
   Carer view (C01–C04): Hindi and English. Marathi is "coming soon".
   ========================================================================== */
export const CARER_LANGS = [
  { id: 'hi', name: 'हिंदी', sub: 'Hindi', ready: true },
  { id: 'mr', name: 'मराठी', sub: 'Marathi', ready: false },
  { id: 'en', name: 'English', sub: '', ready: true },
];

/** Devanagari spellings for names we know. Others stay as written. */
export const NAMES_HI = { Aarav: 'आरव', Deepali: 'दीपाली', Aai: 'आई', Sunita: 'सुनीता', Priya: 'प्रिया', Rahul: 'राहुल', Ajji: 'अज्जी', Dadi: 'दादी', Nani: 'नानी' };

export const FOOD_HI = {
  banana: 'केला', 'curd-rice': 'दही-चावल', idli: 'इडली', khichdi: 'खिचड़ी', 'dal-rice': 'दाल-चावल', poha: 'पोहा',
  upma: 'उपमा', cheela: 'चीला', 'ragi-porridge': 'रागी दलिया', 'palak-khichdi': 'पालक खिचड़ी', 'khichdi-balls': 'खिचड़ी के लड्डू',
};

export const ALLERGY_HI = {
  peanut: 'मूंगफली', mustard: 'सरसों', milk: 'दूध', egg: 'अंडा', wheat: 'गेहूँ', treenuts: 'मेवे', sesame: 'तिल',
  soy: 'सोया', fish: 'मछली', shellfish: 'झींगा', coconut: 'नारियल', corn: 'मक्का',
};

export const RELATIONS = ['Grandmother', 'Grandfather', 'Helper', 'Other'];

export const CARER_TEXT = {
  hi: {
    hello: (n) => `नमस्ते ${n}`,
    mealOf: (c, m) => `${c} का ${m}`,
    picked: (p, finger) => `${p} ने यह चुना है। ${finger ? 'छोटे नरम टुकड़े दें, उसे खुद खाने दें।' : 'इसे नरम मसल दें।'}`,
    backup: (f) => `अगर वह न खाए: ${f} दें`,
    allergy: (list) => `${list} नहीं (एलर्जी)`,
    or: ' या ',
    rules: 'ऊपर से चीनी या मसाला नहीं',
    after: 'खाने के बाद, एक पर टैप करें:',
    well: 'अच्छे से खाया', some: 'थोड़ा खाया', not: 'नहीं खाया',
    okay: 'कोई बात नहीं',
    tryLater: (f) => `थोड़ी देर बाद फिर से दें, या ${f} दें।`,
    giveTitle: (f) => `${f} दें`, giveSub: 'वह इसे हर बार खाता है', gave: (f) => `${f} दिया`,
    waitTitle: '20 मिनट बाद दें', waitSub: 'थाली अलग रख दें', remind: 'याद दिलाएँ',
    thanks: 'धन्यवाद',
    saw: (p, c, m, o) => `${p} देख सकते हैं कि ${c} ने ${m} ${o}।`,
    sawBackup: (p, c, f) => `${p} देख सकते हैं कि ${c} को ${f} दिया गया।`,
    sawRemind: 'हम 20 मिनट बाद याद दिलाएँगे।',
    closes: 'यह स्क्रीन अपने आप बंद हो जाएगी',
    cont: 'आगे बढ़ें',
    nothingPlanned: 'आज के लिए कुछ चुना नहीं गया है। उसका बैकअप दें।',
    saveFail: 'सेव नहीं हुआ। इंटरनेट देखें और फिर से टैप करें।', retry: 'फिर से',
  },
  en: {
    hello: (n) => `Hello ${n}`,
    mealOf: (c, m) => `${c}’s ${m}`,
    picked: (p, finger) => `${p} picked this. ${finger ? 'Give small soft pieces he can pick up himself.' : 'Mash it soft.'}`,
    backup: (f) => `If he doesn’t eat: give ${f}`,
    allergy: (list) => `No ${list} (allergy)`,
    or: ' or ',
    rules: 'No added sugar or spice',
    after: 'After the meal, tap one:',
    well: 'Ate well', some: 'Ate some', not: 'Did not eat',
    okay: 'That’s okay',
    tryLater: (f) => `Offer it again in a while, or give ${f}.`,
    giveTitle: (f) => `Give ${f}`, giveSub: 'He eats it every time', gave: (f) => `Gave ${f}`,
    waitTitle: 'Offer again in 20 min', waitSub: 'Keep the plate aside', remind: 'Remind me',
    thanks: 'Thank you',
    saw: (p, c, m, o) => `${p} can see that ${c} ${o.toLowerCase()} at ${m}.`,
    sawBackup: (p, c, f) => `${p} can see that ${c} had ${f} instead.`,
    sawRemind: 'We will remind you in 20 minutes.',
    closes: 'This screen will close by itself',
    cont: 'Continue',
    nothingPlanned: 'Nothing is picked for now. Give his backup.',
    saveFail: 'Couldn’t save. Check the internet and tap again.', retry: 'Try again',
  },
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Little Plate is for toddlers: 6 months to 4 years. */
export const AGE_RANGE = { minMonths: 6, maxMonths: 48 };

export const SETUP_STEPS = ['child', 'allergies', 'family', 'foods', 'backup'];

import type { ColoringPageItem } from '../types';

interface ConceptTemplate {
  concept: string;
  description: string;
  imageUrl: string;
}

const THEME_CONCEPTS: Record<string, ConceptTemplate[]> = {
  space: [
    {
      concept: 'Rocket Launching into Space',
      description: 'A powerful rocket blasting into orbit past clouds and stars.',
      imageUrl: '/illustrations/coloring-rocket.png',
    },
    {
      concept: 'Astronaut Exploring the Moon',
      description: 'A cheerful astronaut waving warmly from lunar craters with Saturn in view.',
      imageUrl: '/illustrations/coloring-astronaut.png',
    },
    {
      concept: 'Friendly Alien Encounter',
      description: 'A cute alien greeting human explorers from a planetary ridge.',
      imageUrl: '/illustrations/coloring-spaceship.svg',
    },
    {
      concept: 'Space Rover on Mars',
      description: 'A mechanical exploration rover scanning Martian red rocks and craters.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Saturn Exploration',
      description: 'Vast planetary rings and swirling cloud belts surrounded by starlight.',
      imageUrl: '/illustrations/coloring-astronaut.png',
    },
    {
      concept: 'Orbiting Space Station',
      description: 'Solar panels and scientific modules floating in zero gravity.',
      imageUrl: '/illustrations/coloring-rocket.png',
    },
    {
      concept: 'Astronaut Using a Telescope',
      description: 'An astronomer pointing an observatory telescope towards distant nebulae.',
      imageUrl: '/illustrations/coloring-astronaut.png',
    },
    {
      concept: 'Spaceship Flying Through Space',
      description: 'A streamlined starship cruising through a cluster of shooting stars.',
      imageUrl: '/illustrations/coloring-spaceship.svg',
    },
    {
      concept: 'Spacewalk in Deep Orbit',
      description: 'An astronaut tethered safely outside the capsule admiring Earth below.',
      imageUrl: '/illustrations/coloring-astronaut.png',
    },
    {
      concept: 'Galactic Moon Base Colony',
      description: 'Futuristic geodesic domes and communication antennas on the moon.',
      imageUrl: '/illustrations/coloring-spaceship.svg',
    },
  ],

  dino: [
    {
      concept: 'Brachiosaurus Reaching Tall Palms',
      description: 'A friendly long-neck dinosaur greeting the morning sun beside palms.',
      imageUrl: '/illustrations/coloring-dinosaur.png',
    },
    {
      concept: 'Baby T-Rex Hatching from Fossil Egg',
      description: 'A curious newborn dinosaur looking around its primeval nest.',
      imageUrl: '/illustrations/coloring-dinosaur-large.png',
    },
    {
      concept: 'Pterodactyl Soaring Over Volcanoes',
      description: 'Winged reptiles gliding across prehistoric skies above fern-covered mountains.',
      imageUrl: '/illustrations/coloring-dinosaur.png',
    },
    {
      concept: 'Triceratops Grazing in Primeval Meadow',
      description: 'A three-horned dinosaur munching prehistoric grasses beside giant ferns.',
      imageUrl: '/illustrations/coloring-dinosaur-large.png',
    },
    {
      concept: 'Stegosaurus by Tropical River',
      description: 'Plated back dinosaur drinking crystal water from a winding stream.',
      imageUrl: '/illustrations/coloring-dinosaur.png',
    },
    {
      concept: 'Prehistoric Valley Expedition',
      description: 'Sunny volcanic peaks and lush prehistoric flora with peaceful giants.',
      imageUrl: '/illustrations/coloring-dinosaur-large.png',
    },
    {
      concept: 'Velociraptor in the Fern Forest',
      description: 'A nimble explorer discovering ancient amber crystals in the woods.',
      imageUrl: '/illustrations/coloring-dinosaur.png',
    },
    {
      concept: 'Dinosaur Family at Sunset',
      description: 'Mother and baby dinosaur walking together across sandy dunes.',
      imageUrl: '/illustrations/coloring-dinosaur-large.png',
    },
    {
      concept: 'Baby Dino Splashing in the Lagoon',
      description: 'Joyful baby reptiles playing near tropical palm tree waterholes.',
      imageUrl: '/illustrations/coloring-dinosaur.png',
    },
    {
      concept: 'Ankylosaurus Shield Protector',
      description: 'Armored dinosaur inspecting colorful jungle flowers and butterflies.',
      imageUrl: '/illustrations/coloring-dinosaur-large.png',
    },
  ],

  animals: [
    {
      concept: 'Adorable Kitten in the Garden',
      description: 'A sweet kitten surrounded by blooming daisies and floating hearts.',
      imageUrl: '/illustrations/coloring-cat.png',
    },
    {
      concept: 'Baby Safari Lion in the Grass',
      description: 'A cheerful lion cub sitting with butterflies and savanna blossoms.',
      imageUrl: '/illustrations/coloring-lion.svg',
    },
    {
      concept: 'Playful Dolphin Leaping Over Waves',
      description: 'A joyful dolphin splashing above bubbly ocean waves.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Woodland Bunny in Clover Patch',
      description: 'A fluffy rabbit sniffing clover blossoms beside friendly ladybugs.',
      imageUrl: '/illustrations/coloring-cat.png',
    },
    {
      concept: 'Baby Sea Turtle Reef Explorer',
      description: 'A gentle turtle paddling through sea anemones and coral shells.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Playful Safari Cub Adventure',
      description: 'Little savanna friends resting happily under shady acacia leaves.',
      imageUrl: '/illustrations/coloring-lion.svg',
    },
    {
      concept: 'Kitten Chasing Butterflies',
      description: 'A bouncy kitten leaping after summer butterflies in a backyard meadow.',
      imageUrl: '/illustrations/coloring-cat.png',
    },
    {
      concept: 'Lion King of the Meadow',
      description: 'A proud yet gentle baby lion sitting majestically upon a hill.',
      imageUrl: '/illustrations/coloring-lion.svg',
    },
    {
      concept: 'Dolphin Pod Sunset Dance',
      description: 'Dolphins and seagulls enjoying the calm seaside breeze.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Enchanted Animal Friends Gathering',
      description: 'Puppies, kittens and birds sharing a picnic in the park.',
      imageUrl: '/illustrations/coloring-cat.png',
    },
  ],

  fantasy: [
    {
      concept: 'Fairytale Kingdom Royal Castle',
      description: 'Grand stone towers with fluttering flags, rainbow skies and arched gates.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Friendly Baby Dragon Flying High',
      description: 'A cheerful winged dragon gliding above fluffy fairytale clouds.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Enchanted Crystal Courtyard',
      description: 'Cobblestone palace square filled with glowing royal lantern posts.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Winged Unicorn in Cloud Valley',
      description: 'A majestic horned pegasus trotting over rainbow bridges in the clouds.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Royal Palace Secret Garden',
      description: 'Arched trellises of climbing roses and carved stone birdbaths.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Magic Wand Wishing Well',
      description: 'A mossy wishing stone well surrounded by four-leaf clovers.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Grand Turrets and Flying Banners',
      description: 'Soaring medieval spires greeting the morning kingdom sun.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Castle Drawbridge Crossing',
      description: 'A friendly wooden drawbridge crossing over lily pad moats.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Princess Crown & Jewel Box',
      description: 'Sparkling royal tiaras and jeweled scepters on velvet cushions.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
    {
      concept: 'Starry Fairytale Night Over Castle',
      description: 'Constellations twinkling above the palace keep and spires.',
      imageUrl: '/illustrations/coloring-castle.svg',
    },
  ],

  robots: [
    {
      concept: 'Helpful Workshop Robot & Heart Gauge',
      description: 'A mechanical companion with antenna, dials and a cheerful wave.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Robot Engineer Inventing Gizmos',
      description: 'A clever bot assembling brass gears and wind-up mechanical toys.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Clockwork Companion Pet',
      description: 'A miniature robotic pup with copper joints and blinking LED eyes.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Solar Energy Bot in Garden',
      description: 'A sunny robot holding a watering can to nurture robotic flowers.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Floating Drone Delivering Mail',
      description: 'A propeller-driven mini robot carrying letters across city skyline.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Robot Laboratory Assembly Line',
      description: 'Cogs, conveyor belts and friendly robotic arms working together.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Robotic Astronaut Launch',
      description: 'A space-certified droid gearing up for orbital satellite maintenance.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Musical Synthesizer Bot',
      description: 'A musical robot playing keyboard tunes with rhythmic sound waves.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Recycling Helper Robot',
      description: 'An eco-friendly robot tidying up nuts, bolts and reusable metal parts.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
    {
      concept: 'Robot Looking Through Star Telescope',
      description: 'A mechanical friend stargazing under a starry evening sky.',
      imageUrl: '/illustrations/coloring-robot.svg',
    },
  ],

  underwater: [
    {
      concept: 'Dolphin Leaping Over Waves & Sea Turtle',
      description: 'A dolphin splashing above bubbly waves beside a swimming sea turtle.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Gentle Baby Sea Turtle in Coral Reef',
      description: 'A wise sea turtle paddling beside sea fans and starfish.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Playful Seahorse Friends in Seaweed',
      description: 'Curled tail seahorses floating through bubbly ocean currents.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Sunken Treasure Chest on Seafloor',
      description: 'A treasure chest with pearls, coins, and a friendly little crab.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Tropical Clownfish Swimming Through Anemone',
      description: 'Striped reef fish dancing among wavy soft coral fronds.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Whale Spouting High Water Fountains',
      description: 'A gentle ocean giant blowing water arches toward the clouds.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Submarine Explorer Viewing Giant Squid',
      description: 'A yellow submarine searchlight illuminating deep sea wonders.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Starfish Sunbathing on the Sandbar',
      description: 'Five-pointed sea stars resting on sunny coastal sand ripples.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Manta Ray Gliding Through Sun Rays',
      description: 'Graceful sea ray swimming through crystal clear shallow lagoons.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
    {
      concept: 'Coral Reef Underwater Kingdom',
      description: 'A majestic underwater reef bustling with schools of joyful fish.',
      imageUrl: '/illustrations/coloring-dolphin.svg',
    },
  ],
};

/**
 * Detect primary theme category from user prompt
 */
function detectTheme(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('space') || p.includes('rocket') || p.includes('astronaut') || p.includes('planet') || p.includes('alien') || p.includes('mars')) {
    return 'space';
  }
  if (p.includes('dino') || p.includes('dinosaur') || p.includes('t-rex') || p.includes('fossil') || p.includes('pterodactyl')) {
    return 'dino';
  }
  if (p.includes('robot') || p.includes('bot') || p.includes('cyber') || p.includes('mech') || p.includes('gear')) {
    return 'robots';
  }
  if (p.includes('underwater') || p.includes('ocean') || p.includes('sea') || p.includes('fish') || p.includes('dolphin') || p.includes('whale') || p.includes('coral')) {
    return 'underwater';
  }
  if (p.includes('castle') || p.includes('dragon') || p.includes('magic') || p.includes('fairy') || p.includes('fantasy') || p.includes('unicorn') || p.includes('wizard') || p.includes('princess')) {
    return 'fantasy';
  }
  if (p.includes('animal') || p.includes('cat') || p.includes('kitten') || p.includes('dog') || p.includes('puppy') || p.includes('lion') || p.includes('safari') || p.includes('pet') || p.includes('bunny')) {
    return 'animals';
  }
  return 'space'; // Default creative theme
}

/**
 * Generate N unique, realistic coloring page concepts matching prompt and count
 */
export function generateMockBookPages(prompt: string, count: number, bookId: string): ColoringPageItem[] {
  const theme = detectTheme(prompt);
  const themePool = THEME_CONCEPTS[theme] || THEME_CONCEPTS.space;

  // Extract clean keywords from prompt for customized concept titles if not exact theme match
  const trimmedPrompt = prompt.trim();
  const shortTitle = trimmedPrompt.length <= 30 ? trimmedPrompt : trimmedPrompt.slice(0, 28) + '...';

  const pages: ColoringPageItem[] = [];

  for (let i = 0; i < count; i++) {
    const template = themePool[i % themePool.length];
    const pageNumber = i + 1;
    const difficulties: Array<'easy' | 'medium' | 'detailed'> = ['easy', 'medium', 'detailed'];
    const difficulty = difficulties[i % difficulties.length];

    pages.push({
      id: `page_${bookId}_${pageNumber}_${Date.now()}`,
      bookId,
      pageNumber,
      concept: template.concept,
      title: template.concept,
      description: template.description || `Page ${pageNumber} of ${shortTitle}`,
      imageUrl: template.imageUrl,
      visualPrompt: `Coloring book line art, pure black lines on pure white background, ${template.concept}, ${template.description}, clean vector linework, enclosed areas for coloring, zero shading, zero grayscale`,
      difficulty,
      status: 'planned',
    });
  }

  return pages;
}

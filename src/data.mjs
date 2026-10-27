// Editorial metadata layered on top of the imported WordPress content.

// Directory entries for the location guides: city, region, group and a
// short instrument-style code shown in Space Mono.
export const locations = {
  'drum-shops-in-united-kingdom': { city: 'United Kingdom', region: 'Nationwide', group: 'uk', code: 'UK-ALL' },
  'best-drum-shops-in-liverpool': { city: 'Liverpool', region: 'England', group: 'uk', code: 'UK-LIV' },
  'drum-shops-in-manchester-united-kingdom': { city: 'Manchester', region: 'England', group: 'uk', code: 'UK-MAN' },
  'best-drum-shops-in-leed': { city: 'Leeds', region: 'England', group: 'uk', code: 'UK-LDS' },
  'drum-shops-sheffield': { city: 'Sheffield', region: 'England', group: 'uk', code: 'UK-SHF' },
  'best-drum-shop-in-wolverhampton': { city: 'Wolverhampton', region: 'England', group: 'uk', code: 'UK-WLV' },
  'best-drum-shop-in-westminster': { city: 'Westminster', region: 'London', group: 'uk', code: 'UK-WST' },
  'drum-and-bass-record-shops': { city: 'London', region: 'Record shops', group: 'uk', code: 'UK-LDN' },
  'best-drum-shop-in-brighton': { city: 'Brighton', region: 'England', group: 'uk', code: 'UK-BTN' },
  'best-drum-shops-in-kent': { city: 'Kent', region: 'England', group: 'uk', code: 'UK-KNT' },
  'best-drum-shops-in-hertfordshire': { city: 'Hertfordshire', region: 'England', group: 'uk', code: 'UK-HRT' },
  'best-drum-shops-in-hertfordshire-2': { city: 'Hertfordshire', region: 'England · Vol. 2', group: 'uk', code: 'UK-HRT2' },
  'best-drum-shops-in-southampton-united-kingdom': { city: 'Southampton', region: 'England', group: 'uk', code: 'UK-SOU' },
  'best-drum-shop-in-salisbury': { city: 'Salisbury', region: 'England', group: 'uk', code: 'UK-SLS' },
  'best-drum-lessons-in-bath': { city: 'Bath', region: 'Drum lessons', group: 'uk', code: 'UK-BTH' },
  'drum-shops-in-edinburgh': { city: 'Edinburgh', region: 'Scotland', group: 'uk', code: 'UK-EDI' },
  'best-drum-shops-in-scotland': { city: 'Scotland', region: 'Scotland', group: 'uk', code: 'UK-SCT' },
  'best-drum-shops-in-cardiff': { city: 'Cardiff', region: 'Wales', group: 'uk', code: 'UK-CDF' },
  'best-drum-shops-in-ireland': { city: 'Ireland', region: 'Ireland', group: 'uk', code: 'IE-ALL' },
  'best-vintage-drum-shops-in-united-kingdom': { city: 'UK vintage', region: 'Vintage drums', group: 'specialist', code: 'UK-VNT' },
  'best-vintage-drum-shops': { city: 'Vintage', region: 'Worldwide', group: 'specialist', code: 'WW-VNT' },
  'best-online-drum-shops-2021': { city: 'Online', region: 'Ships to the UK', group: 'specialist', code: 'WEB-01' },
  'best-drum-shops-in-united-state-of-america': { city: 'United States', region: 'USA', group: 'international', code: 'US-ALL' },
  'best-drum-shops-in-boston': { city: 'Boston', region: 'USA', group: 'international', code: 'US-BOS' },
  'best-drum-shops-in-los-angeles': { city: 'Los Angeles', region: 'USA', group: 'international', code: 'US-LAX' },
  'drum-shops-in-chicago': { city: 'Chicago', region: 'USA', group: 'international', code: 'US-CHI' },
  'best-drum-shops-in-sydney': { city: 'Sydney', region: 'Australia', group: 'international', code: 'AU-SYD' },
};

export const locationGroups = [
  { id: 'all', label: 'All locations' },
  { id: 'uk', label: 'UK & Ireland' },
  { id: 'specialist', label: 'Vintage & online' },
  { id: 'international', label: 'International' },
];

// Gear reviews get a spec strip on their feature cards.
export const reviews = {
  'roland-td-1k-electronic-drum-kit-review': { kind: 'Electronic kit', brand: 'Roland', model: 'TD-1K' },
  'pdp-maple-concept': { kind: 'Acoustic kit', brand: 'PDP', model: 'Concept Maple' },
  'nad-c316bee': { kind: 'Amplifier', brand: 'NAD', model: 'C316BEE' },
};

// Order the main navigation and footer use for categories.
export const categoryOrder = [
  'drum-shops-in-uk',
  'best-drum-shops',
  'best-drummers',
  'drum-set',
  'electronic-drum-set',
  'best-amplifiers',
];

// Fallback artwork when a post has no image of its own.
export const fallbackImages = ['/assets/img/studio-kit.jpg', '/assets/img/percussion.jpg', '/assets/img/music-shop.jpg'];

// Free photography used across the site (all CC0 / public domain).
export const photoCredits = [
  {
    file: '/assets/img/hero-stage.jpg',
    use: 'Homepage hero',
    title: 'Black and white live music setup with a drum kit on stage',
    source: 'WordPress Photo Directory',
    url: 'https://wordpress.org/photos/',
    license: 'CC0 1.0',
  },
  {
    file: '/assets/img/studio-kit.jpg',
    use: 'Gear reviews, fallbacks',
    title: 'Black drum set on a black mat in a rehearsal room',
    source: 'WordPress Photo Directory',
    url: 'https://wordpress.org/photos/',
    license: 'CC0 1.0',
  },
  {
    file: '/assets/img/percussion.jpg',
    use: 'About section',
    title: 'Close-up of percussion instruments with a tambourine',
    source: 'WordPress Photo Directory',
    url: 'https://wordpress.org/photos/',
    license: 'CC0 1.0',
  },
  {
    file: '/assets/img/music-shop.jpg',
    use: 'How it works, fallbacks',
    title: 'Music shop interior with racks and shelves',
    source: 'WordPress Photo Directory',
    url: 'https://wordpress.org/photos/',
    license: 'CC0 1.0',
  },
  {
    file: '/assets/img/concert-stage.jpg',
    use: 'Call to action band',
    title: 'Blue lights from a concert stage',
    source: 'WordPress Photo Directory',
    url: 'https://wordpress.org/photos/',
    license: 'CC0 1.0',
  },
];

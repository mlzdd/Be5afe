export const icons = {
  // Navigation
  home: 'home', map: 'map', profile: 'person', settings: 'settings',
  back: 'arrow-back', close: 'close', menu: 'menu',
  // Actions
  add: 'add', edit: 'pencil', delete: 'trash', save: 'checkmark',
  cancel: 'close', search: 'search', filter: 'filter', share: 'share-social',
  download: 'download',
  // Safety & Emergency
  alert: 'alert-circle', warning: 'warning', shield: 'shield-checkmark',
  emergency: 'call', hospital: 'medical', police: 'shield', fire: 'flame',
  help: 'help-circle', sos: 'alert',
  // Travel & Location
  location: 'location', pin: 'pin', navigation: 'navigate', airplane: 'airplane',
  train: 'train', bus: 'bus', car: 'car', walk: 'walk', hotel: 'bed',
  restaurant: 'restaurant',
  // Documents & Info
  document: 'document-text', passport: 'card', insurance: 'shield-half',
  camera: 'camera', scan: 'scan', clipboard: 'clipboard', checklist: 'checkmark-done',
  // Communication
  phone: 'call', message: 'chatbubble', email: 'mail', notifications: 'notifications',
  // Money & Finance
  wallet: 'wallet', currency: 'cash', card: 'card', receipt: 'receipt',
  calculator: 'calculator',
  // Time & Calendar
  calendar: 'calendar', clock: 'time', schedule: 'calendar-outline',
  // Weather
  sun: 'sunny', cloud: 'cloud', rain: 'rainy', snow: 'snow',
  temperature: 'thermometer',
  // Social & People
  person: 'person', people: 'people', group: 'people', user: 'person-circle',
  // General UI
  chevronRight: 'chevron-forward', chevronLeft: 'chevron-back',
  chevronUp: 'chevron-up', chevronDown: 'chevron-down',
  arrowRight: 'arrow-forward', arrowLeft: 'arrow-back',
  arrowUp: 'arrow-up', arrowDown: 'arrow-down',
  check: 'checkmark', star: 'star', heart: 'heart', bookmark: 'bookmark',
  lock: 'lock-closed', unlock: 'lock-open', eye: 'eye', eyeOff: 'eye-off',
  // Trip Planning
  trip: 'briefcase', luggage: 'bag-handle', ticket: 'ticket',
  attractions: 'images', guide: 'book',
  // Services
  taxi: 'car', wifi: 'wifi', pharmacy: 'medical', atm: 'cash',
  shopping: 'cart', food: 'fast-food',
  // Safety Features
  safeZone: 'shield-checkmark', scamAlert: 'warning', laws: 'document-text', apps: 'apps',
} as const;

export type IconName = keyof typeof icons;

export const getIcon = (name: IconName): string => icons[name] ?? 'ellipse';

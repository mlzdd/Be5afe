export type WidgetType =
  | 'weather' | 'safety' | 'currency' | 'emergency' | 'alerts'
  | 'trip-countdown' | 'expense-summary' | 'packing-progress'
  | 'nearest-hospital' | 'share-location' | 'local-laws' | 'local-apps'
  | 'documents' | 'insurance' | 'health-guide' | 'esim' | 'friends' | 'groups';

export type WidgetSize = 'small' | 'large';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  settings?: Record<string, unknown>;
  order: number;
}

export interface WidgetMetadata {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  defaultSize: WidgetSize;
  configurable: boolean;
}

export const WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
  weather:          { type: 'weather',          title: 'Weather',            description: 'Current weather and forecast',           icon: 'partly-sunny',          iconColor: '#FFC107', defaultSize: 'large', configurable: true },
  safety:           { type: 'safety',           title: 'Safety Rating',      description: 'Current location safety information',    icon: 'shield-checkmark',      iconColor: '#4CAF50', defaultSize: 'small', configurable: false },
  currency:         { type: 'currency',         title: 'Currency Converter', description: 'Quick currency conversion',              icon: 'cash',                  iconColor: '#4CAF50', defaultSize: 'small', configurable: true },
  emergency:        { type: 'emergency',        title: 'Emergency Contacts', description: 'Quick access to emergency numbers',      icon: 'call',                  iconColor: '#FF5722', defaultSize: 'small', configurable: false },
  alerts:           { type: 'alerts',           title: 'Live Alerts',        description: 'Recent safety alerts',                   icon: 'alert-circle',          iconColor: '#FF9800', defaultSize: 'large', configurable: false },
  'trip-countdown': { type: 'trip-countdown',   title: 'Trip Countdown',     description: 'Days until your next trip',              icon: 'calendar',              iconColor: '#9C27B0', defaultSize: 'small', configurable: true },
  'expense-summary':{ type: 'expense-summary',  title: 'Expense Summary',    description: 'Total spending overview',                icon: 'wallet',                iconColor: '#FF9800', defaultSize: 'small', configurable: true },
  'packing-progress':{ type: 'packing-progress',title: 'Packing Progress',   description: 'Items packed for your trip',             icon: 'archive',               iconColor: '#00BCD4', defaultSize: 'small', configurable: false },
  'nearest-hospital':{ type: 'nearest-hospital',title: 'Nearest Hospital',   description: 'Closest medical facilities',             icon: 'medical',               iconColor: '#F44336', defaultSize: 'small', configurable: false },
  'share-location': { type: 'share-location',   title: 'Share Location',     description: 'Share your location with contacts',      icon: 'location',              iconColor: '#2196F3', defaultSize: 'small', configurable: false },
  'local-laws':     { type: 'local-laws',       title: 'Local Laws',         description: 'Important laws and regulations',         icon: 'book',                  iconColor: '#795548', defaultSize: 'small', configurable: false },
  'local-apps':     { type: 'local-apps',       title: 'Local Apps',         description: 'Essential apps for this location',       icon: 'apps',                  iconColor: '#9C27B0', defaultSize: 'small', configurable: false },
  documents:        { type: 'documents',        title: 'Documents',          description: 'Travel documents and storage',           icon: 'document-text',         iconColor: '#607D8B', defaultSize: 'small', configurable: false },
  insurance:        { type: 'insurance',        title: 'Insurance',          description: 'Travel insurance information',           icon: 'shield',                iconColor: '#00BCD4', defaultSize: 'small', configurable: false },
  'health-guide':   { type: 'health-guide',     title: 'Health Guide',       description: 'Health tips and requirements',           icon: 'fitness',               iconColor: '#4CAF50', defaultSize: 'small', configurable: false },
  esim:             { type: 'esim',             title: 'eSIM',               description: 'Mobile connectivity options',            icon: 'phone-portrait',        iconColor: '#FF5722', defaultSize: 'small', configurable: false },
  friends:          { type: 'friends',          title: 'Friends',            description: 'Manage your friend connections',         icon: 'people',                iconColor: '#9C27B0', defaultSize: 'small', configurable: false },
  groups:           { type: 'groups',           title: 'Groups',             description: 'Group chats with friends',               icon: 'people-circle',         iconColor: '#673AB7', defaultSize: 'small', configurable: false },
};

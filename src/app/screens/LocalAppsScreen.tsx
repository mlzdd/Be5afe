import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { ViewingLocationBanner } from '../components/ViewingLocationBanner';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface AppEntry {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  iconColor: string;
  platforms: ('ios' | 'android')[];
  free: boolean;
  iosUrl?: string;
  androidUrl?: string;
  tip?: string;
}

interface AppCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  apps: AppEntry[];
}

interface CountryLocalApp {
  name: string;
  description: string;
  icon: string;
}

interface CountryLocalAppCategory {
  label: string;
  color: string;
  apps: CountryLocalApp[];
}

const APP_CATEGORIES: AppCategory[] = [
  {
    id: 'navigation',
    label: 'Navigation',
    icon: 'map',
    color: '#2196F3',
    apps: [
      {
        name: 'Google Maps',
        tagline: 'The gold standard for travel navigation',
        description: 'Download offline maps for any region before you leave Wi-Fi. Works for walking, transit, and driving directions in 220 countries.',
        icon: 'map',
        iconColor: '#4285F4',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Download offline maps before you leave hotel Wi-Fi — data can be expensive or unavailable.',
      },
      {
        name: 'Maps.me',
        tagline: 'Offline-first maps with crowd-sourced POIs',
        description: 'Fully functional offline — no data connection needed after download. Excellent for hiking trails, rural roads, and remote areas where Google Maps falls short.',
        icon: 'navigate',
        iconColor: '#FF5722',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Great backup to Google Maps. OpenStreetMap data is often more detailed for rural areas.',
      },
      {
        name: 'Rome2rio',
        tagline: 'Multi-modal transport planner',
        description: 'Shows every transport option between any two points on earth — planes, trains, buses, ferries, taxis, rideshare. Includes estimated cost and duration.',
        icon: 'airplane',
        iconColor: '#FF9800',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'Citymapper',
        tagline: 'Best transit app for major cities',
        description: 'Detailed real-time public transit for 100+ cities including bus, metro, tram, bike, and scooter. Far superior to Google Maps for transit in supported cities.',
        icon: 'bus',
        iconColor: '#00BCD4',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Check if your destination is supported before relying on it — city coverage is excellent but not universal.',
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: 'chatbubbles',
    color: '#4CAF50',
    apps: [
      {
        name: 'WhatsApp',
        tagline: 'Widely used international messaging',
        description: 'Free calls and messages over Wi-Fi or data. Dominant in Europe, Latin America, South Asia, and Africa. End-to-end encrypted. Works well on slow connections.',
        icon: 'chatbubble',
        iconColor: '#25D366',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Save your embassy\'s WhatsApp number before you travel — many now have emergency WhatsApp lines.',
      },
      {
        name: 'Google Translate',
        tagline: 'Camera translation + 100+ languages',
        description: 'Point your camera at any text for instant translation. Download language packs offline. Conversation mode translates speech in real time.',
        icon: 'language',
        iconColor: '#4285F4',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Download language packs on Wi-Fi — offline translation is essential when lost or in an emergency.',
      },
      {
        name: 'Skype',
        tagline: 'Cheap international calls to landlines',
        description: 'Skype-to-Skype calls are free. Paid calling to landlines and mobiles is cheap — useful for calling hotels, hospitals, or embassies abroad.',
        icon: 'call',
        iconColor: '#00AFF0',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'Line',
        tagline: 'Essential in Japan, Thailand, Taiwan',
        description: 'The dominant messaging app in East/Southeast Asia. Many local businesses, tourist services, and government hotlines only publish LINE IDs, not phone numbers.',
        icon: 'chatbubbles',
        iconColor: '#00B900',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'If visiting Japan, South Korea, Thailand, or Taiwan — install this before you arrive.',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: 'shield-checkmark',
    color: '#F44336',
    apps: [
      {
        name: 'Smart Traveller',
        tagline: 'Official Australian government travel advisories',
        description: 'Real-time travel alerts and safety ratings from the Australian Department of Foreign Affairs. Subscribe to alerts for your destination country.',
        icon: 'alert-circle',
        iconColor: '#FF9800',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Register your trip so the government can contact you during a crisis or evacuation.',
      },
      {
        name: 'bSafe',
        tagline: 'Personal safety + emergency SOS',
        description: 'Share your location with trusted contacts, set a timer that triggers an alarm if you don\'t check in, and send an emergency SOS with GPS coordinates.',
        icon: 'shield',
        iconColor: '#E53935',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'TripWhistle Global SOS',
        tagline: 'Emergency numbers for every country',
        description: 'Instantly look up emergency services numbers anywhere in the world — police, fire, ambulance. Works offline. One-tap calling.',
        icon: 'call',
        iconColor: '#F44336',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'Red Cross First Aid',
        tagline: 'Offline first aid reference',
        description: 'Step-by-step first aid guidance for 50+ emergency scenarios. Fully offline. Includes CPR coach, symptom checker, and nearest hospital finder.',
        icon: 'medkit',
        iconColor: '#E53935',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Download and read the basics before your trip — in an emergency you may not have the focus to learn.',
      },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: 'car',
    color: '#9C27B0',
    apps: [
      {
        name: 'Grab',
        tagline: 'Dominant rideshare across SE Asia',
        description: 'The Uber of Southeast Asia. Covers Thailand, Vietnam, Indonesia, Malaysia, Philippines, Singapore, Myanmar, and Cambodia. Fixed fares — no meter haggling.',
        icon: 'car',
        iconColor: '#00B14F',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Set up and verify your account before arriving — sign-up can require a local number in some countries.',
      },
      {
        name: 'Uber',
        tagline: 'Rideshare in 70+ countries',
        description: 'Available in major cities across North America, Europe, Latin America, Australia, and parts of Asia/Africa. Fixed pricing, cashless, and trackable.',
        icon: 'car-sport',
        iconColor: '#000000',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'DiDi',
        tagline: 'Rideshare in China, Japan, Latin America, Australia',
        description: 'Essential in China where Uber doesn\'t operate. Also available in Australia, Brazil, Mexico, and Japan. Register before you go — Chinese sign-up requires local verification.',
        icon: 'car',
        iconColor: '#FF8000',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'For China: set up DiDi and WeChat Pay before arrival — cash/card may not be accepted at many businesses.',
      },
      {
        name: 'FlixBus',
        tagline: 'Cheap long-distance buses in Europe',
        description: 'Budget inter-city buses across Europe, USA, and Latin America. Book in advance for the best prices. Comfortable with Wi-Fi and power outlets.',
        icon: 'bus',
        iconColor: '#73D700',
        platforms: ['ios', 'android'],
        free: true,
      },
    ],
  },
  {
    id: 'money',
    label: 'Money',
    icon: 'cash',
    color: '#009688',
    apps: [
      {
        name: 'Wise (TransferWise)',
        tagline: 'Best exchange rates for payments & transfers',
        description: 'Multi-currency account and debit card. Spend anywhere at the real exchange rate with minimal fees. Free to open; card delivery takes a few days — order before you travel.',
        icon: 'card',
        iconColor: '#37517E',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Order the physical Wise card before departure — it\'s the single best tool for spending abroad with real exchange rates.',
      },
      {
        name: 'Revolut',
        tagline: 'Multi-currency spending card & travel perks',
        description: 'Fee-free currency exchange up to monthly limits, instant spend notifications, card freeze from the app, and travel insurance add-ons. Great for budget tracking while travelling.',
        icon: 'card',
        iconColor: '#191C1F',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Free tier has monthly ATM withdrawal limits. For heavy cash use, Wise may be cheaper.',
      },
      {
        name: 'XE Currency',
        tagline: 'Reliable offline currency converter',
        description: 'Live exchange rates with offline access to the last synced rates. Simple converter for 180+ currencies. Essential when negotiating prices in markets.',
        icon: 'swap-horizontal',
        iconColor: '#1E4A8A',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'Trail Wallet',
        tagline: 'Simple daily budget tracker',
        description: 'Set a daily travel budget, log expenses as you go, and see at a glance whether you\'re on track. Lightweight and fast — designed specifically for travel.',
        icon: 'wallet',
        iconColor: '#FF6B35',
        platforms: ['ios'],
        free: false,
        tip: 'Logging expenses immediately (before you forget) is key — takes 5 seconds and keeps your budget honest.',
      },
    ],
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    icon: 'bed',
    color: '#FF5722',
    apps: [
      {
        name: 'Booking.com',
        tagline: 'Largest hotel inventory worldwide',
        description: 'Huge selection from budget hostels to luxury hotels. Free cancellation on most properties. Strong in Europe, Asia, and the Middle East. Genius loyalty programme offers discounts.',
        icon: 'bed',
        iconColor: '#003580',
        platforms: ['ios', 'android'],
        free: true,
      },
      {
        name: 'Airbnb',
        tagline: 'Homes, apartments, and unique stays',
        description: 'Better than hotels for longer stays, groups, or when you want a kitchen. Quality varies — read recent reviews carefully. Some destinations restrict Airbnb heavily.',
        icon: 'home',
        iconColor: '#FF5A5F',
        platforms: ['ios', 'android'],
        free: true,
        tip: 'Check cancellation policy carefully — "Strict" means no refund within 30 days of check-in.',
      },
      {
        name: 'Hostelworld',
        tagline: 'Best hostel booking platform',
        description: 'The go-to for budget travellers. Covers 36,000 hostels in 178 countries. Detailed reviews, photos, and atmosphere ratings help find the right social/quiet balance.',
        icon: 'people',
        iconColor: '#FF6600',
        platforms: ['ios', 'android'],
        free: true,
      },
    ],
  },
];

const COUNTRY_LOCAL_APPS: Record<string, CountryLocalAppCategory[]> = {
  Indonesia: [
    { label: 'Transport', color: '#2196F3', apps: [
      { name: 'Gojek', description: 'Ride-hailing, food delivery, payments', icon: 'bicycle' },
      { name: 'Grab', description: 'Taxi, car, and bike rides', icon: 'car' },
      { name: 'Bluebird', description: 'Traditional taxi service', icon: 'car-outline' },
    ] },
    { label: 'Payments', color: '#009688', apps: [
      { name: 'GoPay', description: 'Digital wallet by Gojek', icon: 'card' },
      { name: 'OVO', description: 'Popular e-wallet', icon: 'wallet' },
      { name: 'Dana', description: 'Digital wallet platform', icon: 'phone-portrait' },
    ] },
  ],
  Thailand: [
    { label: 'Transport', color: '#2196F3', apps: [
      { name: 'Grab', description: 'Most popular ride-hailing', icon: 'car' },
      { name: 'Bolt', description: 'Affordable rides', icon: 'flash' },
      { name: 'InDrive', description: 'Negotiable fare rides', icon: 'car-sport' },
    ] },
    { label: 'Messaging & payments', color: '#4CAF50', apps: [
      { name: 'LINE', description: 'Most popular local messaging app', icon: 'chatbubbles' },
      { name: 'PromptPay', description: 'National QR payment system', icon: 'qr-code' },
      { name: 'TrueMoney', description: 'Digital wallet', icon: 'wallet' },
    ] },
  ],
  Singapore: [
    { label: 'Local essentials', color: '#4CAF50', apps: [
      { name: 'Grab', description: 'Dominant ride-hailing and delivery', icon: 'car' },
      { name: 'ComfortDelGro', description: 'Traditional taxi booking', icon: 'car-outline' },
      { name: 'SingPass', description: 'Government services and identity', icon: 'business' },
    ] },
    { label: 'Payments', color: '#009688', apps: [
      { name: 'PayNow', description: 'Instant bank transfers', icon: 'card' },
      { name: 'GrabPay', description: 'Digital wallet', icon: 'wallet' },
    ] },
  ],
  Malaysia: [
    { label: 'Transport', color: '#2196F3', apps: [
      { name: 'Grab', description: 'Leading ride-hailing and food delivery', icon: 'car' },
      { name: 'MyCar', description: 'Local ride service', icon: 'car-sport' },
    ] },
    { label: 'Payments', color: '#009688', apps: [
      { name: "Touch 'n Go", description: 'E-wallet and transit payments', icon: 'card' },
      { name: 'Boost', description: 'Digital wallet', icon: 'rocket' },
    ] },
  ],
  Japan: [
    { label: 'Transport', color: '#2196F3', apps: [
      { name: 'GO Taxi', description: 'Local taxi booking', icon: 'car' },
      { name: 'Suica', description: 'Transit IC card app', icon: 'train' },
      { name: 'DiDi', description: 'Ride-hailing service', icon: 'car-sport' },
    ] },
    { label: 'Local tools', color: '#9C27B0', apps: [
      { name: 'LINE', description: 'Most popular messaging app', icon: 'chatbubbles' },
      { name: 'PayPay', description: 'Leading QR payment app', icon: 'qr-code' },
      { name: 'Tabelog', description: 'Restaurant reviews', icon: 'restaurant' },
    ] },
  ],
  'South Korea': [
    { label: 'Local essentials', color: '#4CAF50', apps: [
      { name: 'KakaoTalk', description: 'National messaging app', icon: 'chatbubble' },
      { name: 'Kakao T', description: 'Leading taxi app', icon: 'car' },
      { name: 'Naver Map', description: 'Best local maps', icon: 'map' },
    ] },
    { label: 'Payments', color: '#009688', apps: [
      { name: 'KakaoPay', description: 'Digital wallet leader', icon: 'wallet' },
      { name: 'Toss', description: 'Mobile banking', icon: 'phone-portrait' },
    ] },
  ],
  China: [
    { label: 'Super apps', color: '#4CAF50', apps: [
      { name: 'WeChat', description: 'Messaging, payments, local services', icon: 'chatbubbles' },
      { name: 'Alipay', description: 'Dominant payment and services app', icon: 'wallet' },
      { name: 'Meituan', description: 'Food delivery and local services', icon: 'restaurant' },
    ] },
    { label: 'Transport', color: '#2196F3', apps: [
      { name: 'DiDi', description: 'Dominant ride-hailing', icon: 'car' },
      { name: 'Amap', description: 'Navigation and taxi booking', icon: 'map' },
    ] },
  ],
  India: [
    { label: 'Transport & food', color: '#FF5722', apps: [
      { name: 'Ola', description: 'Local ride-hailing leader', icon: 'car' },
      { name: 'Rapido', description: 'Bike taxi service', icon: 'bicycle' },
      { name: 'Swiggy', description: 'Leading food delivery', icon: 'restaurant' },
      { name: 'Zomato', description: 'Food delivery and reviews', icon: 'fast-food' },
    ] },
    { label: 'Payments', color: '#009688', apps: [
      { name: 'Paytm', description: 'Digital wallet and UPI payments', icon: 'wallet' },
      { name: 'PhonePe', description: 'UPI payments', icon: 'card' },
    ] },
  ],
  France: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'SNCF Connect', description: 'Train booking and live rail updates', icon: 'train' },
      { name: 'Citymapper', description: 'Urban navigation in major cities', icon: 'map' },
      { name: 'G7', description: 'Traditional taxi app', icon: 'car' },
    ] },
    { label: 'Payments & food', color: '#009688', apps: [
      { name: 'Lydia', description: 'Mobile payments', icon: 'wallet' },
      { name: 'Deliveroo', description: 'Restaurant delivery', icon: 'restaurant' },
    ] },
  ],
  Germany: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'DB Navigator', description: 'Train travel and tickets', icon: 'train' },
      { name: 'FreeNow', description: 'Taxi and ride-hailing', icon: 'car' },
      { name: 'BlaBlaCar', description: 'Inter-city ridesharing', icon: 'people' },
    ] },
    { label: 'Food & payments', color: '#009688', apps: [
      { name: 'Lieferando', description: 'Leading food delivery', icon: 'pizza' },
      { name: 'Klarna', description: 'Payments and shopping', icon: 'card' },
    ] },
  ],
  Spain: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'Cabify', description: 'Spanish ride-hailing service', icon: 'car' },
      { name: 'Renfe', description: 'National train tickets', icon: 'train' },
      { name: 'Bizum', description: 'Instant bank transfers', icon: 'card' },
    ] },
  ],
  'United Kingdom': [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'Trainline', description: 'Train tickets and live rail times', icon: 'train' },
      { name: 'Citymapper', description: 'Best for London transit', icon: 'map' },
      { name: 'FreeNow', description: 'Taxi booking in major cities', icon: 'car' },
    ] },
  ],
  'United States': [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'Uber', description: 'Ride-hailing in most cities', icon: 'car' },
      { name: 'Lyft', description: 'Alternative ride-hailing', icon: 'car-sport' },
      { name: 'Transit', description: 'Public transit in many cities', icon: 'bus' },
    ] },
    { label: 'Food & payments', color: '#009688', apps: [
      { name: 'DoorDash', description: 'Food delivery', icon: 'restaurant' },
      { name: 'Venmo', description: 'Peer-to-peer payments', icon: 'wallet' },
    ] },
  ],
  Canada: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'Transit', description: 'Public transit in Canadian cities', icon: 'bus' },
      { name: 'Uber', description: 'Ride-hailing in major cities', icon: 'car' },
      { name: 'ArriveCAN', description: 'Border and travel declarations', icon: 'document-text' },
    ] },
  ],
  Mexico: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: 'DiDi', description: 'Popular ride-hailing', icon: 'car' },
      { name: 'Rappi', description: 'Delivery and local services', icon: 'bag' },
      { name: 'Mercado Pago', description: 'Digital wallet', icon: 'wallet' },
    ] },
  ],
  Brazil: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: '99', description: 'Popular ride-hailing', icon: 'car' },
      { name: 'iFood', description: 'Leading food delivery', icon: 'restaurant' },
      { name: 'Pix', description: 'Instant payment system', icon: 'qr-code' },
    ] },
  ],
  Australia: [
    { label: 'Local essentials', color: '#9C27B0', apps: [
      { name: '13cabs', description: 'Taxi booking', icon: 'car' },
      { name: 'TripView', description: 'Public transport in major cities', icon: 'train' },
      { name: 'Beem', description: 'Mobile payments', icon: 'wallet' },
    ] },
  ],
};

type FilterId = 'all' | string;

function AppCard({ app }: { app: AppEntry }) {
  const handleOpen = (url: string | undefined) => {
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Please search for the app manually in your App Store.'),
    );
  };

  return (
    <View style={s.appCard}>
      <View style={[s.appIcon, { backgroundColor: app.iconColor + '18' }]}>
        <Ionicons name={app.icon as never} size={22} color={app.iconColor} />
      </View>
      <View style={s.appInfo}>
        <View style={s.appNameRow}>
          <Text style={s.appName}>{app.name}</Text>
          {app.free
            ? <View style={s.freeBadge}><Text style={s.freeText}>FREE</Text></View>
            : <View style={s.paidBadge}><Text style={s.paidText}>PAID</Text></View>}
        </View>
        <Text style={s.appTagline}>{app.tagline}</Text>
        <Text style={s.appDesc}>{app.description}</Text>
        {app.tip && (
          <View style={s.tipRow}>
            <Ionicons name="bulb-outline" size={13} color={colors.warning} />
            <Text style={s.tipText}>{app.tip}</Text>
          </View>
        )}
        <View style={s.platformRow}>
          {app.platforms.includes('ios') && (
            <View style={s.platformBadge}>
              <Ionicons name="logo-apple" size={11} color={colors.textTertiary} />
              <Text style={s.platformText}>iOS</Text>
            </View>
          )}
          {app.platforms.includes('android') && (
            <View style={s.platformBadge}>
              <Ionicons name="logo-android" size={11} color={colors.textTertiary} />
              <Text style={s.platformText}>Android</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export function LocalAppsScreen() {
  const navigation = useNavigation();
  const { location } = useAppContext();
  const [filter, setFilter] = useState<FilterId>('all');
  const countryApps = location.selectedCountryName ? COUNTRY_LOCAL_APPS[location.selectedCountryName] : undefined;

  const visibleCategories = filter === 'all'
    ? APP_CATEGORIES
    : APP_CATEGORIES.filter((c) => c.id === filter);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={s.title}>Essential Travel Apps</Text>
      </View>
      <ViewingLocationBanner />

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={s.chipRow}
      >
        <TouchableOpacity
          style={[s.chip, filter === 'all' && s.chipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[s.chipText, filter === 'all' && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {APP_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.chip, filter === cat.id && s.chipActive, filter === cat.id && { borderColor: cat.color }]}
            onPress={() => setFilter(cat.id)}
          >
            <Ionicons name={cat.icon as never} size={13} color={filter === cat.id ? cat.color : colors.textTertiary} />
            <Text style={[s.chipText, filter === cat.id && s.chipTextActive, filter === cat.id && { color: cat.color }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.scroll}>
        {countryApps && (
          <View style={s.countrySection}>
            <View style={s.countryHeader}>
              <View style={s.countryIcon}>
                <Ionicons name="location" size={16} color={colors.brandDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.countryTitle}>Also useful in {location.selectedCountryName}</Text>
                <Text style={s.countrySubtitle}>Country-specific apps from the legacy travel guide.</Text>
              </View>
            </View>
            {countryApps.map((category) => (
              <View key={category.label} style={s.countryGroup}>
                <Text style={[s.countryGroupTitle, { color: category.color }]}>{category.label}</Text>
                <View style={s.localAppsGrid}>
                  {category.apps.map((app) => (
                    <View key={`${category.label}-${app.name}`} style={s.localAppPill}>
                      <View style={[s.localIcon, { backgroundColor: category.color + '18' }]}>
                        <Ionicons name={app.icon as never} size={16} color={category.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.localAppName}>{app.name}</Text>
                        <Text style={s.localAppDesc}>{app.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View style={s.offlineTip}>
              <Ionicons name="download-outline" size={15} color={colors.brandDark} />
              <Text style={s.offlineTipText}>Install and sign in on Wi-Fi before travelling. Some apps need SMS verification or local payment setup.</Text>
            </View>
          </View>
        )}

        {visibleCategories.map((cat) => (
          <View key={cat.id} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon as never} size={16} color={cat.color} />
              </View>
              <Text style={s.sectionTitle}>{cat.label}</Text>
            </View>
            {cat.apps.map((app) => (
              <AppCard key={app.name} app={app} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  chipRow: { borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  chips: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.brandLight + '30', borderColor: colors.brandDark },
  chipText: { ...typography.caption, color: colors.textTertiary, fontWeight: '600' },
  chipTextActive: { color: colors.brandDark },
  scroll: { padding: spacing.base, gap: spacing.lg, paddingBottom: spacing.xl },
  countrySection: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  countryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  countryIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandLight + '30', alignItems: 'center', justifyContent: 'center' },
  countryTitle: { ...typography.h4, color: colors.textPrimary },
  countrySubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  countryGroup: { gap: spacing.xs },
  countryGroupTitle: { ...typography.label },
  localAppsGrid: { gap: spacing.sm },
  localAppPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderRadius: 12, padding: spacing.sm },
  localIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  localAppName: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
  localAppDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  offlineTip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, backgroundColor: colors.brandLight + '20', borderRadius: 10, padding: spacing.sm },
  offlineTipText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 17 },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  catIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...typography.h4, color: colors.textPrimary },
  appCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  appIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  appInfo: { flex: 1, gap: spacing.xs },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  appName: { ...typography.body, color: colors.textPrimary, fontWeight: '700', flex: 1 },
  freeBadge: { backgroundColor: colors.safetyHigh + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  freeText: { ...typography.caption, color: colors.safetyHigh, fontWeight: '700', fontSize: 9 },
  paidBadge: { backgroundColor: colors.warning + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  paidText: { ...typography.caption, color: colors.warning, fontWeight: '700', fontSize: 9 },
  appTagline: { ...typography.bodySmall, color: colors.brandDark, fontWeight: '600' },
  appDesc: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 19 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, backgroundColor: colors.warning + '12', borderRadius: 8, padding: spacing.sm },
  tipText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 17 },
  platformRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  platformBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  platformText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
});

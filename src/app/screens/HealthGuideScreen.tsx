import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';

// ─── Static data ─────────────────────────────────────────────────────────────

interface VaccineEntry {
  name: string;
  notes: string;
  required: boolean;
}

interface CountryHealth {
  country: string;
  flag: string;
  risk: 'low' | 'medium' | 'high';
  vaccines: VaccineEntry[];
  tips: string[];
}

const COUNTRY_HEALTH: CountryHealth[] = [
  {
    country: 'Thailand', flag: '🇹🇭', risk: 'medium',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended for all travellers', required: false },
      { name: 'Typhoid', notes: 'Recommended, especially if eating street food', required: false },
      { name: 'Rabies', notes: 'Consider if hiking or working with animals', required: false },
      { name: 'Japanese Encephalitis', notes: 'Consider for rural or long-stay visits', required: false },
    ],
    tips: ['Use DEET mosquito repellent — dengue is present', 'Drink bottled or boiled water only', 'Be cautious with raw salads and ice from unknown sources'],
  },
  {
    country: 'Indonesia', flag: '🇮🇩', risk: 'medium',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended for all travellers', required: false },
      { name: 'Typhoid', notes: 'Recommended', required: false },
      { name: 'Malaria', notes: 'Prophylaxis recommended for Lombok, Komodo, Papua', required: false },
      { name: 'Rabies', notes: 'Recommended for Bali and rural areas', required: false },
    ],
    tips: ['Monkey bites in Bali carry rabies risk — seek care immediately', 'Dengue and malaria risk varies by island', 'Tap water is not safe to drink anywhere'],
  },
  {
    country: 'Vietnam', flag: '🇻🇳', risk: 'medium',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Recommended', required: false },
      { name: 'Japanese Encephalitis', notes: 'Consider for rural areas', required: false },
    ],
    tips: ['Traffic accidents are the leading cause of tourist injury', 'Street food is generally safe — choose busy stalls with high turnover', 'Dengue peaks May–November'],
  },
  {
    country: 'India', flag: '🇮🇳', risk: 'high',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Strongly recommended', required: false },
      { name: 'Cholera', notes: 'Consider for rural areas', required: false },
      { name: 'Malaria', notes: 'Prophylaxis recommended for rural areas; not needed in major cities', required: false },
      { name: 'Rabies', notes: 'Recommended if you may be near stray dogs', required: false },
    ],
    tips: ['Delhi belly is very common — bring oral rehydration salts', 'Avoid ice, tap water, and unpeeled fruit', 'Air quality in Delhi can be severe Oct–Feb — pack N95 masks'],
  },
  {
    country: 'Kenya', flag: '🇰🇪', risk: 'high',
    vaccines: [
      { name: 'Yellow Fever', notes: 'Required if arriving from endemic country; recommended otherwise', required: true },
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Recommended', required: false },
      { name: 'Malaria', notes: 'Prophylaxis strongly recommended — take before, during, and after trip', required: false },
      { name: 'Meningococcal', notes: 'Recommended for the "meningitis belt" regions', required: false },
    ],
    tips: ['Start malaria prophylaxis before departure', 'Use permethrin-treated clothing and nets', 'High altitude areas (Nairobi, Rift Valley) have lower malaria risk'],
  },
  {
    country: 'Egypt', flag: '🇪🇬', risk: 'medium',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Recommended', required: false },
      { name: 'Hepatitis B', notes: 'Recommended for longer stays', required: false },
    ],
    tips: ['Traveller\'s diarrhoea is very common — stay strictly hydrated', 'Use sunscreen; heat exhaustion risk is high', 'Avoid swimming in the Nile'],
  },
  {
    country: 'Mexico', flag: '🇲🇽', risk: 'medium',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Recommended outside tourist resorts', required: false },
    ],
    tips: ['Montezuma\'s Revenge (traveller\'s diarrhoea) is common — stick to purified water', 'Mosquito repellent is essential (Zika, dengue, chikungunya)', 'Altitude sickness possible in Mexico City (2,240m)'],
  },
  {
    country: 'Brazil', flag: '🇧🇷', risk: 'medium',
    vaccines: [
      { name: 'Yellow Fever', notes: 'Recommended for Amazon, Pantanal, and interior regions', required: false },
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Recommended', required: false },
      { name: 'Malaria', notes: 'Prophylaxis recommended for Amazon basin only', required: false },
    ],
    tips: ['Dengue, Zika, and chikungunya are widespread in cities', 'Yellow fever certificate required for some border crossings', 'Sun protection critical year-round'],
  },
  {
    country: 'Japan', flag: '🇯🇵', risk: 'low',
    vaccines: [
      { name: 'Japanese Encephalitis', notes: 'Consider for rural areas, especially during rice harvest (Jul–Oct)', required: false },
    ],
    tips: ['Tap water is safe to drink', 'Healthcare is excellent — carry your EHIC or travel insurance card', 'Allergy sufferers: cedar pollen season is Feb–May'],
  },
  {
    country: 'UK', flag: '🇬🇧', risk: 'low',
    vaccines: [],
    tips: ['Tap water is safe everywhere', 'NHS provides emergency treatment to all visitors', 'No specific health precautions needed for most travellers'],
  },
  {
    country: 'USA', flag: '🇺🇸', risk: 'low',
    vaccines: [],
    tips: ['Medical costs are extremely high — comprehensive travel insurance is essential', 'Carry copies of all prescriptions if bringing medication', 'Tick-borne Lyme disease is a risk in wooded areas of the north-east'],
  },
  {
    country: 'France', flag: '🇫🇷', risk: 'low',
    vaccines: [],
    tips: ['European Health Insurance Card (EHIC) valid for EU/EEA travellers', 'Pharmacies (look for green cross) can advise on minor ailments', 'Tap water is safe in all cities'],
  },
  {
    country: 'Australia', flag: '🇦🇺', risk: 'low',
    vaccines: [
      { name: 'Japanese Encephalitis', notes: 'Consider for north Queensland and Northern Territory', required: false },
    ],
    tips: ['UV radiation is extreme — use SPF 50+ sunscreen daily', 'Marine stingers (jellyfish) are a risk Oct–May in north Queensland', 'Ross River virus and dengue present in tropical north'],
  },
  {
    country: 'UAE', flag: '🇦🇪', risk: 'low',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
    ],
    tips: ['Heat stroke risk is extreme Jun–Sep — stay hydrated', 'MERS-CoV present in the region — avoid contact with camels', 'Tap water is technically safe but bottled water is recommended'],
  },
  {
    country: 'Philippines', flag: '🇵🇭', risk: 'medium',
    vaccines: [
      { name: 'Hepatitis A', notes: 'Recommended', required: false },
      { name: 'Typhoid', notes: 'Recommended', required: false },
      { name: 'Rabies', notes: 'Recommended — stray dog bites are common', required: false },
      { name: 'Malaria', notes: 'Prophylaxis recommended for Palawan and rural Mindanao', required: false },
    ],
    tips: ['Dengue is endemic year-round — use repellent', 'Typhoon season is Jun–Nov — monitor forecasts', 'Schistosomiasis risk in fresh water in some regions'],
  },
];

interface GeneralSection {
  id: string;
  icon: string;
  color: string;
  title: string;
  items: Array<{ heading: string; body: string }>;
}

const GENERAL_SECTIONS: GeneralSection[] = [
  {
    id: 'food-water',
    icon: 'water',
    color: '#2196F3',
    title: 'Food & Water Safety',
    items: [
      { heading: 'The golden rule', body: 'In developing countries: boil it, cook it, peel it, or forget it. Tap water is only safe in a handful of countries (Japan, UK, USA, Western Europe, Australia, New Zealand, Canada).' },
      { heading: 'Ice is often unsafe', body: 'Ice in drinks may be made with tap water. In lower-income countries, order drinks without ice or carry a portable water filter.' },
      { heading: 'Street food strategy', body: 'Street food with a high turnover and cooked in front of you is often safer than restaurant food. Avoid anything that\'s been sitting out at room temperature.' },
      { heading: 'Water purification', body: 'Carry iodine tablets or a SteriPen UV purifier as a backup. Portable filters (Sawyer Squeeze, LifeStraw) are useful for hiking trips.' },
    ],
  },
  {
    id: 'mosquitoes',
    icon: 'bug',
    color: '#FF9800',
    title: 'Mosquito-Borne Diseases',
    items: [
      { heading: 'Dengue fever', body: 'No vaccine widely available. Use DEET 30%+ repellent, wear long sleeves/trousers at dawn and dusk. Dengue mosquitoes bite during the day.' },
      { heading: 'Malaria', body: 'Prophylaxis (e.g. Malarone, Doxycycline) must be started before travel. Confirm whether your specific destination requires it — not all tropical regions are high-risk.' },
      { heading: 'Zika virus', body: 'Pregnant travellers should avoid high-risk areas. Use long-sleeved clothing and DEET. Zika can also be sexually transmitted.' },
      { heading: 'Repellent tips', body: 'Apply DEET after sunscreen, not before. Permethrin-treated clothing provides additional protection. Sleep under a mosquito net if accommodation is basic.' },
    ],
  },
  {
    id: 'medical-kit',
    icon: 'medkit',
    color: '#F44336',
    title: 'Travel Medical Kit',
    items: [
      { heading: 'Essential medications', body: 'Paracetamol / ibuprofen, antihistamine (oral + topical), antidiarrhoeal (loperamide), oral rehydration salts, antacid, motion sickness tablets.' },
      { heading: 'Wound care', body: 'Antiseptic wipes and cream, sterile adhesive dressings in assorted sizes, medical tape, tweezers (for splinters/ticks), blister plasters.' },
      { heading: 'Prescription items', body: 'Bring a sufficient supply of all regular prescriptions plus 2 weeks\' extra. Carry prescriptions in your name. Some medications are controlled or illegal in certain countries.' },
      { heading: 'Extras for high-risk destinations', body: 'Consider: water purification tablets, insect repellent wipes, altitude sickness medication (acetazolamide), a thermometer, nitrile gloves.' },
    ],
  },
  {
    id: 'finding-care',
    icon: 'business',
    color: '#4CAF50',
    title: 'Finding Medical Care Abroad',
    items: [
      { heading: 'Before you go', body: 'Note your travel insurer\'s 24-hour emergency number. Research the nearest international hospital to your destination. Save your embassy number — they can recommend approved hospitals.' },
      { heading: 'In an emergency', body: 'Go directly to the nearest hospital emergency department. Show your travel insurance card immediately — many international hospitals won\'t turn away insured patients. Call your insurer before expensive treatment if possible.' },
      { heading: 'Pharmacies', body: 'In many countries (Thailand, Italy, France, Mexico) pharmacists can prescribe and dispense medications that would require a prescription at home. They\'re your first port of call for minor ailments.' },
      { heading: 'Paying for care', body: 'Keep all receipts for any medical treatment — you\'ll need them for insurance claims. Take photos of prescriptions, X-rays, and doctor\'s notes before leaving the clinic.' },
    ],
  },
  {
    id: 'altitude',
    icon: 'trending-up',
    color: '#9C27B0',
    title: 'Altitude & Environmental Risks',
    items: [
      { heading: 'Altitude sickness (AMS)', body: 'Begins at ~2,500m. Symptoms: headache, nausea, fatigue. Ascend slowly (no more than 500m/day above 3,000m). Descend immediately if symptoms worsen. Acetazolamide can help prevent AMS.' },
      { heading: 'Heat exhaustion', body: 'Common in the Middle East, South Asia, and sub-Saharan Africa. Drink 2–3L water per day, rest during midday heat, and wear a hat. Heat stroke is a medical emergency — cool the person down and seek help immediately.' },
      { heading: 'Sun exposure', body: 'UV radiation is strongest near the equator, at altitude, and over snow/water. SPF 30+ minimum; reapply every 2 hours. Seek shade between 10am–4pm.' },
      { heading: 'Cold weather', body: 'Hypothermia and frostbite are risks in mountain and polar environments. Dress in layers (moisture-wicking base, insulating mid, wind/waterproof outer). Wet clothing loses 90% of insulating value.' },
    ],
  },
];

type ViewMode = 'general' | 'destinations';

function riskColor(risk: 'low' | 'medium' | 'high'): string {
  return risk === 'low' ? colors.safetyHigh : risk === 'medium' ? colors.safetyMedium : colors.safetyLow;
}

function riskLabel(risk: 'low' | 'medium' | 'high'): string {
  return risk === 'low' ? 'LOW RISK' : risk === 'medium' ? 'MEDIUM RISK' : 'HIGH RISK';
}

// ─── Accordion card ───────────────────────────────────────────────────────────

function SectionCard({ section }: { section: GeneralSection }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.card}>
      <TouchableOpacity style={s.cardHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.75}>
        <View style={[s.iconCircle, { backgroundColor: section.color + '20' }]}>
          <Ionicons name={section.icon as never} size={20} color={section.color} />
        </View>
        <Text style={s.cardTitle}>{section.title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
      </TouchableOpacity>
      {open && (
        <View style={s.cardBody}>
          {section.items.map((item, i) => (
            <View key={i} style={[s.item, i > 0 && s.itemBorder]}>
              <Text style={s.itemHeading}>{item.heading}</Text>
              <Text style={s.itemBody}>{item.body}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Country health card ──────────────────────────────────────────────────────

function CountryCard({ entry }: { entry: CountryHealth }) {
  const [open, setOpen] = useState(false);
  const rc = riskColor(entry.risk);
  return (
    <View style={s.card}>
      <TouchableOpacity style={s.cardHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.75}>
        <Text style={s.flag}>{entry.flag}</Text>
        <Text style={s.cardTitle}>{entry.country}</Text>
        <View style={[s.riskBadge, { backgroundColor: rc + '20' }]}>
          <Text style={[s.riskText, { color: rc }]}>{riskLabel(entry.risk)}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
      </TouchableOpacity>
      {open && (
        <View style={s.cardBody}>
          {entry.vaccines.length > 0 && (
            <>
              <Text style={s.subSection}>Vaccinations</Text>
              {entry.vaccines.map((v, i) => (
                <View key={i} style={[s.vaccineRow, i > 0 && s.itemBorder]}>
                  <View style={[s.vaccineDot, { backgroundColor: v.required ? colors.error : colors.info }]} />
                  <View style={s.vaccineInfo}>
                    <Text style={s.vaccineName}>
                      {v.name}{v.required ? ' *' : ''}
                    </Text>
                    <Text style={s.vaccineNotes}>{v.notes}</Text>
                  </View>
                </View>
              ))}
              {entry.vaccines.some((v) => v.required) && (
                <Text style={s.requiredNote}>* Required for entry</Text>
              )}
            </>
          )}
          {entry.vaccines.length === 0 && (
            <Text style={s.noVaccines}>No specific vaccinations required.</Text>
          )}
          {entry.tips.length > 0 && (
            <>
              <Text style={[s.subSection, { marginTop: spacing.md }]}>Health Tips</Text>
              {entry.tips.map((tip, i) => (
                <View key={i} style={s.tipRow}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.info} />
                  <Text style={s.tipText}>{tip}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HealthGuideScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<ViewMode>('general');
  const [query, setQuery] = useState('');

  const filtered = query
    ? COUNTRY_HEALTH.filter((c) => c.country.toLowerCase().includes(query.toLowerCase()))
    : COUNTRY_HEALTH;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={s.title}>Health Guide</Text>
      </View>

      {/* Mode toggle */}
      <View style={s.toggle}>
        <TouchableOpacity
          style={[s.toggleBtn, mode === 'general' && s.toggleBtnActive]}
          onPress={() => setMode('general')}
        >
          <Ionicons name="medkit" size={15} color={mode === 'general' ? colors.brandDark : colors.textTertiary} />
          <Text style={[s.toggleText, mode === 'general' && s.toggleTextActive]}>General</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, mode === 'destinations' && s.toggleBtnActive]}
          onPress={() => setMode('destinations')}
        >
          <Ionicons name="globe" size={15} color={mode === 'destinations' ? colors.brandDark : colors.textTertiary} />
          <Text style={[s.toggleText, mode === 'destinations' && s.toggleTextActive]}>Destinations</Text>
        </TouchableOpacity>
      </View>

      {mode === 'destinations' && (
        <View style={s.searchRow}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries..."
            placeholderTextColor={colors.placeholder}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll}>
        {mode === 'general'
          ? GENERAL_SECTIONS.map((sec) => <SectionCard key={sec.id} section={sec} />)
          : filtered.map((entry) => <CountryCard key={entry.country} entry={entry} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  toggle: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  toggleBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.brandDark },
  toggleText: { ...typography.bodySmall, color: colors.textTertiary },
  toggleTextActive: { color: colors.brandDark, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: spacing.base, marginBottom: 0, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: spacing.md, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.md },
  scroll: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.sm },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flag: { fontSize: 24 },
  cardTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700', flex: 1 },
  riskBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  riskText: { ...typography.caption, fontWeight: '700', fontSize: 10 },
  cardBody: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.base, gap: spacing.sm },
  item: { paddingTop: spacing.sm },
  itemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  itemHeading: { ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  itemBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  subSection: { ...typography.caption, color: colors.brandDark, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
  vaccineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingTop: spacing.sm },
  vaccineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  vaccineInfo: { flex: 1 },
  vaccineName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  vaccineNotes: { ...typography.bodySmall, color: colors.textSecondary },
  requiredNote: { ...typography.caption, color: colors.error, fontStyle: 'italic', marginTop: spacing.xs },
  noVaccines: { ...typography.bodySmall, color: colors.textTertiary, fontStyle: 'italic' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  tipText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});

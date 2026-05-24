import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';
import type { LatLng } from '@shared/contracts/PlacesClient';
import { useLocation } from '@modules/maps';
import { useAppContext } from '../AppContext';
import { ViewingLocationBanner } from '../components/ViewingLocationBanner';

// WMO weather code → description + icon
function describeWeather(code: number): { label: string; icon: string; color: string } {
  if (code === 0)              return { label: 'Clear sky',          icon: 'sunny',             color: '#FFB300' };
  if (code <= 2)               return { label: 'Partly cloudy',      icon: 'partly-sunny',      color: '#FFA726' };
  if (code === 3)              return { label: 'Overcast',           icon: 'cloud',             color: '#78909C' };
  if (code <= 49)              return { label: 'Foggy',              icon: 'cloud',             color: '#90A4AE' };
  if (code <= 59)              return { label: 'Drizzle',            icon: 'rainy',             color: '#42A5F5' };
  if (code <= 69)              return { label: 'Rain',               icon: 'rainy',             color: '#1E88E5' };
  if (code <= 79)              return { label: 'Snow',               icon: 'snow',              color: '#80DEEA' };
  if (code <= 82)              return { label: 'Rain showers',       icon: 'thunderstorm',      color: '#1976D2' };
  if (code <= 86)              return { label: 'Snow showers',       icon: 'snow',              color: '#4DD0E1' };
  if (code === 95)             return { label: 'Thunderstorm',       icon: 'thunderstorm',      color: '#5C6BC0' };
  if (code <= 99)              return { label: 'Thunderstorm + hail',icon: 'thunderstorm',      color: '#3949AB' };
  return                              { label: 'Unknown',            icon: 'cloud-outline',     color: '#78909C' };
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
  };
  daily: Array<{
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    precipitation: number;
    uvIndex: number;
  }>;
  timezone: string;
  locationName: string | null;
}

const gpsService = new ExpoLocationService();

async function fetchWeather(coords: LatLng, locationName: string | null): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
    `&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = await res.json() as {
    current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number };
    daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; uv_index_max: number[] };
    timezone: string;
  };

  return {
    current: {
      temp: Math.round(json.current.temperature_2m),
      feelsLike: Math.round(json.current.apparent_temperature),
      humidity: json.current.relative_humidity_2m,
      windSpeed: Math.round(json.current.wind_speed_10m),
      weatherCode: json.current.weather_code,
    },
    daily: json.daily.time.map((date, i) => ({
      date,
      weatherCode: json.daily.weather_code[i],
      tempMax: Math.round(json.daily.temperature_2m_max[i]),
      tempMin: Math.round(json.daily.temperature_2m_min[i]),
      precipitation: Math.round(json.daily.precipitation_sum[i]),
      uvIndex: Math.round(json.daily.uv_index_max[i] ?? 0),
    })),
    timezone: json.timezone,
    locationName,
  };
}

export function WeatherScreen() {
  const navigation = useNavigation();
  const { location: appLocation } = useAppContext();
  const { location } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (c: LatLng, name: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(c, name);
      setWeather(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  const locateAndLoad = useCallback(async () => {
    setLocating(true);
    const c = await gpsService.getCurrentPosition();
    if (!c) { setLocating(false); setError('Location permission denied'); return; }
    const geo = await gpsService.reverseGeocode(c);
    const name = [geo?.city, geo?.country].filter(Boolean).join(', ') || null;
    setCoords(c);
    setLocating(false);
    load(c, name);
  }, [load]);

  // Use selected app location first; the refresh/locate button can still switch to GPS.
  useEffect(() => {
    if (location?.coordinates) {
      const name = [appLocation.selectedCityName, appLocation.selectedCountryName].filter(Boolean).join(', ') || null;
      setCoords(location.coordinates);
      load(location.coordinates, name);
    } else {
      locateAndLoad();
    }
  }, [location?.coordinates?.lat, location?.coordinates?.lng, appLocation.selectedCityName, appLocation.selectedCountryName, load, locateAndLoad]);

  const cond = weather ? describeWeather(weather.current.weatherCode) : null;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={s.title}>Weather</Text>
        <TouchableOpacity
          onPress={() => coords ? load(coords, weather?.locationName ?? null) : locateAndLoad()}
          disabled={loading || locating}
          style={s.back}
        >
          {(loading || locating)
            ? <ActivityIndicator size="small" color={colors.textInverse} />
            : <Ionicons name="refresh" size={22} color={colors.textInverse} />}
        </TouchableOpacity>
      </View>
      <ViewingLocationBanner />

      {error && !weather ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textTertiary} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={locateAndLoad}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (loading || locating) && !weather ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.brandDark} />
          <Text style={s.loadingText}>Getting your location…</Text>
        </View>
      ) : weather && cond ? (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => coords ? load(coords, weather.locationName) : locateAndLoad()}
              tintColor={colors.brandDark}
            />
          }
        >
          {/* Current conditions hero */}
          <View style={[s.hero, { backgroundColor: cond.color + '18' }]}>
            <Ionicons name={cond.icon as never} size={72} color={cond.color} />
            <Text style={s.tempBig}>{weather.current.temp}°C</Text>
            <Text style={s.condLabel}>{cond.label}</Text>
            {weather.locationName && (
              <View style={s.locationRow}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={s.locationText}>{weather.locationName}</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <Stat icon="thermometer" label="Feels like" value={`${weather.current.feelsLike}°C`} />
            <Stat icon="water" label="Humidity" value={`${weather.current.humidity}%`} />
            <Stat icon="speedometer" label={getWindSpeedLevel(weather.current.windSpeed)} value={`${weather.current.windSpeed} km/h`} />
            <Stat icon="sunny" label={getUVIndexLevel(weather.daily[0]?.uvIndex ?? 0).level} value={`UV ${weather.daily[0]?.uvIndex ?? 0}`} />
          </View>

          <View style={s.recommendation}>
            <Ionicons name="sparkles-outline" size={20} color={travelRecommendation(weather).color} />
            <View style={{ flex: 1 }}>
              <Text style={s.recommendationTitle}>Travel recommendation</Text>
              <Text style={s.recommendationText}>{travelRecommendation(weather).text}</Text>
            </View>
          </View>

          <View style={s.suggestions}>
            <Text style={s.sectionTitle}>Packing Suggestions</Text>
            {packingSuggestions(weather).map((item) => (
              <View key={item} style={s.suggestionRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={s.suggestionText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* 7-day forecast */}
          <Text style={s.sectionTitle}>7-Day Forecast</Text>
          <View style={s.forecast}>
            {weather.daily.map((day, i) => {
              const d = describeWeather(day.weatherCode);
              return (
                <View key={day.date} style={[s.dayRow, i < weather.daily.length - 1 && s.dayBorder]}>
                  <Text style={s.dayLabel}>{dayLabel(day.date, i)}</Text>
                  <Ionicons name={d.icon as never} size={20} color={d.color} />
                  <Text style={s.dayDesc}>{d.label}</Text>
                  {day.precipitation > 0 && (
                    <View style={s.rainRow}>
                      <Ionicons name="rainy-outline" size={12} color="#1E88E5" />
                      <Text style={s.rainText}>{day.precipitation}mm</Text>
                    </View>
                  )}
                  <View style={s.tempRange}>
                    <Text style={s.tempHigh}>{day.tempMax}°</Text>
                    <Text style={s.tempLow}>{day.tempMin}°</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={s.source}>Data: Open-Meteo.com · {weather.timezone}</Text>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Ionicons name={icon as never} size={20} color={colors.brandDark} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function getUVIndexLevel(uvIndex: number): { level: string; color: string } {
  if (uvIndex <= 2) return { level: 'Low', color: colors.success };
  if (uvIndex <= 5) return { level: 'Moderate', color: colors.warning };
  if (uvIndex <= 7) return { level: 'High', color: '#FF9800' };
  if (uvIndex <= 10) return { level: 'Very High', color: colors.error };
  return { level: 'Extreme', color: '#9C27B0' };
}

function getWindSpeedLevel(speed: number): string {
  if (speed < 12) return 'Light wind';
  if (speed < 30) return 'Moderate wind';
  if (speed < 50) return 'Strong wind';
  return 'Very strong wind';
}

function travelRecommendation(weather: WeatherData): { text: string; color: string } {
  const today = weather.daily[0];
  if (weather.current.temp < 0 || weather.current.temp > 38) {
    return { text: 'Extreme temperatures. Limit outdoor activity and plan extra water or warm layers.', color: colors.error };
  }
  if (weather.current.weatherCode >= 95 || weather.current.windSpeed > 50) {
    return { text: 'Severe weather conditions. Avoid non-essential travel if possible.', color: colors.error };
  }
  if ((today?.precipitation ?? 0) > 50 || weather.current.weatherCode >= 80) {
    return { text: 'Heavy precipitation expected. Pack rain gear and allow extra travel time.', color: colors.warning };
  }
  if ((today?.precipitation ?? 0) > 20 || weather.current.windSpeed > 30 || weather.current.temp < 10 || weather.current.temp > 30) {
    return { text: 'Moderate weather conditions. Pack appropriately for the forecast.', color: colors.warning };
  }
  return { text: 'Good weather conditions for travel. Keep checking local updates.', color: colors.info };
}

function packingSuggestions(weather: WeatherData): string[] {
  const today = weather.daily[0];
  const suggestions: string[] = [];
  if ((today?.tempMin ?? weather.current.temp) < 10) {
    suggestions.push('Warm jacket or coat');
    suggestions.push('Long pants and sweaters');
  } else if ((today?.tempMin ?? weather.current.temp) < 20) {
    suggestions.push('Light jacket or cardigan');
  }
  if ((today?.tempMax ?? weather.current.temp) > 25) {
    suggestions.push('Light, breathable clothing');
    suggestions.push('Shorts and t-shirts');
  }
  if ((today?.precipitation ?? 0) > 30) {
    suggestions.push('Rain jacket or umbrella');
    suggestions.push('Waterproof shoes');
  }
  if ((today?.uvIndex ?? 0) > 6) {
    suggestions.push('Sunscreen SPF 30+');
    suggestions.push('Sunglasses and hat');
  }
  if (suggestions.length === 0) suggestions.push('Standard travel clothing');
  return suggestions;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  retryBtn: { backgroundColor: colors.brandDark, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...typography.body, color: colors.textInverse },
  scroll: { padding: spacing.base, paddingBottom: spacing.xl },
  hero: { borderRadius: 20, alignItems: 'center', padding: spacing.xl, marginBottom: spacing.md, gap: spacing.xs },
  tempBig: { fontSize: 72, fontWeight: '200', color: colors.textPrimary, lineHeight: 80 },
  condLabel: { ...typography.h3, color: colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  locationText: { ...typography.bodySmall, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.card, borderRadius: 16, padding: spacing.base, marginBottom: spacing.md },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { ...typography.h4, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  recommendation: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: 16, padding: spacing.base, marginBottom: spacing.md },
  recommendationTitle: { ...typography.label, color: colors.textPrimary },
  recommendationText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  suggestions: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.base, marginBottom: spacing.md },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  suggestionText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  forecast: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', marginBottom: spacing.md },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  dayBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dayLabel: { ...typography.body, color: colors.textPrimary, width: 90 },
  dayDesc: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  rainRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rainText: { ...typography.caption, color: '#1E88E5' },
  tempRange: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  tempHigh: { ...typography.body, color: colors.textPrimary, fontWeight: '600', width: 36, textAlign: 'right' },
  tempLow: { ...typography.bodySmall, color: colors.textTertiary, width: 30, textAlign: 'right' },
  source: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
});

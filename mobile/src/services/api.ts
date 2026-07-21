import axios from 'axios';
import Constants from 'expo-constants';

type PredictionRequestPayload = {
  Date: string;
  'Area Name': string;
  'Road/Intersection Name': string;
  'Traffic Volume': number;
  'Average Speed': number;
  'Travel Time Index': number;
  'Road Capacity Utilization': number;
  'Incident Reports': number;
  'Environmental Impact': number;
  'Public Transport Usage': number;
  'Traffic Signal Compliance': number;
  'Parking Usage': number;
  'Pedestrian and Cyclist Count': number;
  'Weather Conditions': string;
  'Roadwork and Construction Activity': string;
};

type PredictionResponse = {
  congestionClass: 'Low' | 'Medium' | 'High';
  confidence: number;
  timestamp: string;
  success: boolean;
};

type WeatherResponse = {
  location: {
    city: string;
    country?: string | null;
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility?: number | null;
  wind_speed?: number | null;
  cloud_cover?: number | null;
  conditions: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
};

const appConfig = Constants.expoConfig ?? Constants.manifest2?.extra ?? {};
const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? appConfig.extra?.apiBaseUrl ?? 'http://10.0.2.2:8000';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export async function predictCongestion(payload: PredictionRequestPayload): Promise<PredictionResponse> {
  const response = await apiClient.post<PredictionResponse>('/api/predict', payload);
  return response.data;
}

export async function getLiveWeather(params: {
  latitude?: number;
  longitude?: number;
  city?: string;
}): Promise<WeatherResponse> {
  const response = await apiClient.get<WeatherResponse>('/api/v1/weather', {
    params,
  });
  return response.data;
}

export type { PredictionRequestPayload, PredictionResponse, WeatherResponse };

import { useEffect, useMemo, useState } from 'react';

import { getLiveWeather, predictCongestion, type PredictionRequestPayload } from '@/services/api';
import { useHomeMap } from '@/hooks/use-home-map';

const DEFAULT_VALUES = {
  date: '2022-01-01',
  areaName: 'Indiranagar',
  roadIntersectionName: '100 Feet Road',
  trafficVolume: '50590',
  averageSpeed: '50.23',
  travelTimeIndex: '1.5',
  roadCapacityUtilization: '100',
  incidentReports: '0',
  environmentalImpact: '151.18',
  publicTransportUsage: '70.63',
  trafficSignalCompliance: '84.04',
  parkingUsage: '85.40',
  pedestrianAndCyclistCount: '111',
  weatherConditions: 'Clear',
  roadworkAndConstructionActivity: 'No',
};

export function useTrafficPrediction() {
  const homeMap = useHomeMap();
  const [form, setForm] = useState(DEFAULT_VALUES);
  const [weatherLabel, setWeatherLabel] = useState<string | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    congestionClass: 'Low' | 'Medium' | 'High';
    confidence: number;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    async function loadWeather() {
      if (!homeMap.currentLocation) {
        return;
      }

      try {
        setIsWeatherLoading(true);
        const weather = await getLiveWeather({
          latitude: homeMap.currentLocation.latitude,
          longitude: homeMap.currentLocation.longitude,
        });
        const liveLabel = weather.conditions[0]?.main ?? weather.location.city;
        setWeatherLabel(liveLabel);
        setForm((previous) => ({
          ...previous,
          weatherConditions: liveLabel,
          areaName: weather.location.city,
        }));
      } catch {
        setWeatherLabel(null);
      } finally {
        setIsWeatherLoading(false);
      }
    }

    loadWeather();
  }, [homeMap.currentLocation]);

  const routeSuggestion = useMemo(() => {
    if (!homeMap.destination) {
      return 'Choose a destination to generate a route suggestion.';
    }

    return `${homeMap.destination.label} via ${homeMap.destination.subtitle}`;
  }, [homeMap.destination]);

  async function analyzeRoute() {
    try {
      setIsPredicting(true);
      setErrorMessage(null);

      if (!homeMap.currentLocation || !homeMap.destination) {
        throw new Error('Current location and destination are required.');
      }

      const payload: PredictionRequestPayload = {
        Date: form.date,
        'Area Name': form.areaName,
        'Road/Intersection Name': homeMap.destination.label,
        'Traffic Volume': Number(form.trafficVolume),
        'Average Speed': Number(form.averageSpeed),
        'Travel Time Index': Number(form.travelTimeIndex),
        'Road Capacity Utilization': Number(form.roadCapacityUtilization),
        'Incident Reports': Number(form.incidentReports),
        'Environmental Impact': Number(form.environmentalImpact),
        'Public Transport Usage': Number(form.publicTransportUsage),
        'Traffic Signal Compliance': Number(form.trafficSignalCompliance),
        'Parking Usage': Number(form.parkingUsage),
        'Pedestrian and Cyclist Count': Number(form.pedestrianAndCyclistCount),
        'Weather Conditions': form.weatherConditions,
        'Roadwork and Construction Activity': form.roadworkAndConstructionActivity,
      };

      const response = await predictCongestion(payload);
      setResult({
        congestionClass: response.congestionClass,
        confidence: response.confidence,
        timestamp: response.timestamp,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to analyze the route.';
      setErrorMessage(message);
    } finally {
      setIsPredicting(false);
    }
  }

  return {
    ...homeMap,
    form,
    setForm,
    weatherLabel,
    isWeatherLoading,
    isPredicting,
    errorMessage,
    result,
    routeSuggestion,
    analyzeRoute,
  };
}

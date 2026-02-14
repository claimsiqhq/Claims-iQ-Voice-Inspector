import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Thermometer, Droplets, AlertTriangle, CheckCircle2, XCircle, Info, Loader2, ShieldAlert, ShieldCheck, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface WeatherDay {
  datetime: string;
  tempmax: number;
  tempmin: number;
  temp: number;
  humidity: number;
  precip: number;
  preciptype: string[] | null;
  windspeed: number;
  windgust: number;
  winddir: number;
  conditions: string;
  description: string;
  icon: string;
  severerisk: number;
  snow: number;
  snowdepth: number;
  visibility: number;
  pressure: number;
  cloudcover: number;
}

interface FraudIndicator {
  type: "match" | "mismatch" | "warning" | "info";
  category: string;
  message: string;
  severity: "high" | "medium" | "low";
}

interface PerilAnalysis {
  claimedPeril: string;
  weatherSupportsPeril: boolean;
  confidence: "high" | "medium" | "low" | "no_data";
  details: string;
  relevantConditions: string[];
  severityLevel: "extreme" | "severe" | "moderate" | "mild" | "none";
}

interface WeatherCorrelationData {
  location: string;
  dateOfLoss: string;
  dateRange: { start: string; end: string };
  lossDateWeather: WeatherDay | null;
  surroundingDays: WeatherDay[];
  perilAnalysis: PerilAnalysis;
  fraudIndicators: FraudIndicator[];
  overallRiskScore: number;
  weatherSummary: string;
  dataSource: string;
}

function getWeatherIcon(icon: string, size = 20) {
  if (icon?.includes("snow")) return <CloudSnow size={size} />;
  if (icon?.includes("rain") || icon?.includes("showers")) return <CloudRain size={size} />;
  if (icon?.includes("wind")) return <Wind size={size} />;
  if (icon?.includes("clear") || icon?.includes("sun")) return <Sun size={size} />;
  return <Cloud size={size} />;
}

function getRiskColor(score: number) {
  if (score <= 25) return "text-green-600 bg-green-50 border-green-200";
  if (score <= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  if (score <= 75) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function getRiskLabel(score: number) {
  if (score <= 25) return "Low Risk";
  if (score <= 50) return "Moderate";
  if (score <= 75) return "Elevated";
  return "High Risk";
}

function getConfidenceBadge(confidence: string) {
  const colors: Record<string, string> = {
    high: "bg-green-100 text-green-700 border-green-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-orange-100 text-orange-700 border-orange-300",
    no_data: "bg-gray-100 text-gray-600 border-gray-300",
  };
  return colors[confidence] || colors.no_data;
}

function getSeverityBadge(severity: string) {
  const colors: Record<string, string> = {
    extreme: "bg-red-600 text-white",
    severe: "bg-red-500 text-white",
    moderate: "bg-orange-500 text-white",
    mild: "bg-yellow-500 text-white",
    none: "bg-gray-200 text-gray-600",
  };
  return colors[severity] || colors.none;
}

function getIndicatorIcon(type: string) {
  switch (type) {
    case "match": return <CheckCircle2 size={16} className="text-green-600 shrink-0" />;
    case "mismatch": return <XCircle size={16} className="text-red-600 shrink-0" />;
    case "warning": return <AlertTriangle size={16} className="text-orange-500 shrink-0" />;
    default: return <Info size={16} className="text-blue-500 shrink-0" />;
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return dateStr; }
}

export default function WeatherCorrelation({ claimId }: { claimId: number | string }) {
  const [showTimeline, setShowTimeline] = useState(false);

  const { data, isLoading, error } = useQuery<WeatherCorrelationData>({
    queryKey: [`/api/claims/${claimId}/weather-correlation`],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card data-testid="weather-correlation-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-primary">
            <Cloud className="h-5 w-5" /> Weather Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Analyzing weather data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errMsg = (error as any)?.message || "Unable to fetch weather data";
    return (
      <Card data-testid="weather-correlation-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-primary">
            <Cloud className="h-5 w-5" /> Weather Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground py-4">
            <AlertTriangle size={18} className="text-orange-400" />
            <span className="text-sm">{errMsg.includes("503") || errMsg.includes("not configured") ? "Weather API key not configured. Add a Visual Crossing API key to enable weather correlation." : errMsg}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const w = data.lossDateWeather;
  const riskClass = getRiskColor(data.overallRiskScore);

  return (
    <Card className="overflow-hidden" data-testid="weather-correlation">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between font-display text-primary">
          <span className="flex items-center gap-2">
            <Cloud className="h-5 w-5" /> Weather Correlation
          </span>
          <span className={`text-xs font-mono px-2 py-1 rounded border ${riskClass}`} data-testid="weather-risk-score">
            {data.overallRiskScore <= 25 ? <ShieldCheck size={14} className="inline mr-1" /> : <ShieldAlert size={14} className="inline mr-1" />}
            {getRiskLabel(data.overallRiskScore)} ({data.overallRiskScore}/100)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>{data.location}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>Loss Date: {formatDate(data.dateOfLoss)}</span>
        </div>

        {w && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
            data-testid="weather-loss-date"
          >
            <div className="flex items-center gap-2 mb-3">
              {getWeatherIcon(w.icon, 24)}
              <div>
                <p className="text-sm font-semibold text-foreground">{w.conditions}</p>
                <p className="text-[10px] text-muted-foreground">{w.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-1.5">
                <Thermometer size={14} className="text-red-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Temperature</p>
                  <p className="text-xs font-semibold">{w.tempmin}° – {w.tempmax}°F</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind size={14} className="text-blue-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Wind / Gusts</p>
                  <p className="text-xs font-semibold">{w.windspeed} / {w.windgust} mph</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets size={14} className="text-cyan-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Precipitation</p>
                  <p className="text-xs font-semibold">{w.precip}" {w.preciptype?.join(", ") || ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={14} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Severe Risk</p>
                  <p className="text-xs font-semibold">{w.severerisk}%</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="rounded-lg border p-3" data-testid="weather-peril-analysis">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {data.perilAnalysis.weatherSupportsPeril
                ? <CheckCircle2 size={18} className="text-green-600" />
                : <AlertTriangle size={18} className="text-orange-500" />
              }
              <span className="text-sm font-semibold">
                {data.perilAnalysis.weatherSupportsPeril ? "Weather Supports Claim" : "Weather Data Inconsistency"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getConfidenceBadge(data.perilAnalysis.confidence)}`}>
                {data.perilAnalysis.confidence.toUpperCase()} CONF.
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getSeverityBadge(data.perilAnalysis.severityLevel)}`}>
                {data.perilAnalysis.severityLevel.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.perilAnalysis.details}</p>
          {data.perilAnalysis.relevantConditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.perilAnalysis.relevantConditions.map((c, i) => (
                <span key={i} className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          )}
        </div>

        {data.fraudIndicators.length > 0 && (
          <div className="space-y-2" data-testid="weather-fraud-indicators">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validation Findings</p>
            {data.fraudIndicators.map((ind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
                  ind.type === "mismatch" ? "bg-red-50/50 border-red-200" :
                  ind.type === "warning" ? "bg-orange-50/50 border-orange-200" :
                  ind.type === "match" ? "bg-green-50/50 border-green-200" :
                  "bg-blue-50/50 border-blue-200"
                }`}
              >
                {getIndicatorIcon(ind.type)}
                <div>
                  <span className="font-medium text-foreground">{ind.category}: </span>
                  <span className="text-muted-foreground">{ind.message}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
            data-testid="button-toggle-timeline"
          >
            {showTimeline ? "Hide" : "Show"} 5-Day Weather Timeline
          </button>

          {showTimeline && data.surroundingDays.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {data.surroundingDays.map((day) => {
                  const isLossDate = day.datetime === (data.dateOfLoss.includes("T") ? data.dateOfLoss.split("T")[0] : data.dateOfLoss);
                  return (
                    <div
                      key={day.datetime}
                      className={`rounded-lg border p-2.5 text-center ${isLossDate ? "ring-2 ring-primary bg-primary/5 border-primary/30" : "bg-muted/20"}`}
                      data-testid={`weather-day-${day.datetime}`}
                    >
                      <p className="text-[10px] font-medium text-muted-foreground">{formatDate(day.datetime)}</p>
                      {isLossDate && <p className="text-[8px] font-bold text-primary uppercase">Date of Loss</p>}
                      <div className="flex justify-center my-1.5">{getWeatherIcon(day.icon, 22)}</div>
                      <p className="text-[10px] font-medium truncate">{day.conditions}</p>
                      <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                        <p>{day.tempmin}°–{day.tempmax}°F</p>
                        <p>Wind: {day.windgust} mph</p>
                        {day.precip > 0 && <p>Precip: {day.precip}"</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        <p className="text-[9px] text-muted-foreground/60 text-right">
          Data: {data.dataSource}
        </p>
      </CardContent>
    </Card>
  );
}

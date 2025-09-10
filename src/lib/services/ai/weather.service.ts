import { QueryAnalysis } from "../ai/semantic-search.service";

export interface WeatherApiResponse {
  location: string;
  current: {
    city: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    description: string;
    wind_speed: number;
    timestamp: string;
  };
  forecast?: any[];
  query_analysis?: QueryAnalysis;
}

export class WeatherApiService {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseUrl = "https://api.openweathermap.org/data/2.5"; // Fix: Set the proper base URL
    this.apiKey = process.env.OPENWEATHER_API_KEY || "";
    this.timeout = 10000;

    if (!this.apiKey) {
      throw new Error(
        "OPENWEATHER_API_KEY is not defined in environment variables."
      );
    }
  }

  async getWeatherByCity(city: string): Promise<any> {
    const url = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric&lang=id`;

    console.log("[API CLIENT] Fetching weather for city:", city);
    console.log("[API CLIENT] URL:", url); // Debug log

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Weather API error for ${city}: ${response.status}`);
      }

      const data = await response.json();

      return {
        city: data.name,
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        wind_speed: data.wind.speed,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[API CLIENT] Weather API error for ${city}:`, error);
      throw error;
    }
  }

  // New method for semantic search integration
  async getWeatherData(
    analysis: QueryAnalysis
  ): Promise<WeatherApiResponse | null> {
    // Only process if it's a weather query
    if (analysis.type !== "weather") {
      return null;
    }

    // Use detected location or default to Madiun
    const targetLocation = analysis.location || "madiun";

    console.log(
      `[WEATHER SERVICE] Fetching weather for: ${targetLocation} (confidence: ${analysis.confidence})`
    );

    try {
      const current = await this.getWeatherByCity(targetLocation);

      return {
        location: targetLocation,
        current,
        query_analysis: analysis,
      };
    } catch (error) {
      console.error(`[WEATHER SERVICE] Error for ${targetLocation}:`, error);
      throw error;
    }
  }
}

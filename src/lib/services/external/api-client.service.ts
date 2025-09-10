interface ExternalDocument {
  id: string;
  content: string;
  source: string;
  metadata: any;
  timestamp: Date;
}

export class ExternalAPIClient {
  private timeout: number;
  private baseWeatherUrl: string;

  constructor() {
    this.timeout = parseInt(process.env.EXTERNAL_API_TIMEOUT || "10000");

    // Fix: Set proper weather API base URL
    this.baseWeatherUrl =
      process.env.OPENWEATHER_BASE_URL ||
      "https://api.openweathermap.org/data/2.5";
  }

  // ...existing code...

  private async fetchWeatherData(city: string): Promise<ExternalDocument[]> {
    try {
      console.log("[API CLIENT] Fetching weather for city:", city);

      // Fix: Use the baseWeatherUrl property instead of undefined variable
      const url = `${this.baseWeatherUrl}/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=id`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Weather API HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return [
        {
          id: `weather_${city}_${Date.now()}`,
          content: `Cuaca ${data.name}: ${data.weather[0].description}, suhu ${data.main.temp}°C, kelembaban ${data.main.humidity}%`,
          source: "openweather",
          metadata: {
            city: data.name,
            temperature: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            wind_speed: data.wind?.speed || 0,
          },
          timestamp: new Date(),
        },
      ];
    } catch (error) {
      console.error("[API CLIENT] Weather API error:", error);
      throw error;
    }
  }

  /**
   * Fetch news data from News API
   */
  private async fetchNewsData(query: string): Promise<ExternalDocument[]> {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) {
        console.log("[API CLIENT] News API key not configured");
        return [];
      }

      const searchTerm = this.extractNewsKeywords(query);
      const url = `${
        process.env.NEWS_API_BASE_URL
      }/everything?q=${encodeURIComponent(
        searchTerm
      )}&language=id&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        console.error(`[API CLIENT] News API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      return data.articles.map((article: any, index: number) => ({
        id: `news_${Date.now()}_${index}`,
        content: `${article.title}. ${article.description || ""}. Sumber: ${
          article.source.name
        }. Dipublikasikan: ${new Date(article.publishedAt).toLocaleDateString(
          "id-ID"
        )}.`,
        source: "newsapi",
        metadata: article,
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error("[API CLIENT] News API error:", error);
      return [];
    }
  }

  /**
   * Fetch holiday data from public API
   */
  private async fetchHolidayData(): Promise<ExternalDocument[]> {
    try {
      const year = new Date().getFullYear();
      const url = `${process.env.PUBLIC_HOLIDAYS_BASE_URL}/PublicHolidays/${year}/ID`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        console.error(`[API CLIENT] Holiday API error: ${response.status}`);
        return [];
      }

      const holidays = await response.json();

      return holidays.map((holiday: any, index: number) => ({
        id: `holiday_${year}_${index}`,
        content: `Hari libur nasional: ${
          holiday.localName
        } pada tanggal ${new Date(holiday.date).toLocaleDateString("id-ID")}. ${
          holiday.name
        }.`,
        source: "public-holidays",
        metadata: holiday,
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error("[API CLIENT] Holiday API error:", error);
      return [];
    }
  }

  /**
   * Fetch country data from REST Countries API
   */
  private async fetchCountryData(query: string): Promise<ExternalDocument[]> {
    try {
      const country = this.extractCountryFromQuery(query) || "Indonesia";
      const url = `${
        process.env.REST_COUNTRIES_BASE_URL
      }/name/${encodeURIComponent(country)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        console.error(`[API CLIENT] Countries API error: ${response.status}`);
        return [];
      }

      const countries = await response.json();

      return countries.slice(0, 2).map((country: any, index: number) => ({
        id: `country_${country.cca3}_${index}`,
        content: `Informasi ${country.name.common}: Ibukota ${
          country.capital?.[0] || "tidak diketahui"
        }, populasi ${
          country.population?.toLocaleString("id-ID") || "tidak diketahui"
        }, mata uang ${
          Object.values(country.currencies || {})[0]?.name || "tidak diketahui"
        }, bahasa resmi ${Object.values(country.languages || {}).join(", ")}.`,
        source: "restcountries",
        metadata: country,
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error("[API CLIENT] Countries API error:", error);
      return [];
    }
  }

  // Helper methods for query classification
  private isWeatherQuery(query: string): boolean {
    const weatherKeywords = [
      "cuaca",
      "weather",
      "suhu",
      "hujan",
      "panas",
      "dingin",
      "iklim",
      "temperature",
    ];
    const hasWeatherKeyword = weatherKeywords.some((keyword) =>
      query.includes(keyword)
    );
    console.log(
      `[API CLIENT] Weather query check: "${query}" -> ${hasWeatherKeyword}`
    );
    return hasWeatherKeyword;
  }

  private isNewsQuery(query: string): boolean {
    const newsKeywords = [
      "berita",
      "news",
      "informasi",
      "terbaru",
      "update",
      "kabar",
      "trending",
    ];
    return newsKeywords.some((keyword) => query.includes(keyword));
  }

  private isHolidayQuery(query: string): boolean {
    const holidayKeywords = [
      "libur",
      "holiday",
      "cuti",
      "hari raya",
      "nasional",
      "idul",
    ];
    return holidayKeywords.some((keyword) => query.includes(keyword));
  }

  private isCountryQuery(query: string): boolean {
    const countryKeywords = [
      "negara",
      "country",
      "indonesia",
      "malaysia",
      "populasi",
      "mata uang",
      "currency",
    ];
    return countryKeywords.some((keyword) => query.includes(keyword));
  }

  private extractCityFromQuery(query: string): string | null {
    const cities = [
      "madiun",
      "surabaya",
      "jakarta",
      "yogyakarta",
      "bandung",
      "medan",
      "semarang",
    ];
    for (const city of cities) {
      if (query.toLowerCase().includes(city)) {
        return city;
      }
    }
    return null;
  }

  private extractNewsKeywords(query: string): string {
    // Extract meaningful keywords for news search
    const stopWords = [
      "apa",
      "yang",
      "adalah",
      "tentang",
      "berita",
      "informasi",
    ];
    const words = query
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2 && !stopWords.includes(word));
    return words.join(" ") || "indonesia";
  }

  private extractCountryFromQuery(query: string): string | null {
    const countries = [
      "indonesia",
      "malaysia",
      "singapore",
      "thailand",
      "philippines",
    ];
    for (const country of countries) {
      if (query.toLowerCase().includes(country)) {
        return country;
      }
    }
    return null;
  }
}

// Выбор города для расписания намазов
import { useState, useEffect } from "react";
import { 
  MapPin, 
  Search, 
  Check, 
  Globe,
  Navigation,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface City {
  id: string;
  name: string;
  nameAr?: string;
  country: string;
  countryCode: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Популярные города
const POPULAR_CITIES: City[] = [
  { id: "moscow", name: "Москва", country: "Россия", countryCode: "RU", timezone: "Europe/Moscow", coordinates: { lat: 55.7558, lng: 37.6173 } },
  { id: "kazan", name: "Казань", country: "Россия", countryCode: "RU", timezone: "Europe/Moscow", coordinates: { lat: 55.7887, lng: 49.1221 } },
  { id: "ufa", name: "Уфа", country: "Россия", countryCode: "RU", timezone: "Asia/Yekaterinburg", coordinates: { lat: 54.7388, lng: 55.9721 } },
  { id: "grozny", name: "Грозный", country: "Россия", countryCode: "RU", timezone: "Europe/Moscow", coordinates: { lat: 43.3178, lng: 45.6982 } },
  { id: "makhachkala", name: "Махачкала", country: "Россия", countryCode: "RU", timezone: "Europe/Moscow", coordinates: { lat: 42.9849, lng: 47.5047 } },
  { id: "spb", name: "Санкт-Петербург", country: "Россия", countryCode: "RU", timezone: "Europe/Moscow", coordinates: { lat: 59.9343, lng: 30.3351 } },
  { id: "dubai", name: "Дубай", nameAr: "دبي", country: "ОАЭ", countryCode: "AE", timezone: "Asia/Dubai", coordinates: { lat: 25.2048, lng: 55.2708 } },
  { id: "istanbul", name: "Стамбул", nameAr: "إسطنبول", country: "Турция", countryCode: "TR", timezone: "Europe/Istanbul", coordinates: { lat: 41.0082, lng: 28.9784 } },
  { id: "mecca", name: "Мекка", nameAr: "مكة", country: "Саудовская Аравия", countryCode: "SA", timezone: "Asia/Riyadh", coordinates: { lat: 21.3891, lng: 39.8579 } },
  { id: "medina", name: "Медина", nameAr: "المدينة", country: "Саудовская Аравия", countryCode: "SA", timezone: "Asia/Riyadh", coordinates: { lat: 24.5247, lng: 39.5692 } },
  { id: "cairo", name: "Каир", nameAr: "القاهرة", country: "Египет", countryCode: "EG", timezone: "Africa/Cairo", coordinates: { lat: 30.0444, lng: 31.2357 } },
  { id: "almaty", name: "Алматы", country: "Казахстан", countryCode: "KZ", timezone: "Asia/Almaty", coordinates: { lat: 43.2220, lng: 76.8512 } },
  { id: "tashkent", name: "Ташкент", country: "Узбекистан", countryCode: "UZ", timezone: "Asia/Tashkent", coordinates: { lat: 41.2995, lng: 69.2401 } },
  { id: "baku", name: "Баку", country: "Азербайджан", countryCode: "AZ", timezone: "Asia/Baku", coordinates: { lat: 40.4093, lng: 49.8671 } },
  { id: "dushanbe", name: "Душанбе", country: "Таджикистан", countryCode: "TJ", timezone: "Asia/Dushanbe", coordinates: { lat: 38.5598, lng: 68.7740 } },
];

// Флаги стран (emoji)
const COUNTRY_FLAGS: Record<string, string> = {
  RU: "🇷🇺",
  AE: "🇦🇪",
  TR: "🇹🇷",
  SA: "🇸🇦",
  EG: "🇪🇬",
  KZ: "🇰🇿",
  UZ: "🇺🇿",
  AZ: "🇦🇿",
  TJ: "🇹🇯",
};

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: City) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CitySelector = ({ 
  selectedCity, 
  onCityChange, 
  open, 
  onOpenChange 
}: CitySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const filteredCities = POPULAR_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Находим ближайший город
        let nearestCity = POPULAR_CITIES[0];
        let minDistance = Infinity;
        
        POPULAR_CITIES.forEach(city => {
          const distance = Math.sqrt(
            Math.pow(city.coordinates.lat - latitude, 2) + 
            Math.pow(city.coordinates.lng - longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
          }
        });
        
        onCityChange(nearestCity);
        onOpenChange(false);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        alert("Не удалось определить местоположение");
      },
      { timeout: 10000 }
    );
  };

  const handleSelectCity = (city: City) => {
    onCityChange(city);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-card border-t border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground">Выберите город</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск города..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Geolocation Button */}
          <button
            onClick={handleGeolocation}
            disabled={isLocating}
            className="w-full flex items-center gap-4 p-4 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Navigation className={cn("w-5 h-5 text-primary-foreground", isLocating && "animate-pulse")} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-primary">
                {isLocating ? "Определение..." : "Определить автоматически"}
              </p>
              <p className="text-xs text-muted-foreground">Использовать геолокацию</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>

          {/* Cities List */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground font-medium px-1">Популярные города</p>
            
            {filteredCities.map(city => (
              <button
                key={city.id}
                onClick={() => handleSelectCity(city)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl transition-colors",
                  selectedCity === city.name
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
                  {COUNTRY_FLAGS[city.countryCode] || "🌍"}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium",
                      selectedCity === city.name ? "text-primary" : "text-foreground"
                    )}>
                      {city.name}
                    </p>
                    {city.nameAr && (
                      <span className="text-xs text-muted-foreground">{city.nameAr}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{city.country}</p>
                </div>
                {selectedCity === city.name && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}

            {filteredCities.length === 0 && (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Город не найден</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Хук для работы с выбранным городом
export const useCitySelection = () => {
  const [city, setCity] = useState<City | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("selected_city");
    if (saved) {
      try {
        setCity(JSON.parse(saved));
      } catch {
        setCity(POPULAR_CITIES[0]); // Москва по умолчанию
      }
    } else {
      setCity(POPULAR_CITIES[0]);
    }
  }, []);

  const handleCityChange = (newCity: City) => {
    setCity(newCity);
    localStorage.setItem("selected_city", JSON.stringify(newCity));
  };

  return {
    city,
    cityName: city?.name || "Москва",
    isOpen,
    setIsOpen,
    handleCityChange,
  };
};

export { POPULAR_CITIES };
export type { City };


// Компонент компаса Киблы
// Адаптация идей с azan.ru, но с уникальным дизайном

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Compass, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QiblaCompassProps {
  onDirectionChange?: (angle: number) => void;
}

// Координаты Каабы в Мекке
const KAABA_COORDS = {
  lat: 21.4225,
  lng: 39.8262,
};

// Расчет направления на Киблу (Qibla) в градусах
function calculateQiblaDirection(
  userLat: number,
  userLng: number
): number {
  const lat1 = (userLat * Math.PI) / 180;
  const lng1 = (userLng * Math.PI) / 180;
  const lat2 = (KAABA_COORDS.lat * Math.PI) / 180;
  const lng2 = (KAABA_COORDS.lng * Math.PI) / 180;

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

// Расчет расстояния до Мекки в километрах
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Радиус Земли в км
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const QiblaCompass = ({ onDirectionChange }: QiblaCompassProps) => {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<number | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [compassAngle, setCompassAngle] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const compassRef = useRef<HTMLDivElement>(null);

  // Получение геолокации
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          
          // Расчет направления на Киблу
          const angle = calculateQiblaDirection(coords.lat, coords.lng);
          setQiblaAngle(angle);
          
          // Расчет расстояния
          const dist = calculateDistance(
            coords.lat,
            coords.lng,
            KAABA_COORDS.lat,
            KAABA_COORDS.lng
          );
          setDistance(dist);
          
          onDirectionChange?.(angle);
        },
        (error) => {
          setError("Не удалось определить местоположение");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setError("Геолокация не поддерживается вашим браузером");
    }
  }, [onDirectionChange]);

  // Отслеживание ориентации устройства (компас)
  useEffect(() => {
    const requestPermissionAndStart = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as DeviceOrientationEvent & {
          requestPermission?: () => Promise<DeviceOrientationEventPermissionState>;
        }).requestPermission === "function"
      ) {
        try {
          const response = await (DeviceOrientationEvent as DeviceOrientationEvent & {
            requestPermission?: () => Promise<DeviceOrientationEventPermissionState>;
          }).requestPermission?.();
          if (response !== "granted") {
            setError("Разрешение на использование компаса не предоставлено");
            return;
          }
        } catch {
          setError("Не удалось получить доступ к компасу");
          return;
        }
      }
      startCompass();
    };

    const startCompass = () => {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          setDeviceOrientation(event.alpha);
        }
      };

      window.addEventListener("deviceorientation", handleOrientation);

      return () => {
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    };

    const cleanup = requestPermissionAndStart();
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, []);

  // Расчет угла для стрелки Киблы относительно компаса
  useEffect(() => {
    if (qiblaAngle !== null && deviceOrientation !== null) {
      // Угол стрелки = направление на Киблу - направление устройства
      const angle = (qiblaAngle - deviceOrientation + 360) % 360;
      setCompassAngle(angle);
    }
  }, [qiblaAngle, deviceOrientation]);

  const handleRefresh = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          const angle = calculateQiblaDirection(coords.lat, coords.lng);
          setQiblaAngle(angle);
          const dist = calculateDistance(
            coords.lat,
            coords.lng,
            KAABA_COORDS.lat,
            KAABA_COORDS.lng
          );
          setDistance(dist);
          toast({
            title: "Обновлено",
            description: "Направление на Киблу пересчитано",
          });
        },
        (error) => {
          toast({
            title: "Ошибка",
            description: "Не удалось обновить местоположение",
            variant: "destructive",
          });
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="w-6 h-6 text-primary" />
          Компас Киблы
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Определение направления на Мекку
        </p>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Компас */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Направление на Киблу
            </span>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Поверните устройство, чтобы определить направление
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            {/* Компас */}
            <div
              ref={compassRef}
              className="relative w-64 h-64 rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
              style={{
                transform: deviceOrientation !== null 
                  ? `rotate(${-deviceOrientation}deg)` 
                  : undefined,
              }}
            >
              {/* Центральная точка */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>

              {/* Стрелка на Киблу */}
              {qiblaAngle !== null && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `rotate(${compassAngle}deg)`,
                  }}
                >
                  <div className="relative">
                    {/* Стрелка */}
                    <div
                      className="w-1 h-24 bg-gradient-to-t from-primary to-primary/50 rounded-full"
                      style={{
                        transform: "translateY(-50%)",
                        boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                      }}
                    />
                    {/* Наконечник стрелки */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-primary"
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Метки сторон света */}
              <div className="absolute inset-0">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">
                  N
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">
                  S
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                  W
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                  E
                </div>
              </div>
            </div>

            {/* Информация */}
            <div className="mt-6 space-y-2 text-center">
              {qiblaAngle !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Направление</p>
                  <p className="text-2xl font-bold">
                    {Math.round(qiblaAngle)}°
                  </p>
                </div>
              )}
              {distance !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Расстояние до Мекки</p>
                  <p className="text-lg font-semibold">
                    {Math.round(distance).toLocaleString("ru-RU")} км
                  </p>
                </div>
              )}
              {location && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о Кибле */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">О Кибле</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Кибла (араб. قبلة) — направление в сторону священной Каабы в Мекке,
            куда мусульмане обращаются во время намаза.
          </p>
          <p>
            Компас использует геолокацию вашего устройства и встроенный компас
            для точного определения направления.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};


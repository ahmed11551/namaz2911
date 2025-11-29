// Новая версия карточки дуа с обновленным дизайном

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eReplikaAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DuaDisplaySettings, useDuaDisplaySettings, getArabicFontSize } from "./DuaDisplaySettings";

interface DuaCardV2Props {
  dua: {
    id: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    reference?: string;
    audioUrl?: string | null;
  };
  number?: number;
  categoryColor?: string;
}

export const DuaCardV2 = memo(({ dua, number, categoryColor }: DuaCardV2Props) => {
  const { toast } = useToast();
  const { settings, updateSettings } = useDuaDisplaySettings();
  
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(dua.audioUrl);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [count, setCount] = useState(0);
  const [translation, setTranslation] = useState<string>(dua.translation);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  // Load audio from API if not provided
  useEffect(() => {
    isMountedRef.current = true;
    
    if (dua.audioUrl) {
      setAudioUrl(dua.audioUrl);
      setIsLoadingAudio(false);
      return;
    }

    if (audioUrl) {
      setIsLoadingAudio(false);
      return;
    }

    if (!dua.audioUrl && dua.id) {
      setIsLoadingAudio(true);
      
      eReplikaAPI.getDuaAudio(dua.id)
        .then((url) => {
          if (!isMountedRef.current) return;
          
          if (url) {
            setAudioUrl(url);
          }
          setIsLoadingAudio(false);
        })
        .catch((error) => {
          if (!isMountedRef.current) return;
          console.error("Error loading audio:", error);
          setIsLoadingAudio(false);
        });
    }
  }, [dua.id, dua.audioUrl, audioUrl]);

  // Initialize audio
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      console.error("Audio error");
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current = null;
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Загрузка перевода на выбранном языке
  useEffect(() => {
    if (settings.translationLanguage === 'ru') {
      setTranslation(dua.translation);
      setIsLoadingTranslation(false);
      return;
    }

    // Загружаем перевод с API (если доступен)
    const loadTranslation = async () => {
      setIsLoadingTranslation(true);
      try {
        const translated = await eReplikaAPI.getDuaTranslation(dua.id, settings.translationLanguage);
        if (!isMountedRef.current) return;
        
        if (translated) {
          setTranslation(translated);
        } else {
          // Если перевод не найден, используем русский как fallback
          setTranslation(dua.translation);
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error("Error loading translation:", error);
        setTranslation(dua.translation);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingTranslation(false);
        }
      }
    };

    loadTranslation();
  }, [dua.id, dua.translation, settings.translationLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    };
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current && !audioUrl) {
      toast({
        title: "Аудио недоступно",
        description: "Аудио для этого дуа не найдено",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // Play
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Error playing audio:", error);
              setIsPlaying(false);
              toast({
                title: "Ошибка воспроизведения",
                description: "Не удалось воспроизвести аудио",
                variant: "destructive",
              });
            });
        }
      }
    }
  }, [isPlaying, audioUrl, toast]);

  // Reset counter
  const handleReset = useCallback(() => {
    setCount(0);
  }, []);

  // Increment counter
  const handleIncrement = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <Card className="bg-white border-border/50 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Номер вверху */}
        {number !== undefined && (
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{number}</span>
            </div>
          </div>
        )}

        {/* Серый блок с текстом и кнопками */}
        <div className="bg-gray-100 rounded-2xl mx-4 mb-4 p-4 space-y-4">
          {/* Транслитерация */}
          {settings.showTranscription && (
            <div className="space-y-2">
              {/* Латинская транскрипция */}
              {dua.transcription && (
                <p className="text-sm text-foreground/90 italic leading-relaxed text-center">
                  {dua.transcription}
                </p>
              )}
              {/* Кириллическая транскрипция */}
              {dua.russianTranscription && (
                <p className="text-sm text-foreground leading-relaxed text-center font-medium">
                  {dua.russianTranscription}
                </p>
              )}
            </div>
          )}

          {/* Арабский текст */}
          <p 
            className={cn(
              getArabicFontSize(settings.arabicFontSize),
              "leading-relaxed font-arabic text-foreground text-center"
            )}
            style={{ 
              fontFamily: "'Amiri', 'Noto Sans Arabic', serif",
              lineHeight: "1.8",
            }}
            dir="rtl"
          >
            {dua.arabic}
          </p>

          {/* Три кнопки внизу */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {/* Кнопка сброса/отмены */}
            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Сбросить счетчик"
            >
              <RotateCcw className="w-5 h-5 text-foreground" />
            </button>

            {/* Кнопка воспроизведения (центр, черная) */}
            <button
              onClick={togglePlay}
              disabled={isLoadingAudio || (!audioUrl && !audioRef.current)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                "bg-black text-white hover:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg"
              )}
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            {/* Счетчик */}
            <button
              onClick={handleIncrement}
              className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Увеличить счетчик"
            >
              <span className="text-sm font-semibold text-foreground">{count}</span>
            </button>
          </div>
        </div>

        {/* Большой блок с переводом и объяснением */}
        {settings.showTranslation && (
          <div className="px-4 pb-6 space-y-3">
            {isLoadingTranslation ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Загрузка перевода...</span>
              </div>
            ) : (
              <p className="text-base text-foreground leading-relaxed">
                {translation}
              </p>
            )}
            
            {dua.reference && (
              <p className="text-sm text-muted-foreground italic">
                {dua.reference}
              </p>
            )}
          </div>
        )}

        {/* Настройки отображения */}
        <div className="px-4 pb-4 flex items-center justify-center gap-2">
          <DuaDisplaySettings 
            settings={settings} 
            onSettingsChange={updateSettings} 
          />
        </div>
      </CardContent>
    </Card>
  );
});

DuaCardV2.displayName = "DuaCardV2";


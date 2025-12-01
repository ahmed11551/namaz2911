import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, BookmarkPlus, BookmarkCheck, Share2, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eReplikaAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DuaCardProps {
  dua: {
    id: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    reference: string;
    audioUrl: string | null;
  };
  categoryColor: string;
}

// Constants for better maintainability
const BOOKMARKS_KEY = "prayer_debt_bookmarks";
const TTS_ESTIMATED_CHAR_DURATION = 0.15; // seconds per character
const TTS_DEFAULT_RATE = 0.75;
const DEFAULT_VOLUME = 1;
const PROGRESS_UPDATE_INTERVAL = 100; // milliseconds

export const DuaCard = memo(({ dua, categoryColor }: DuaCardProps) => {
  const { toast } = useToast();
  
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(dua.audioUrl);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isTTSAvailable, setIsTTSAvailable] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if dua is bookmarked
  useEffect(() => {
    const checkBookmark = () => {
      try {
        const existingBookmarks = localStorage.getItem(BOOKMARKS_KEY);
        if (existingBookmarks) {
          const bookmarks = JSON.parse(existingBookmarks);
          if (Array.isArray(bookmarks)) {
            setIsBookmarked(bookmarks.some((b: { id: string }) => b.id === dua.id));
            return;
          }
        }
        setIsBookmarked(false);
      } catch (error) {
        console.error("Failed to parse bookmarks:", error);
        setIsBookmarked(false);
      }
    };
    
    checkBookmark();
  }, [dua.id]);

  // Initialize TTS availability
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setIsTTSAvailable(false);
      return;
    }

    try {
      const synth = window.speechSynthesis;
      synthRef.current = synth;
      
      const checkVoices = () => {
        try {
          const voices = synth.getVoices();
          const hasArabicVoice = voices.some(voice => 
            voice.lang.startsWith('ar') || voice.lang.includes('Arabic')
          );
          setIsTTSAvailable(voices.length > 0);
          
          if (hasArabicVoice && process.env.NODE_ENV === 'development') {
            console.log("Arabic TTS voices available");
          }
        } catch (error) {
          console.warn("Error checking voices:", error);
          setIsTTSAvailable(false);
        }
      };
      
      checkVoices();
      
      const voices = synth.getVoices();
      if (voices.length === 0) {
        const onVoicesChanged = () => {
          checkVoices();
          synth.removeEventListener("voiceschanged", onVoicesChanged);
        };
        synth.addEventListener("voiceschanged", onVoicesChanged);
        return () => {
          synth.removeEventListener("voiceschanged", onVoicesChanged);
        };
      }
    } catch (error) {
      console.warn("Speech synthesis initialization failed:", error);
      setIsTTSAvailable(false);
    }
  }, []);

  // Load audio from API if not provided
  useEffect(() => {
    isMountedRef.current = true;
    
    // If audioUrl is provided in props, use it
    if (dua.audioUrl) {
      setAudioUrl(dua.audioUrl);
      setIsLoadingAudio(false);
      return;
    }

    // If audioUrl is already loaded, don't reload
    if (audioUrl) {
      setIsLoadingAudio(false);
      return;
    }

    // Load from API only if no audioUrl and we have an id
    if (!dua.audioUrl && dua.id) {
      setIsLoadingAudio(true);
      setAudioError(null);
      
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      eReplikaAPI.getDuaAudio(dua.id)
        .then((url) => {
          if (!isMountedRef.current || signal.aborted) return;
          
          if (url) {
            setAudioUrl(url);
            setAudioError(null);
            console.log(`Audio loaded successfully for dua ${dua.id}`);
          } else {
            // Аудио не найдено в API - это нормально, будет использован TTS
            console.log(`Audio not found in API for dua ${dua.id}, TTS will be used as fallback`);
            setAudioError(null); // Не показываем ошибку, т.к. TTS доступен
          }
          setIsLoadingAudio(false);
        })
        .catch((error) => {
          if (error.name === "AbortError" || !isMountedRef.current || signal.aborted) return;
          
          console.error("Error loading audio from API:", error);
          // Не показываем ошибку, если TTS доступен
          if (!isTTSAvailable) {
            setAudioError("Не удалось загрузить аудио из API");
          } else {
            setAudioError(null); // TTS доступен, ошибка не критична
          }
          setIsLoadingAudio(false);
        });
      
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setIsLoadingAudio(false);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [dua.id, dua.audioUrl, audioUrl, isTTSAvailable]);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      return;
    }

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        const newProgress = (audio.currentTime / audio.duration) * 100;
        setProgress(newProgress);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setAudioError("Ошибка воспроизведения аудио");
      setAudioUrl(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current = null;
      }
    };

    const handleCanPlay = () => {
      setAudioError(null);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    // Attempt to load metadata (jsdom returns undefined, so guard)
    try {
      audio.load();
    } catch (error) {
      console.error("Error loading audio:", error);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.pause();
      audio.src = "";
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Cleanup on unmount or dua change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsPlaying(false);
      setProgress(0);
    };
  }, [dua.id]);

  // TTS playback function
  const playWithTTS = useCallback(() => {
    if (!synthRef.current || !isTTSAvailable) {
      console.warn("Speech synthesis is not available");
      setIsPlaying(false);
      return;
    }

    synthRef.current.cancel();

    const arabicUtterance = new SpeechSynthesisUtterance(dua.arabic);
    
    const voices = synthRef.current.getVoices();
    const arabicVoice = voices.find(voice => 
      voice.lang.startsWith('ar') || voice.lang.includes('Arabic')
    );
    
    if (arabicVoice) {
      arabicUtterance.voice = arabicVoice;
      arabicUtterance.lang = arabicVoice.lang;
    } else {
      arabicUtterance.lang = "ar-SA";
    }
    
    arabicUtterance.rate = TTS_DEFAULT_RATE;
    arabicUtterance.volume = isMuted ? 0 : volume;
    arabicUtterance.pitch = 1;

    const estimatedDuration = dua.arabic.length * TTS_ESTIMATED_CHAR_DURATION;
    setDuration(estimatedDuration);
    
    const startTime = Date.now();

    arabicUtterance.onstart = () => {
      setIsPlaying(true);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newProgress = Math.min((elapsed / estimatedDuration) * 100, 100);
        setProgress(newProgress);
      }, PROGRESS_UPDATE_INTERVAL);
    };

    arabicUtterance.onend = () => {
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    arabicUtterance.onerror = (e) => {
      const errorEvent = e as SpeechSynthesisErrorEvent;
      console.warn("TTS error:", errorEvent.error);
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    synthRef.current.speak(arabicUtterance);
  }, [dua.arabic, isMuted, volume, isTTSAvailable]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (synthRef.current) {
        if (synthRef.current.speaking) {
          synthRef.current.pause();
        } else if (synthRef.current.paused) {
          synthRef.current.resume();
          setIsPlaying(true);
          return;
        } else {
          synthRef.current.cancel();
        }
      }
      setIsPlaying(false);
    } else {
      // Play
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }

      if (synthRef.current && synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
        return;
      }

      if (audioUrl && audioRef.current) {
        try {
          audioRef.current.volume = isMuted ? 0 : volume;
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setAudioError(null);
              })
              .catch((error) => {
                console.error("Play error:", error);
                setIsPlaying(false);
                if (isTTSAvailable) {
                  playWithTTS();
                } else {
                  setAudioError("Не удалось воспроизвести аудио");
                  toast({
                    title: "Ошибка воспроизведения",
                    description: "Аудио файл не загружен, а синтез речи не поддерживается",
                    variant: "destructive",
                  });
                }
              });
          } else {
            setIsPlaying(true);
          }
        } catch (error) {
          console.error("Error starting playback:", error);
          setIsPlaying(false);
          if (isTTSAvailable) {
            playWithTTS();
          }
        }
      } else if (isTTSAvailable) {
        playWithTTS();
      } else {
        console.warn("No audio source available");
        setIsPlaying(false);
      }
    }
  }, [isPlaying, audioUrl, isMuted, volume, isTTSAvailable, playWithTTS, toast]);

  // Progress click handler
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
  }, [duration]);

  // Volume change handler
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }

    if (synthRef.current && isPlaying) {
      synthRef.current.cancel();
      if (!newMuted) {
        playWithTTS();
      } else {
        setIsPlaying(false);
      }
    }
  }, [isMuted, volume, isPlaying, playWithTTS]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    const russianTranscriptionText = dua.russianTranscription ? `\n${dua.russianTranscription}\n` : '';
    const textToCopy = `${dua.arabic}\n\n${dua.transcription}${russianTranscriptionText}\n${dua.translation}\n\n${dua.reference}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Скопировано",
        description: "Дуа скопировано в буфер обмена",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать текст",
        variant: "destructive",
      });
    }
  }, [dua, toast]);

  // Bookmark handler
  const handleBookmark = useCallback(() => {
    try {
      const existingBookmarks = localStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: Array<{ id: string }> = [];
      
      if (existingBookmarks) {
        try {
          bookmarks = JSON.parse(existingBookmarks);
          if (!Array.isArray(bookmarks)) {
            bookmarks = [];
          }
        } catch {
          bookmarks = [];
        }
      }

      const isInBookmarks = bookmarks.some((b) => b.id === dua.id);

      if (isInBookmarks) {
        const filtered = bookmarks.filter((b) => b.id !== dua.id);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
        setIsBookmarked(false);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('bookmarksUpdated'));
        toast({
          title: "Удалено из избранного",
          description: "Дуа удалено из ваших закладок",
        });
      } else {
        bookmarks.push({ id: dua.id });
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        setIsBookmarked(true);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('bookmarksUpdated'));
        toast({
          title: "Добавлено в избранное",
          description: "Дуа сохранено в ваших закладках",
        });
      }
    } catch (error) {
      console.error("Error saving bookmark:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить в закладки",
        variant: "destructive",
      });
    }
  }, [dua.id, toast]);

  // Share handler
  const handleShare = useCallback(async () => {
    const shareText = `${dua.arabic}\n\n${dua.transcription}${dua.russianTranscription ? `\n${dua.russianTranscription}` : ''}\n\n${dua.translation}\n\n${dua.reference}`;
    const shareData = {
      title: "Дуа",
      text: shareText,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Поделились",
          description: "Дуа успешно отправлено",
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Скопировано",
          description: "Дуа скопировано в буфер обмена для отправки",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Скопировано",
          description: "Дуа скопировано в буфер обмена",
        });
      } catch (clipboardError: unknown) {
        console.error("Failed to copy:", clipboardError);
        toast({
          title: "Ошибка",
          description: "Не удалось поделиться или скопировать",
          variant: "destructive",
        });
      }
    }
  }, [dua, toast]);

  // Memoized formatted duration
  const formattedDuration = useMemo(() => {
    if (duration <= 0) return "0:00";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [duration]);

  // Memoized current time
  const currentTime = useMemo(() => {
    if (duration <= 0) return "0:00";
    const current = (progress / 100) * duration;
    const minutes = Math.floor(current / 60);
    const seconds = Math.floor(current % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [progress, duration]);

  // Check if audio is available
  const isAudioAvailable = audioUrl || isTTSAvailable;
  const canPlay = isAudioAvailable && !isLoadingAudio;

  return (
    <Card className="glass shadow-medium border-border/50 hover:shadow-strong transition-all duration-500 group overflow-visible rounded-2xl">
      {/* Decorative top border with gradient */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-t-2xl" />
      
      <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
        {/* Arabic Text - Enhanced typography */}
        <div className="text-center px-2 sm:px-4">
          <p 
            className="text-3xl sm:text-4xl leading-relaxed font-arabic text-foreground select-none"
            style={{ 
              fontFamily: "'Amiri', 'Noto Sans Arabic', serif",
              lineHeight: "1.8",
              letterSpacing: "0.02em"
            }}
            dir="rtl"
          >
            {dua.arabic}
          </p>
        </div>

        {/* Transcription (Latin) - Improved styling */}
        <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-2xl p-5 sm:p-6 border border-border/40 shadow-inner backdrop-blur-sm">
          <p className="text-center text-lg sm:text-xl text-foreground/95 italic leading-relaxed font-medium">
            {dua.transcription}
          </p>
        </div>

        {/* Russian Transcription - Enhanced design */}
        {dua.russianTranscription && (
          <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-2xl p-5 sm:p-6 border border-accent/30 shadow-inner backdrop-blur-sm">
            <p className="text-center text-base sm:text-lg text-foreground/95 leading-relaxed font-medium">
              {dua.russianTranscription}
            </p>
          </div>
        )}

        {/* Translation - Professional styling */}
        <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-2xl p-5 sm:p-6 border border-primary/25 shadow-inner backdrop-blur-sm">
          <p className="text-center text-base sm:text-lg text-foreground leading-relaxed font-normal">
            {dua.translation}
          </p>
        </div>

        {/* Reference - Elegant design */}
        <div className="flex items-center justify-center gap-3 text-sm sm:text-base text-muted-foreground/80">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
          <span className="font-medium italic">{dua.reference}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
        </div>

        {/* Audio Player - Professional design */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
              Воспроизведение
            </h3>
            {(isLoadingAudio || audioError) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isLoadingAudio && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Загрузка...</span>
                  </>
                )}
                {audioError && !isLoadingAudio && (
                  <span className="text-destructive/80">{audioError}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-4 sm:p-5 border border-border/40 shadow-inner backdrop-blur-sm">
            {/* Play/Pause Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              disabled={!canPlay}
              className={cn(
                "shrink-0 h-12 w-12 rounded-full transition-all duration-300",
                "hover:bg-primary/20 hover:text-primary hover:scale-110",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                isPlaying && "bg-primary/10 text-primary"
              )}
              title={!canPlay ? "Аудио недоступно" : isPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 text-primary" />
              ) : (
                <Play className="w-5 h-5 text-primary" />
              )}
            </Button>
            
            {/* Progress Bar */}
            <div className="flex-1 space-y-1">
              <div
                className="relative h-2.5 bg-border/40 rounded-full overflow-hidden cursor-pointer group/progress transition-all duration-200 hover:h-3"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-100 shadow-sm"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/progress:opacity-100 transition-opacity">
                  <div className="text-[10px] text-muted-foreground bg-background/95 px-2 py-0.5 rounded shadow-sm">
                    {currentTime} / {formattedDuration}
                  </div>
                </div>
              </div>
              {duration > 0 && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 px-1">
                  <span>{currentTime}</span>
                  <span>{formattedDuration}</span>
                </div>
              )}
            </div>
            
            {/* Volume Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
                title={isMuted ? "Включить звук" : "Выключить звук"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <div className="w-24 hidden sm:block">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Status Messages */}
          {!audioUrl && !isLoadingAudio && isTTSAvailable && (
            <p className="text-xs text-muted-foreground/70 text-center">
              Аудио из API недоступно. Используется синтез речи браузера
            </p>
          )}
          {!audioUrl && !isLoadingAudio && !isTTSAvailable && (
            <p className="text-xs text-muted-foreground/50 text-center">
              Аудио воспроизведение недоступно. Аудио не найдено в API, а синтез речи не поддерживается браузером.
            </p>
          )}
          {audioError && !isLoadingAudio && (
            <p className="text-xs text-destructive/70 text-center">
              {audioError}
            </p>
          )}
        </div>

        {/* Action Buttons - Professional design */}
        <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className={cn(
              "h-10 px-4 rounded-xl transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary hover:scale-105",
              "active:scale-95"
            )}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Копировать</span>
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleBookmark}
            className={cn(
              "h-10 px-4 rounded-xl transition-all duration-200",
              "hover:bg-accent/10 hover:text-accent hover:scale-105",
              "active:scale-95",
              isBookmarked && "bg-accent/5 text-accent"
            )}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-2 text-accent" />
                <span className="whitespace-nowrap">В избранном</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Сохранить</span>
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className={cn(
              "h-10 px-4 rounded-xl transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary hover:scale-105",
              "active:scale-95"
            )}
          >
            <Share2 className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Поделиться</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

DuaCard.displayName = "DuaCard";

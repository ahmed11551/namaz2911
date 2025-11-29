// Настройки отображения дуа

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Type, 
  Settings, 
  ChevronDown,
  Languages,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "dua_display_settings";

export interface DuaDisplaySettings {
  arabicFontSize: number; // 1-5 (от малого до большого)
  showTranscription: boolean;
  showTranslation: boolean;
  translationLanguage: string; // 'ru', 'en', 'ar', 'kz', 'kg', 'uz', 'az', etc.
}

const DEFAULT_SETTINGS: DuaDisplaySettings = {
  arabicFontSize: 3,
  showTranscription: true,
  showTranslation: true,
  translationLanguage: 'ru',
};

const TRANSLATION_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'kg', name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'tk', name: 'Türkmen', flag: '🇹🇲' },
  { code: 'tt', name: 'Татарча', flag: '🇹🇦' },
];

interface DuaDisplaySettingsProps {
  settings: DuaDisplaySettings;
  onSettingsChange: (settings: DuaDisplaySettings) => void;
}

export const DuaDisplaySettings = ({ settings, onSettingsChange }: DuaDisplaySettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSizePopoverOpen, setFontSizePopoverOpen] = useState(false);
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);

  const handleFontSizeChange = (value: number[]) => {
    const newSettings = {
      ...settings,
      arabicFontSize: value[0],
    };
    onSettingsChange(newSettings);
  };

  const handleToggleTranscription = (checked: boolean) => {
    const newSettings = {
      ...settings,
      showTranscription: checked,
    };
    onSettingsChange(newSettings);
  };

  const handleToggleTranslation = (checked: boolean) => {
    const newSettings = {
      ...settings,
      showTranslation: checked,
    };
    onSettingsChange(newSettings);
  };

  const handleLanguageChange = (langCode: string) => {
    const newSettings = {
      ...settings,
      translationLanguage: langCode,
    };
    onSettingsChange(newSettings);
    setLanguagePopoverOpen(false);
    setIsOpen(false);
  };

  const currentLanguage = TRANSLATION_LANGUAGES.find(l => l.code === settings.translationLanguage) || TRANSLATION_LANGUAGES[0];

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Быстрая кнопка размера шрифта */}
      <Popover open={fontSizePopoverOpen} onOpenChange={setFontSizePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white border border-border/50 hover:bg-secondary"
            aria-label="Размер арабского шрифта"
          >
            <Type className="h-5 w-5 text-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="center">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Размер арабского шрифта</Label>
            <div className="px-2">
              <Slider
                value={[settings.arabicFontSize]}
                onValueChange={handleFontSizeChange}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Малый</span>
                <span>Средний</span>
                <span>Большой</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Быстрая кнопка выбора языка */}
      <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white border border-border/50 hover:bg-secondary"
            aria-label="Выбор языка перевода"
          >
            <Languages className="h-5 w-5 text-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="center">
          <div className="space-y-4">
            {/* Показать/скрыть транскрипцию */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="show-transcription" className="text-sm font-medium">
                  Показать транскрипцию
                </Label>
              </div>
              <Switch
                id="show-transcription"
                checked={settings.showTranscription}
                onCheckedChange={handleToggleTranscription}
              />
            </div>

            {/* Показать/скрыть перевод */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="show-translation" className="text-sm font-medium">
                  Показать перевод
                </Label>
              </div>
              <Switch
                id="show-translation"
                checked={settings.showTranslation}
                onCheckedChange={handleToggleTranslation}
              />
            </div>

            {/* Выбор языка перевода */}
            {settings.showTranslation && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Язык перевода
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRANSLATION_LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={settings.translationLanguage === lang.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLanguageChange(lang.code)}
                      className="justify-start"
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Полные настройки */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white border border-border/50 hover:bg-secondary"
            aria-label="Все настройки отображения"
          >
            <Settings className="h-5 w-5 text-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 space-y-6" align="end">
        {/* Размер арабского шрифта */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Размер арабского шрифта</Label>
          </div>
          <div className="px-2">
            <Slider
              value={[settings.arabicFontSize]}
              onValueChange={handleFontSizeChange}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Малый</span>
              <span>Средний</span>
              <span>Большой</span>
            </div>
          </div>
        </div>

        {/* Показать/скрыть транскрипцию */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="show-transcription" className="text-sm font-medium">
              Показать транскрипцию
            </Label>
          </div>
          <Switch
            id="show-transcription"
            checked={settings.showTranscription}
            onCheckedChange={handleToggleTranscription}
          />
        </div>

        {/* Показать/скрыть перевод */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="show-translation" className="text-sm font-medium">
              Показать перевод
            </Label>
          </div>
          <Switch
            id="show-translation"
            checked={settings.showTranslation}
            onCheckedChange={handleToggleTranslation}
          />
        </div>

        {/* Выбор языка перевода */}
        {settings.showTranslation && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Язык перевода
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSLATION_LANGUAGES.map((lang) => (
                <Button
                  key={lang.code}
                  variant={settings.translationLanguage === lang.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange(lang.code)}
                  className="justify-start"
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span className="text-xs">{lang.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
    </div>
  );
};

// Хук для загрузки и сохранения настроек
export const useDuaDisplaySettings = () => {
  const [settings, setSettings] = useState<DuaDisplaySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Загружаем настройки из localStorage
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Error loading dua display settings:", error);
    }
  }, []);

  const updateSettings = (newSettings: DuaDisplaySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving dua display settings:", error);
    }
  };

  return { settings, updateSettings };
};

// Утилита для получения размера шрифта
export const getArabicFontSize = (size: number): string => {
  const sizes = {
    1: 'text-xl',      // Малый
    2: 'text-2xl',     // Малый-средний
    3: 'text-3xl',     // Средний
    4: 'text-4xl',     // Большой-средний
    5: 'text-5xl',     // Большой
  };
  return sizes[size as keyof typeof sizes] || sizes[3];
};


// Умный тасбих с выбором из целей и автоматическим подтягиванием данных

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Play,
  Pause,
  RotateCcw,
  Settings,
  CheckCircle2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { getDhikrItemById } from "@/lib/dhikr-data";
import type { Goal } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SmartTasbihProps {
  goalId?: string; // Если передан goalId из URL, сразу загружаем эту цель
}

interface DisplaySettings {
  showArabic: boolean;
  showTranscription: boolean;
  showTranslation: boolean;
  transcriptionType: "latin" | "cyrillic"; // Латиница или кириллица
  showAudio: boolean;
}

export const SmartTasbih = ({ goalId }: SmartTasbihProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [learnedDialogOpen, setLearnedDialogOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    showArabic: true,
    showTranscription: true,
    showTranslation: true,
    transcriptionType: "latin",
    showAudio: true,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingItemData, setLoadingItemData] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  // Загружаем данные элемента из API, если их нет в item_data
  useEffect(() => {
    const loadItemData = async () => {
      if (selectedGoal && selectedGoal.item_id && selectedGoal.item_type && !selectedGoal.item_data) {
        setLoadingItemData(true);
        try {
          const { getDhikrItemById } = await import("@/lib/dhikr-data");
          const itemData = await getDhikrItemById(selectedGoal.item_id, selectedGoal.item_type);
          if (itemData) {
            // Обновляем цель с загруженными данными
            await spiritualPathAPI.updateGoal(selectedGoal.id, {
              item_data: {
                arabic: itemData.arabic,
                transcription: itemData.transcription,
                russianTranscription: itemData.russianTranscription,
                translation: itemData.translation,
                audioUrl: itemData.audioUrl,
                reference: itemData.reference,
              },
            });
            // Перезагружаем цели
            loadGoals();
          }
        } catch (error) {
          console.error("Error loading item data:", error);
        } finally {
          setLoadingItemData(false);
        }
      }
    };

    loadItemData();
  }, [selectedGoal]);

  useEffect(() => {
    if (goalId) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        setSelectedGoal(goal);
      }
    }
  }, [goalId, goals]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const allGoals = await spiritualPathAPI.getGoals("active");
      // Фильтруем только цели, связанные с тасбихом (зикры, аяты, дуа, 99 имен)
      const tasbihGoals = allGoals.filter(g => 
        g.category === "zikr" || 
        g.category === "quran" || 
        g.category === "names_of_allah" ||
        g.linked_counter_type !== null
      );
      setGoals(tasbihGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Получаем данные для отображения из цели
  const getGoalContent = useMemo(() => {
    if (!selectedGoal) return null;

    // Если в цели есть кэшированные данные (item_data) - используем их
    if (selectedGoal.item_data) {
      return {
        arabic: selectedGoal.item_data.arabic || selectedGoal.title,
        transcription: selectedGoal.item_data.transcription || selectedGoal.title,
        russianTranscription: selectedGoal.item_data.russianTranscription || selectedGoal.title,
        translation: selectedGoal.item_data.translation || selectedGoal.description || "",
        audioUrl: selectedGoal.item_data.audioUrl || null,
        reference: selectedGoal.item_data.reference,
      };
    }

    // Если есть item_id и item_type - получаем данные из API
    if (selectedGoal.item_id && selectedGoal.item_type) {
      // Используем асинхронную функцию, но в useMemo это не работает
      // Поэтому данные должны быть уже в item_data или загружаться отдельно
      // TODO: Загрузить данные через useEffect при выборе цели
    }

    // Fallback: используем данные из описания/названия
    return {
      arabic: selectedGoal.description || selectedGoal.title,
      transcription: selectedGoal.title,
      russianTranscription: selectedGoal.title,
      translation: selectedGoal.description || "",
      audioUrl: null,
      reference: undefined,
    };
  }, [selectedGoal]);

  // Ближайшие цели (срочные)
  const urgentGoals = useMemo(() => {
    return goals
      .filter(g => {
        if (!g.end_date) return false;
        const daysRemaining = Math.ceil(
          (new Date(g.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining <= 3 && daysRemaining > 0;
      })
      .slice(0, 3);
  }, [goals]);

  const handleGoalSelect = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setCurrentCount(0);
    }
  };

  const handleCount = async () => {
    if (!selectedGoal) return;

    const newCount = currentCount + 1;
    setCurrentCount(newCount);

    // Синхронизация с целью
    try {
      await spiritualPathAPI.addProgress(selectedGoal.id, 1);
      
      // Если достигли цели
      if (newCount >= selectedGoal.target_value) {
        toast({
          title: "Цель достигнута!",
          description: "Поздравляем! Ма ша Аллах!",
        });
      }
    } catch (error) {
      console.error("Error syncing progress:", error);
    }
  };

  const handleLearned = async () => {
    if (!selectedGoal) return;

    try {
      // Отмечаем цель как завершенную
      await spiritualPathAPI.updateGoal(selectedGoal.id, { status: "completed" });
      toast({
        title: "Цель завершена!",
        description: "Вы успешно выучили! Ма ша Аллах!",
      });
      setLearnedDialogOpen(false);
      loadGoals();
      setSelectedGoal(null);
    } catch (error) {
      console.error("Error completing goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить цель",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setCurrentCount(0);
  };

  const progress = selectedGoal && selectedGoal.target_value > 0
    ? (currentCount / selectedGoal.target_value) * 100
    : 0;

  const isComplete = selectedGoal && currentCount >= selectedGoal.target_value;

  // Проверяем, есть ли у цели флаг "Выучить"
  const isLearningGoal = selectedGoal?.is_learning ||
    selectedGoal?.title.toLowerCase().includes("выучить") ||
    selectedGoal?.description?.toLowerCase().includes("выучить");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Выбор цели */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Выберите из целей
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedGoal?.id || ""}
            onValueChange={handleGoalSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите цель для тасбиха" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{goal.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {goal.current_value}/{goal.target_value}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ближайшие цели */}
          {urgentGoals.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Ваши ближайшие цели:
              </p>
              {urgentGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors border-yellow-500/30"
                  onClick={() => handleGoalSelect(goal.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Осталось: {Math.ceil(
                            (new Date(goal.end_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                          )} дн.
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Начать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Карточка тасбиха */}
      {selectedGoal && getGoalContent && (
        <Card className="bg-gradient-card border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{selectedGoal.title}</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Настройки отображения</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-arabic">Арабский текст</Label>
                        <Switch
                          id="show-arabic"
                          checked={displaySettings.showArabic}
                          onCheckedChange={(checked) =>
                            setDisplaySettings({ ...displaySettings, showArabic: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-transcription">Транскрипция</Label>
                        <Switch
                          id="show-transcription"
                          checked={displaySettings.showTranscription}
                          onCheckedChange={(checked) =>
                            setDisplaySettings({ ...displaySettings, showTranscription: checked })
                          }
                        />
                      </div>
                      {displaySettings.showTranscription && (
                        <div className="ml-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={displaySettings.transcriptionType === "latin" ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                setDisplaySettings({ ...displaySettings, transcriptionType: "latin" })
                              }
                            >
                              Латиница
                            </Button>
                            <Button
                              variant={displaySettings.transcriptionType === "cyrillic" ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                setDisplaySettings({ ...displaySettings, transcriptionType: "cyrillic" })
                              }
                            >
                              Кириллица
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-translation">Перевод</Label>
                        <Switch
                          id="show-translation"
                          checked={displaySettings.showTranslation}
                          onCheckedChange={(checked) =>
                            setDisplaySettings({ ...displaySettings, showTranslation: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-audio">Аудио</Label>
                        <Switch
                          id="show-audio"
                          checked={displaySettings.showAudio}
                          onCheckedChange={(checked) =>
                            setDisplaySettings({ ...displaySettings, showAudio: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Арабский текст */}
            {displaySettings.showArabic && (
              <div className="text-center py-4">
                <p
                  className="text-4xl font-arabic text-foreground"
                  style={{ fontFamily: "'Amiri', serif" }}
                  dir="rtl"
                >
                  {getGoalContent.arabic}
                </p>
              </div>
            )}

            {/* Транскрипция */}
            {displaySettings.showTranscription && (
              <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4 border border-border/40">
                <p className="text-center text-lg text-foreground/95 italic leading-relaxed">
                  {displaySettings.transcriptionType === "latin"
                    ? getGoalContent.transcription
                    : getGoalContent.russianTranscription}
                </p>
              </div>
            )}

            {/* Перевод */}
            {displaySettings.showTranslation && getGoalContent.translation && (
              <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-xl p-4 border border-primary/25">
                <p className="text-center text-base text-foreground leading-relaxed">
                  {getGoalContent.translation}
                </p>
              </div>
            )}

            {/* Аудиоплеер */}
            {displaySettings.showAudio && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // TODO: Реализовать воспроизведение аудио
                    setIsPlaying(!isPlaying);
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                {audioUrl && (
                  <audio src={audioUrl} />
                )}
              </div>
            )}

            {/* Прогресс */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  {currentCount} / {selectedGoal.target_value}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleCount}
                disabled={isComplete}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isComplete ? "Завершено" : "Считать"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Кнопка "Выучил" для целей с флагом "Выучить" */}
            {isLearningGoal && isComplete && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => setLearnedDialogOpen(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Выучил
              </Button>
            )}

            {isComplete && (
              <div className="text-center">
                <p className="text-sm gradient-text-gold font-semibold animate-pulse">
                  ✨ Завершено! Ма ша Аллах
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Пустое состояние */}
      {!selectedGoal && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                Выберите цель для тасбиха
              </p>
              <p className="text-sm text-muted-foreground">
                Или создайте новую цель в разделе "Мой Духовный Путь"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог подтверждения "Выучил" */}
      <AlertDialog open={learnedDialogOpen} onOpenChange={setLearnedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отметить цель как выученную?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что выучили "{selectedGoal?.title}"? Цель будет отмечена как завершенная.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleLearned}>
              Да, выучил
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


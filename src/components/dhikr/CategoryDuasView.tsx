// Просмотр дуа внутри категории

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { DuaCard } from "./DuaCard";
import { DuaCardV2 } from "./DuaCardV2";
import { eReplikaAPI } from "@/lib/api";
import { getAvailableItemsByCategory, type DhikrItem } from "@/lib/dhikr-data";

interface Dua {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string | null;
  number?: number;
}

interface CategoryDuasViewProps {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
}

type RemoteDuaRecord = Dua & {
  category_id?: string;
  category?: string;
  category_name?: string;
  text_arabic?: string;
  text_transcription?: string;
  russian_transcription?: string;
  text_translation?: string;
  name_english?: string;
  hadith_reference?: string;
  audio_url?: string | null;
  audio?: string | null;
};

export const CategoryDuasView = ({ categoryId, categoryName, onBack }: CategoryDuasViewProps) => {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);

  const loadCategoryDuas = useCallback(async () => {
    setLoading(true);
    try {
      let categoryDuas: Dua[] = [];
      
      // Сначала пробуем API
      try {
        const allDuas = await eReplikaAPI.getDuas();
        if (allDuas && allDuas.length > 0) {
          categoryDuas = (allDuas as RemoteDuaRecord[])
            .filter((dua) => {
              const catId = dua.category_id || dua.category || "general";
              return catId === categoryId;
            })
            .map((dua, index: number) => ({
              id: dua.id,
              arabic: dua.arabic || dua.text_arabic || "",
              transcription: dua.transcription || dua.text_transcription || "",
              russianTranscription: dua.russian_transcription || dua.russianTranscription,
              translation: dua.translation || dua.text_translation || dua.name_english || "",
              reference: dua.reference || dua.hadith_reference,
              audioUrl: dua.audio_url ?? dua.audioUrl ?? dua.audio ?? null,
              number: index + 1,
            }));
        }
      } catch {
        // API недоступен
      }

      // Если API вернул пустой результат - используем fallback
      if (categoryDuas.length === 0) {
        console.log("Using fallback data for category:", categoryId);
        const fallbackData = await getAvailableItemsByCategory("dua");
        categoryDuas = fallbackData
          .filter((item: DhikrItem) => {
            const catId = item.category || "general";
            return catId === categoryId || categoryId === "general";
          })
          .map((item: DhikrItem, index: number) => ({
            id: item.id,
            arabic: item.arabic || "",
            transcription: item.transcription || "",
            russianTranscription: item.russianTranscription,
            translation: item.translation || "",
            reference: item.reference,
            audioUrl: item.audioUrl || null,
            number: index + 1,
          }));
      }

      setDuas(categoryDuas);
    } catch (error) {
      console.error("Error loading category duas:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadCategoryDuas();
  }, [loadCategoryDuas]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (selectedDua) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDua(null)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{selectedDua.translation}</h2>
        </div>
        <DuaCardV2 dua={selectedDua} number={selectedDua.number} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative h-full flex flex-col justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute top-3 left-3 h-8 w-8 text-foreground hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{categoryName}</h1>
        </div>
      </div>

      {/* Счетчик */}
      <div className="px-4">
        <p className="text-sm text-muted-foreground">Всего: {duas.length}</p>
      </div>

      {/* Список дуа */}
      <div className="space-y-1 px-4 pb-4">
        {duas.map((dua) => (
          <Card
            key={dua.id}
            className="bg-white border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer rounded-lg"
            onClick={() => setSelectedDua(dua)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">
                    {dua.number}.
                  </span>
                  <p className="text-sm font-medium flex-1">{dua.translation}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


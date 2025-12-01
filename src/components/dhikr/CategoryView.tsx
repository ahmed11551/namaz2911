// Просмотр категории дуа/азкаров

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DuaCard } from "./DuaCard";
import { eReplikaAPI } from "@/lib/api";

interface Dua {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string | null;
}

type RemoteDuaRecord = Dua & {
  category_id?: string;
  category?: string;
  text_arabic?: string;
  text_transcription?: string;
  russian_transcription?: string;
  text_translation?: string;
  name_english?: string;
  hadith_reference?: string;
  audio_url?: string | null;
  audio?: string | null;
};

export const CategoryView = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const getCategoryName = useCallback((id: string): string => {
    const names: Record<string, string> = {
      morning: "Утро & вечер",
      evening: "Утро & вечер",
      sleep: "Перед сном",
      home: "Дом & семья",
      family: "Дом & семья",
      food: "Еда & напиток",
      travel: "Путешествовать",
      joy: "Радость & печаль",
      sorrow: "Радость & печаль",
      general: "Общие",
    };
    return names[id] || id;
  }, []);

  const loadCategoryDuas = useCallback(async () => {
    setLoading(true);
    try {
      const allDuas = await eReplikaAPI.getDuas();
      const categoryDuas = (allDuas as RemoteDuaRecord[]).filter((dua) => {
        const catId = dua.category_id || dua.category || "general";
        return catId === categoryId;
      });

      setDuas(categoryDuas.map((dua) => ({
        id: dua.id,
        arabic: dua.arabic || dua.text_arabic || "",
        transcription: dua.transcription || dua.text_transcription || "",
        russianTranscription: dua.russian_transcription || dua.russianTranscription,
        translation: dua.translation || dua.text_translation || dua.name_english || "",
        reference: dua.reference || dua.hadith_reference,
        audioUrl: dua.audio_url ?? dua.audioUrl ?? dua.audio ?? null,
      })));

      setCategoryName(getCategoryName(categoryId));
    } catch (error) {
      console.error("Error loading category duas:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryId, getCategoryName]);

  useEffect(() => {
    if (categoryId) {
      loadCategoryDuas();
    }
  }, [categoryId, loadCategoryDuas]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{categoryName}</h1>
      </div>

      <div className="space-y-4">
        {duas.map((dua) => (
          <DuaCard
            key={dua.id}
            dua={dua}
            categoryColor="category-general"
          />
        ))}
      </div>
    </div>
  );
};


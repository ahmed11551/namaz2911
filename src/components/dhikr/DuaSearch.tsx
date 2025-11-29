// Быстрый поиск по всем дуа

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { DuaCard } from "./DuaCard";
import { DuaCardV2 } from "./DuaCardV2";
import { eReplikaAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Dua {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string | null;
  category?: string;
}

interface DuaSearchProps {
  searchQuery?: string;
  onDuaSelect?: (dua: Dua) => void;
}

type RemoteDuaRecord = Dua & {
  category_id?: string;
  text_arabic?: string;
  text_transcription?: string;
  russian_transcription?: string;
  text_translation?: string;
  name_english?: string;
  hadith_reference?: string;
  audio_url?: string | null;
  audio?: string | null;
};

export const DuaSearch = ({ searchQuery: externalQuery, onDuaSelect }: DuaSearchProps) => {
  const [internalQuery, setInternalQuery] = useState("");
  const searchQuery = externalQuery !== undefined ? externalQuery : internalQuery;
  const [allDuas, setAllDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);

  const loadAllDuas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eReplikaAPI.getDuas();
      setAllDuas(
        (data as RemoteDuaRecord[]).map((dua) => ({
          id: dua.id,
          arabic: dua.arabic || dua.text_arabic || "",
          transcription: dua.transcription || dua.text_transcription || "",
          russianTranscription: dua.russian_transcription || dua.russianTranscription,
          translation: dua.translation || dua.text_translation || dua.name_english || "",
          reference: dua.reference || dua.hadith_reference,
          audioUrl: dua.audio_url ?? dua.audioUrl ?? dua.audio ?? null,
          category: dua.category_id || dua.category || "general",
        }))
      );
    } catch (error) {
      console.error("Error loading duas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllDuas();
  }, [loadAllDuas]);

  // Быстрый поиск по всем полям
  const filteredDuas = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    return allDuas.filter((dua) => {
      const searchFields = [
        dua.translation?.toLowerCase(),
        dua.transcription?.toLowerCase(),
        dua.russianTranscription?.toLowerCase(),
        dua.arabic,
        dua.reference?.toLowerCase(),
      ].filter(Boolean);

      // Поиск по всем словам запроса (для более точного поиска)
      const queryWords = query.split(/\s+/).filter(Boolean);
      const searchText = searchFields.join(" ");
      return queryWords.every((word) => searchText.includes(word));
    });
  }, [searchQuery, allDuas]);

  const handleDuaClick = (dua: Dua) => {
    setSelectedDua(dua);
    onDuaSelect?.(dua);
  };

  if (selectedDua) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDua(null)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold">{selectedDua.translation}</h2>
        </div>
        <DuaCardV2 dua={selectedDua} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Поиск (только если не передан извне) */}
      {externalQuery === undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск дуа..."
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {internalQuery && (
            <button
              onClick={() => setInternalQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-secondary rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Результаты поиска */}
      {searchQuery && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : filteredDuas.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground px-2">
                Найдено: {filteredDuas.length}
              </p>
              {filteredDuas.map((dua) => (
                <Card
                  key={dua.id}
                  className="bg-white border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleDuaClick(dua)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium text-sm mb-1">{dua.translation}</p>
                    <p className="text-xs text-muted-foreground italic">
                      {dua.transcription}
                    </p>
                    {dua.reference && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {dua.reference}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ничего не найдено</p>
              <p className="text-xs mt-2">Попробуйте другой запрос</p>
            </div>
          )}
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Введите запрос для поиска дуа</p>
          <p className="text-xs mt-2">
            Поиск работает по переводу, транслитерации и арабскому тексту
          </p>
        </div>
      )}
    </div>
  );
};


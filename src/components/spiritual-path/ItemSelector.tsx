// Компонент для выбора конкретного элемента (дуа, аят, зикр и т.д.)

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, ChevronRight, Loader2 } from "lucide-react";
import { getAvailableItemsByCategory, getAyahs, getSurahs, getNamesOfAllah } from "@/lib/dhikr-data";
import type { DhikrItem } from "@/lib/dhikr-data";
import type { Goal, GoalCategory } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

interface ItemSelectorProps {
  category: GoalCategory;
  selectedItemId?: string;
  selectedItemType?: "dua" | "ayah" | "surah" | "adhkar" | "salawat" | "kalima" | "name_of_allah";
  onItemSelect: (itemId: string, itemType: string, itemData: Goal["item_data"]) => void;
}

export const ItemSelector = ({
  category,
  selectedItemId,
  selectedItemType,
  onItemSelect,
}: ItemSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<"dua" | "adhkar" | "salawat" | "kalima" | "">("");
  const [items, setItems] = useState<DhikrItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  // Для категории "zikr" показываем подкатегории
  const zikrSubcategories = [
    { id: "dua", label: "Дуа" },
    { id: "adhkar", label: "Азкары" },
    { id: "salawat", label: "Салаваты" },
    { id: "kalima", label: "Калимы" },
  ];

  // Загружаем элементы из API
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        if (category === "zikr" && selectedSubcategory) {
          const data = await getAvailableItemsByCategory(selectedSubcategory);
          setItems(data);
        } else if (category === "quran") {
          if (selectedSurah) {
            const ayahs = await getAyahs(selectedSurah);
            setItems(ayahs);
          } else {
            const surahs = await getSurahs();
            setItems(surahs);
          }
        } else if (category === "names_of_allah") {
          const names = await getNamesOfAllah();
          setItems(names);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Error loading items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [category, selectedSubcategory, selectedSurah]);
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.arabic?.toLowerCase().includes(query) ||
      item.transcription?.toLowerCase().includes(query) ||
      item.translation?.toLowerCase().includes(query) ||
      item.title?.toLowerCase().includes(query)
    );
  });

  const handleItemClick = (item: DhikrItem) => {
    let itemType: string = "";
    if (category === "zikr") {
      itemType = selectedSubcategory || "dua";
    } else if (category === "quran") {
      itemType = "ayah"; // или "surah"
    } else if (category === "names_of_allah") {
      itemType = "name_of_allah";
    }

    onItemSelect(item.id, itemType, {
      arabic: item.arabic,
      transcription: item.transcription,
      russianTranscription: item.russianTranscription,
      translation: item.translation,
      audioUrl: item.audioUrl,
      reference: item.reference,
    });
  };

  if (category === "prayer") {
    // Для намазов показываем выбор типа намаза
    return (
      <div className="space-y-4">
        <Label>Тип намаза</Label>
        <Select
          value={selectedItemId || ""}
          onValueChange={(value) => {
            const prayerTypes: Record<string, { id: string; title: string; description: string }> = {
              "tahajjud": { id: "tahajjud", title: "Тахаджуд", description: "Ночной намаз" },
              "istighfar": { id: "istighfar", title: "Истигфар", description: "Намаз покаяния" },
              "sunnah": { id: "sunnah", title: "Сунна намаз", description: "Дополнительный намаз" },
              "fard": { id: "fard", title: "Фард намаз", description: "Обязательный намаз" },
            };
            const prayer = prayerTypes[value];
            if (prayer) {
              onItemSelect(prayer.id, "prayer", {
                translation: prayer.title,
                reference: prayer.description,
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите тип намаза" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tahajjud">Тахаджуд (Ночной намаз)</SelectItem>
            <SelectItem value="istighfar">Истигфар (Намаз покаяния)</SelectItem>
            <SelectItem value="sunnah">Сунна намаз</SelectItem>
            <SelectItem value="fard">Фард намаз</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (category === "zikr") {
    return (
      <div className="space-y-4">
        <div>
          <Label>Подкатегория</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {zikrSubcategories.map((sub) => (
              <Button
                key={sub.id}
                variant={selectedSubcategory === sub.id ? "default" : "outline"}
                onClick={() => setSelectedSubcategory(sub.id)}
                className="w-full"
              >
                {sub.label}
              </Button>
            ))}
          </div>
        </div>

        {selectedSubcategory && (
          <>
            <div>
              <Label>Поиск</Label>
              <Input
                placeholder="Поиск по тексту, транскрипции..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        "cursor-pointer hover:bg-secondary/50 transition-colors",
                        selectedItemId === item.id && "border-primary"
                      )}
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{item.title || item.transcription}</p>
                            {item.translation && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.translation}
                              </p>
                            )}
                          </div>
                          {selectedItemId === item.id && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет доступных элементов
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (category === "quran") {
    return (
      <div className="space-y-4">
        {!selectedSurah ? (
          <>
            <Label>Выберите суру</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {items.map((surah) => (
                  <Card
                    key={surah.id}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedSurah(surah.number)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">
                            {surah.number}. {surah.translation}
                          </p>
                          <p className="text-xs text-muted-foreground">{surah.arabic}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSurah(null)}>
                <ChevronUp className="w-4 h-4" />
                Назад к сурам
              </Button>
              <Label>Выберите аят из суры {selectedSurah}</Label>
            </div>
            <div>
              <Input
                placeholder="Поиск аята..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredItems.map((ayah) => (
                  <Card
                    key={ayah.id}
                    className={cn(
                      "cursor-pointer hover:bg-secondary/50 transition-colors",
                      selectedItemId === ayah.id && "border-primary"
                    )}
                    onClick={() => handleItemClick(ayah)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            Аят {ayah.ayahNumber}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ayah.translation}
                          </p>
                        </div>
                        {selectedItemId === ayah.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (category === "names_of_allah") {
    return (
      <div className="space-y-4">
        <div>
          <Label>Выберите имя Аллаха</Label>
          <Input
            placeholder="Поиск имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((name) => (
                <Card
                  key={name.id}
                  className={cn(
                    "cursor-pointer hover:bg-secondary/50 transition-colors",
                    selectedItemId === name.id && "border-primary"
                  )}
                  onClick={() => handleItemClick(name)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {name.number}. {name.translation}
                        </p>
                        <p className="text-xs text-muted-foreground">{name.arabic}</p>
                        {name.russianTranscription && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {name.russianTranscription}
                          </p>
                        )}
                      </div>
                      {selectedItemId === name.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет доступных имен
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};


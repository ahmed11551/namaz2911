// Раздел Дуа - дизайн Goal app

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Share2, Heart, Search, ChevronRight, ArrowLeft, Sun, Moon, Home, Utensils, Plane, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DuaCard } from "./DuaCard";
import { CategoryDuasView } from "./CategoryDuasView";
import { eReplikaAPI } from "@/lib/api";
import { getAvailableItemsByCategory, type DhikrItem } from "@/lib/dhikr-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BOOKMARKS_KEY = "prayer_debt_bookmarks";

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

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  duas: Dua[];
}

// Иконки для категорий
const getCategoryIcon = (categoryId: string) => {
  const icons: Record<string, React.ReactNode> = {
    morning: <Sun className="w-6 h-6" />,
    evening: <Moon className="w-6 h-6" />,
    sleep: <Moon className="w-6 h-6" />,
    home: <Home className="w-6 h-6" />,
    family: <Home className="w-6 h-6" />,
    food: <Utensils className="w-6 h-6" />,
    travel: <Plane className="w-6 h-6" />,
    joy: <Smile className="w-6 h-6" />,
    sorrow: <Smile className="w-6 h-6" />,
    general: <Heart className="w-6 h-6" />,
  };
  return icons[categoryId] || <Heart className="w-6 h-6" />;
};

export const DuaSectionV2 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "favorites">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryName = useCallback((categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      morning: "Утренние дуа",
      evening: "Вечерние дуа",
      sleep: "Перед сном",
      night: "Перед сном",
      home: "Дом и семья",
      family: "Дом и семья",
      food: "Еда и напитки",
      travel: "В путешествии",
      joy: "Радость",
      sorrow: "В трудности",
      hardship: "В трудности",
      general: "Общие дуа",
      gratitude: "Благодарность",
      repentance: "Покаяние",
      forgiveness: "Прощение",
      knowledge: "Знания",
      protection: "Защита",
      parents: "Родители",
      children: "Дети",
      after_prayer: "После намаза",
      "after-prayer": "После намаза",
      health: "Здоровье",
      rizq: "Ризк (пропитание)",
      guidance: "Наставление",
    };
    return categoryNames[categoryId] || categoryId;
  }, []);

  const loadDuas = useCallback(async () => {
    setLoading(true);
    try {
      let data: Dua[] = [];
      
      // Сначала пробуем API
      try {
        const apiData = await eReplikaAPI.getDuas();
        if (apiData && apiData.length > 0) {
          data = apiData.map((item) => ({
            id: item.id || "",
            arabic: item.arabic || "",
            transcription: item.transcription || "",
            russianTranscription: item.russianTranscription,
            translation: item.translation || "",
            reference: item.reference,
            audioUrl: item.audioUrl || null,
            category: item.category_id || item.category || "general",
          }));
        }
      } catch (e) {
        console.log("API error, using fallback:", e);
      }
      
      // Если API не вернул данные - используем локальные
      if (data.length === 0) {
        console.log("Using local dua data");
        const fallbackData = await getAvailableItemsByCategory("dua");
        data = fallbackData.map((item: DhikrItem): Dua => ({
          id: item.id,
          arabic: item.arabic || "",
          transcription: item.transcription || "",
          russianTranscription: item.russianTranscription,
          translation: item.translation || "",
          reference: item.reference,
          audioUrl: item.audioUrl || null,
          category: item.category || "general",
        }));
      }

      setDuas(data);

      // Группируем по категориям
      const categoriesMap = new Map<string, Dua[]>();
      data.forEach((dua: Dua) => {
        const categoryId = dua.category || "general";
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, []);
        }
        categoriesMap.get(categoryId)!.push(dua);
      });

      const cats: Category[] = Array.from(categoriesMap.entries()).map(([id, duas]) => ({
        id,
        name: getCategoryName(id),
        icon: getCategoryIcon(id),
        duas,
      }));

      setCategories(cats);
    } catch (error) {
      console.error("Error loading duas:", error);
    } finally {
      setLoading(false);
    }
  }, [getCategoryName]);

  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarksRaw = JSON.parse(stored);
        if (Array.isArray(bookmarksRaw)) {
          setFavorites(bookmarksRaw as Dua[]);
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  useEffect(() => {
    loadDuas();
    loadFavorites();
  }, [loadDuas, loadFavorites]);

  const toggleFavorite = (dua: Dua) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: Dua[] = stored ? JSON.parse(stored) : [];
      
      const isFav = bookmarks.some((b) => b.id === dua.id);
      
      if (isFav) {
        bookmarks = bookmarks.filter((b) => b.id !== dua.id);
        toast({ title: "Удалено из избранного" });
      } else {
        bookmarks.push(dua);
        toast({ title: "Добавлено в избранное" });
      }
      
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      loadFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorite = (dua: Dua): boolean => {
    return favorites.some((f) => f.id === dua.id);
  };

  // Поиск
  const filteredDuas = searchQuery
    ? duas.filter(d => 
        d.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.transcription.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Загрузка...</div>
      </div>
    );
  }

  // Если выбрана категория
  if (selectedCategory) {
    return (
      <CategoryDuasView
        categoryId={selectedCategory}
        categoryName={categories.find(c => c.id === selectedCategory)?.name || ""}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Поиск дуа..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl bg-white border-gray-200"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("categories"); setSearchQuery(""); }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            activeTab === "categories"
              ? "bg-emerald-500 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          )}
        >
          Категории
        </button>
        <button
          onClick={() => { setActiveTab("favorites"); setSearchQuery(""); }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            activeTab === "favorites"
              ? "bg-emerald-500 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          )}
        >
          Избранное ({favorites.length})
        </button>
      </div>

      {/* Результаты поиска */}
      {searchQuery && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Найдено: {filteredDuas.length}</p>
          {filteredDuas.map((dua) => (
            <DuaCard key={dua.id} dua={dua} categoryColor="category-general" />
          ))}
        </div>
      )}

      {/* Категории */}
      {!searchQuery && activeTab === "categories" && (
        <div className="space-y-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                {category.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.duas.length} дуа</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Избранное */}
      {!searchQuery && activeTab === "favorites" && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-emerald-300" />
              </div>
              <p className="text-gray-500">Нет избранных дуа</p>
              <p className="text-sm text-gray-400 mt-1">
                Добавьте дуа в избранное
              </p>
            </div>
          ) : (
            favorites.map((dua) => (
              <DuaCard key={dua.id} dua={dua} categoryColor="category-general" />
            ))
          )}
        </div>
      )}
    </div>
  );
};

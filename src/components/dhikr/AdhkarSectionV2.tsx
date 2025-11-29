// Раздел Азкары - дизайн Goal app

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Star, Search, ChevronRight, Sun, Moon, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdhkarCard } from "./AdhkarCard";
import { eReplikaAPI } from "@/lib/api";
import { getAvailableItemsByCategory, type DhikrItem } from "@/lib/dhikr-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BOOKMARKS_KEY = "prayer_debt_bookmarks_adhkar";

interface Adhkar {
  id: string;
  title: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  count: number;
  category?: string;
  audioUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  adhkar: Adhkar[];
}

// Иконки для категорий
const getCategoryIcon = (categoryId: string) => {
  const icons: Record<string, React.ReactNode> = {
    after_prayer: <Sparkles className="w-6 h-6" />,
    morning: <Sun className="w-6 h-6" />,
    evening: <Moon className="w-6 h-6" />,
    sleep: <Moon className="w-6 h-6" />,
    daily: <Star className="w-6 h-6" />,
    mosque: <Sparkles className="w-6 h-6" />,
    general: <Star className="w-6 h-6" />,
    protection: <Shield className="w-6 h-6" />,
  };
  return icons[categoryId] || <Star className="w-6 h-6" />;
};

export const AdhkarSectionV2 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adhkar, setAdhkar] = useState<Adhkar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Adhkar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "favorites">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryName = useCallback((categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      after_prayer: "После намаза",
      "after-prayer": "После намаза",
      morning: "Утренние азкары",
      evening: "Вечерние азкары",
      sleep: "Перед сном",
      daily: "Повседневные",
      mosque: "В мечети",
      general: "Общие зикры",
      protection: "Защита",
      repentance: "Покаяние",
      gratitude: "Благодарность",
      hardship: "В трудности",
      travel: "В путешествии",
      food: "Еда и напитки",
      parents: "Родители",
      knowledge: "Знания",
    };
    return categoryNames[categoryId] || categoryId;
  }, []);

  const loadAdhkar = useCallback(async () => {
    setLoading(true);
    try {
      let data: Adhkar[] = [];
      
      // Сначала пробуем API
      try {
        const apiData = await eReplikaAPI.getAdhkar();
        if (apiData && apiData.length > 0) {
          data = apiData.map((item) => ({
            id: item.id || "",
            title: item.title || "",
            arabic: item.arabic || "",
            transcription: item.transcription || "",
            russianTranscription: item.russianTranscription,
            translation: item.translation || "",
            count: item.count || 33,
            category: item.category_id || item.category || "general",
            audioUrl: item.audioUrl || null,
          }));
        }
      } catch (e) {
        console.log("API error, using fallback:", e);
      }
      
      // Если API не вернул данные - используем локальные
      if (data.length === 0) {
        console.log("Using local adhkar data");
        const fallbackData = await getAvailableItemsByCategory("adhkar");
        data = fallbackData.map((item: DhikrItem): Adhkar => ({
          id: item.id,
          title: item.title || "",
          arabic: item.arabic || "",
          transcription: item.transcription || "",
          russianTranscription: item.russianTranscription,
          translation: item.translation || "",
          count: item.count || 33,
          category: item.category || "general",
          audioUrl: item.audioUrl || null,
        }));
      }

      setAdhkar(data);

      // Группируем по категориям
      const categoriesMap = new Map<string, Adhkar[]>();
      data.forEach((item: Adhkar) => {
        const categoryId = item.category || "general";
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, []);
        }
        categoriesMap.get(categoryId)!.push(item);
      });

      const cats: Category[] = Array.from(categoriesMap.entries()).map(([id, adhkar]) => ({
        id,
        name: getCategoryName(id),
        icon: getCategoryIcon(id),
        adhkar,
      }));

      setCategories(cats);
    } catch (error) {
      console.error("Error loading adhkar:", error);
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
          setFavorites(bookmarksRaw as Adhkar[]);
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  useEffect(() => {
    loadAdhkar();
    loadFavorites();
  }, [loadAdhkar, loadFavorites]);

  const toggleFavorite = (item: Adhkar) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: Adhkar[] = stored ? JSON.parse(stored) : [];
      
      const isFav = bookmarks.some((b) => b.id === item.id);
      
      if (isFav) {
        bookmarks = bookmarks.filter((b) => b.id !== item.id);
        toast({ title: "Удалено из избранного" });
      } else {
        bookmarks.push(item);
        toast({ title: "Добавлено в избранное" });
      }
      
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      loadFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Поиск
  const filteredAdhkar = searchQuery
    ? adhkar.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.transcription.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Загрузка...</div>
      </div>
    );
  }

  // Если выбрана категория - показываем азкары
  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory);
    return (
      <div className="space-y-4">
        {/* Кнопка назад */}
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-emerald-600 font-medium"
        >
          ← Назад
        </button>

        <h2 className="text-xl font-bold text-gray-900">{category?.name}</h2>

        <div className="space-y-3">
          {category?.adhkar.map((item) => (
            <AdhkarCard
              key={item.id}
              dhikr={{
                id: item.id,
                title: item.title,
                arabic: item.arabic,
                transcription: item.transcription,
                russianTranscription: item.russianTranscription,
                translation: item.translation,
                count: item.count,
                category: item.category || "general",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Поиск азкаров..."
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
          <p className="text-sm text-gray-500">Найдено: {filteredAdhkar.length}</p>
          {filteredAdhkar.map((item) => (
            <AdhkarCard
              key={item.id}
              dhikr={{
                id: item.id,
                title: item.title,
                arabic: item.arabic,
                transcription: item.transcription,
                russianTranscription: item.russianTranscription,
                translation: item.translation,
                count: item.count,
                category: item.category || "general",
              }}
            />
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
                <p className="text-sm text-gray-500">{category.adhkar.length} азкаров</p>
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
              <p className="text-gray-500">Нет избранных азкаров</p>
              <p className="text-sm text-gray-400 mt-1">
                Добавьте азкары в избранное
              </p>
            </div>
          ) : (
            favorites.map((item) => (
              <AdhkarCard
                key={item.id}
                dhikr={{
                  id: item.id,
                  title: item.title,
                  arabic: item.arabic,
                  transcription: item.transcription,
                  russianTranscription: item.russianTranscription,
                  translation: item.translation,
                  count: item.count,
                  category: item.category || "general",
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

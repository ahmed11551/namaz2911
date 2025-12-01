import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Moon, Sun, Sunrise, Sunset, Plane, Heart, Utensils, Car, Home, ChevronDown, ChevronUp, Star, Grid3x3 } from "lucide-react";
import { DuaCard } from "./DuaCard";
import { cn } from "@/lib/utils";

export const DuaSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = useMemo(() => [
    {
      id: "sleep",
      name: "Перед сном",
      icon: Moon,
      color: "category-sleep",
      description: "Дуа перед сном",
      duas: [
        {
          id: "sleep-1",
          arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
          transcription: "Bismika Allahumma amutu wa ahya",
          russianTranscription: "Бисмика Аллахумма амуту ва ахья",
          translation: "С именем Твоим, О Аллах, я умираю и оживаю",
          reference: "Сахих аль-Бухари 6314",
          audioUrl: null,
        },
        {
          id: "sleep-2",
          arabic: "اللَّهُمَّ إِنِّي أَسْلَمْتُ نَفْسِي إِلَيْكَ",
          transcription: "Allahumma inni aslamtu nafsi ilayka",
          russianTranscription: "Аллахумма инни аслямту нафси иляйка",
          translation: "О Аллах, я предал свою душу Тебе",
          reference: "Сахих аль-Бухари 247",
          audioUrl: null,
        },
        {
          id: "sleep-3",
          arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
          transcription: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
          russianTranscription: "Аллахумма кини 'азабака явма таб'асу 'ибадак",
          translation: "О Аллах, защити меня от Твоего наказания в день, когда Ты воскресишь Своих рабов",
          reference: "Сахих Абу Дауд 5046",
          audioUrl: null,
        },
        {
          id: "sleep-4",
          arabic: "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا",
          transcription: "Allahumma bismika amutu wa ahya",
          russianTranscription: "Аллахумма бисмика амуту ва ахья",
          translation: "О Аллах, с Твоим именем я умираю и оживаю",
          reference: "Сахих аль-Бухари 6324",
          audioUrl: null,
        },
      ],
    },
    {
      id: "morning",
      name: "Утренние",
      icon: Sunrise,
      color: "category-morning",
      description: "Дуа утром",
      duas: [
        {
          id: "morning-1",
          arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
          transcription: "Asbahna wa asbahal-mulku lillah",
          russianTranscription: "Асбахна ва асбахаль-мульку лиллах",
          translation: "Мы вступили в утро, и владычество принадлежит Аллаху",
          reference: "Сахих Муслим 2723",
          audioUrl: null,
        },
        {
          id: "morning-2",
          arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
          transcription: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur",
          russianTranscription: "Аллахумма бика асбахна ва бика амсайна ва бика нахья ва бика намуту ва иляйкан-нушур",
          translation: "О Аллах, с Тобой мы вступили в утро, с Тобой мы вступили в вечер, с Тобой мы живём, с Тобой мы умираем, и к Тебе воскрешение",
          reference: "Сахих Ат-Тирмизи 3391",
          audioUrl: null,
        },
        {
          id: "morning-3",
          arabic: "اللَّهُمَّ أَصْبَحْنَا نُشْهِدُكَ وَنُشْهِدُ حَمَلَةَ عَرْشِكَ",
          transcription: "Allahumma asbahna nushhiduka wa nushhidu hamalata 'arshik",
          russianTranscription: "Аллахумма асбахна нушихдука ва нушихду хамалята 'аршик",
          translation: "О Аллах, мы вступили в утро, свидетельствуя Тебя и свидетельствуя носителей Твоего Трона",
          reference: "Сахих Ат-Тирмизи 3392",
          audioUrl: null,
        },
      ],
    },
    {
      id: "evening",
      name: "Вечерние",
      icon: Sunset,
      color: "category-evening",
      description: "Дуа вечером",
      duas: [
        {
          id: "evening-1",
          arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
          transcription: "Amsayna wa amsal-mulku lillah",
          russianTranscription: "Амсайна ва амсаль-мульку лиллах",
          translation: "Мы вступили в вечер, и владычество принадлежит Аллаху",
          reference: "Сахих Муслим 2723",
          audioUrl: null,
        },
        {
          id: "evening-2",
          arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
          transcription: "Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namutu wa ilaykal-masir",
          russianTranscription: "Аллахумма бика амсайна ва бика асбахна ва бика нахья ва бика намуту ва иляйкаль-масир",
          translation: "О Аллах, с Тобой мы вступили в вечер, с Тобой мы вступили в утро, с Тобой мы живём, с Тобой мы умираем, и к Тебе возвращение",
          reference: "Сахих Ат-Тирмизи 3391",
          audioUrl: null,
        },
      ],
    },
    {
      id: "travel",
      name: "В путешествии",
      icon: Plane,
      color: "category-travel",
      description: "Дуа в пути",
      duas: [
        {
          id: "travel-1",
          arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ",
          transcription: "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun",
          russianTranscription: "Субханаллязи саххара ляна хаза ва ма кунна ляху мукринин ва инна иля раббина лямункалибун",
          translation: "Свят Тот, Кто подчинил нам это, а мы не были способны на это сами, и, поистине, мы возвращаемся к нашему Господу",
          reference: "Коран 43:13",
          audioUrl: null,
        },
        {
          id: "travel-2",
          arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ",
          transcription: "Allahumma inni nas'aluka fi safarina hadhal-birra wat-taqwa",
          russianTranscription: "Аллахумма инна нас'алюка фи сафарина хазаль-бирра ват-таква",
          translation: "О Аллах, мы просим Тебя о благочестии и богобоязненности в этом нашем путешествии",
          reference: "Сахих Муслим 1342",
          audioUrl: null,
        },
      ],
    },
    {
      id: "food",
      name: "Перед едой",
      icon: Utensils,
      color: "category-food",
      description: "Дуа перед едой",
      duas: [
        {
          id: "food-1",
          arabic: "بِسْمِ اللَّهِ",
          transcription: "Bismillah",
          russianTranscription: "Бисмиллах",
          translation: "С именем Аллаха",
          reference: "Сахих аль-Бухари 5376",
          audioUrl: null,
        },
        {
          id: "food-2",
          arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ",
          transcription: "Allahumma barik lana fihi wa at'imna khayran minhu",
          russianTranscription: "Аллахумма барик ляна фихи ва ат'имна хайран минху",
          translation: "О Аллах, благослови нас в этом и накорми нас лучшим, чем это",
          reference: "Сахих Ат-Тирмизи 3458",
          audioUrl: null,
        },
      ],
    },
    {
      id: "home",
      name: "При входе в дом",
      icon: Home,
      color: "category-home",
      description: "Дуа при входе",
      duas: [
        {
          id: "home-1",
          arabic: "بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا",
          transcription: "Bismillahi walajna wa bismillahi kharajna",
          russianTranscription: "Бисмиллахи валяджна ва бисмиллахи хараджна",
          translation: "С именем Аллаха мы входим, и с именем Аллаха мы выходим",
          reference: "Сахих Абу Дауд 5096",
          audioUrl: null,
        },
      ],
    },
    {
      id: "general",
      name: "Общие",
      icon: Heart,
      color: "category-general",
      description: "Общие дуа",
      duas: [
        {
          id: "general-1",
          arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          transcription: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
          russianTranscription: "Раббана атина фид-дунья хасанатан ва филь-ахирати хасанатан ва кина 'азабан-нар",
          translation: "Господь наш, даруй нам в этом мире благо и в Последней жизни благо, и защити нас от наказания Огня",
          reference: "Коран 2:201",
          audioUrl: null,
        },
        {
          id: "general-2",
          arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحُزْنِ",
          transcription: "Allahumma inni a'udhu bika minal-hammi wal-huzn",
          russianTranscription: "Аллахумма инни а'узу бика миналь-хамми валь-хузн",
          translation: "О Аллах, я прибегаю к Тебе от печали и горя",
          reference: "Сахих аль-Бухари 6369",
          audioUrl: null,
        },
      ],
    },
  ], []);

  // Get favorites from localStorage with state to trigger updates
  const [bookmarksUpdated, setBookmarksUpdated] = useState(0);
  
  const favorites = useMemo(() => {
    // Используем значение только для отслеживания изменений
    void bookmarksUpdated;
    try {
      const bookmarks = localStorage.getItem("prayer_debt_bookmarks");
      if (bookmarks) {
        const parsed = JSON.parse(bookmarks);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map((b: { id: string }) => b.id));
        }
      }
    } catch (error) {
      console.error("Error reading favorites:", error);
    }
    return new Set<string>();
  }, [bookmarksUpdated]);

  // Listen for storage changes to update favorites
  useEffect(() => {
    const handleStorageChange = () => {
      setBookmarksUpdated(prev => prev + 1);
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event (from same tab)
    window.addEventListener('bookmarksUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookmarksUpdated', handleStorageChange);
    };
  }, []);

  // Filter categories and duas
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filter by search query
    if (searchQuery) {
      filtered = categories.map((category) => ({
        ...category,
        duas: category.duas.filter(
          (dua) =>
            dua.arabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dua.transcription.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dua.russianTranscription && dua.russianTranscription.toLowerCase().includes(searchQuery.toLowerCase())) ||
            dua.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dua.reference.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.duas.length > 0);
    }

    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter((category) => category.id === selectedCategory);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.map((category) => ({
        ...category,
        duas: category.duas.filter((dua) => favorites.has(dua.id)),
      })).filter((category) => category.duas.length > 0);
    }

    return filtered;
  }, [searchQuery, selectedCategory, showFavoritesOnly, favorites, categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories.has(categoryId);
  };

  const totalDuas = categories.reduce((sum, cat) => sum + cat.duas.length, 0);
  const favoriteCount = categories.reduce((sum, cat) => 
    sum + cat.duas.filter((dua) => favorites.has(dua.id)).length, 0
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Search and Filters Bar */}
      <Card className="glass shadow-medium border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск по дуа..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Все ({totalDuas})
            </Button>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="rounded-full"
            >
              <Star className={cn("w-4 h-4 mr-2", showFavoritesOnly && "fill-current")} />
              Избранное ({favoriteCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Quick Access */}
      {!searchQuery && !selectedCategory && (
        <Card className="glass shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Категории</CardTitle>
            <CardDescription>Быстрый доступ к категориям дуа</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const categoryDuasCount = category.duas.length;
                const favoriteDuasInCategory = category.duas.filter((dua) => favorites.has(dua.id)).length;
                
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={cn(
                      "h-auto flex-col gap-2 p-4 rounded-xl transition-all duration-200",
                      "hover:scale-105 hover:shadow-md",
                      selectedCategory === category.id && "bg-primary text-primary-foreground shadow-glow"
                    )}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === category.id ? null : category.id);
                      setSearchQuery("");
                    }}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      selectedCategory === category.id 
                        ? "bg-primary-foreground/20" 
                        : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "w-6 h-6",
                        selectedCategory === category.id ? "text-primary-foreground" : "text-primary"
                      )} />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm">{category.name}</div>
                      <div className={cn(
                        "text-xs mt-1",
                        selectedCategory === category.id ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {categoryDuasCount} дуа
                        {favoriteDuasInCategory > 0 && (
                          <span className="ml-1">⭐ {favoriteDuasInCategory}</span>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <Card className="glass shadow-medium">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p className="text-lg mb-2">Ничего не найдено</p>
            <p className="text-sm">Попробуйте другой запрос или выберите другую категорию</p>
          </CardContent>
        </Card>
      ) : (
        filteredCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = isCategoryExpanded(category.id);
          const shouldShow = !selectedCategory || selectedCategory === category.id;

          if (!shouldShow) return null;

          return (
            <div key={category.id} className="space-y-4">
              <Card className="glass shadow-medium border-border/50 overflow-hidden hover:shadow-strong transition-all duration-300">
                <div className="h-1 bg-gradient-to-r from-primary/50 to-transparent" />
                <CardHeader className="cursor-pointer" onClick={() => toggleCategory(category.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                        <CardDescription>
                          {category.duas.length} {category.duas.length === 1 ? "дуа" : "дуа"} 
                          {category.description && ` • ${category.description}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Duas List */}
              {(isExpanded || selectedCategory === category.id) && (
                <div className="space-y-4 animate-in fade-in-50 duration-300">
                  {category.duas.map((dua) => (
                    <DuaCard key={dua.id} dua={dua} categoryColor={category.color} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Info Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-accent">Совет:</strong> Используйте поиск для быстрого нахождения нужного дуа, 
            или выберите категорию для просмотра всех дуа в ней. Сохраняйте избранные дуа для быстрого доступа.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Аят дня - красивый виджет с аятом Корана
import { useState, useEffect } from "react";
import { BookOpen, Share2, Heart, RefreshCw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";

interface Ayah {
  arabic: string;
  translation: string;
  transliteration?: string;
  surah: string;
  surahNumber: number;
  ayahNumber: number;
  theme: string;
}

// Коллекция избранных аятов
const AYAHS: Ayah[] = [
  {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Поистине, с трудностью приходит облегчение",
    transliteration: "Inna ma'al 'usri yusra",
    surah: "Аш-Шарх",
    surahNumber: 94,
    ayahNumber: 6,
    theme: "Надежда",
  },
  {
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    translation: "Кто уповает на Аллаха, тому Его достаточно",
    transliteration: "Wa man yatawakkal 'alallahi fahuwa hasbuh",
    surah: "Ат-Талак",
    surahNumber: 65,
    ayahNumber: 3,
    theme: "Упование",
  },
  {
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    translation: "Поминайте Меня, и Я буду помнить о вас",
    transliteration: "Fadhkuruni adhkurkum",
    surah: "Аль-Бакара",
    surahNumber: 2,
    ayahNumber: 152,
    theme: "Зикр",
  },
  {
    arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
    translation: "Когда спрашивают тебя рабы Мои обо Мне, то Я близок",
    transliteration: "Wa idha sa'alaka 'ibadi 'anni fa'inni qarib",
    surah: "Аль-Бакара",
    surahNumber: 2,
    ayahNumber: 186,
    theme: "Дуа",
  },
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    translation: "Господь наш! Даруй нам добро в этом мире и добро в Последней жизни",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanah",
    surah: "Аль-Бакара",
    surahNumber: 2,
    ayahNumber: 201,
    theme: "Дуа",
  },
  {
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Аллах не возлагает на душу больше, чем она может вынести",
    transliteration: "La yukallifullahu nafsan illa wus'aha",
    surah: "Аль-Бакара",
    surahNumber: 2,
    ayahNumber: 286,
    theme: "Милость",
  },
  {
    arabic: "وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",
    translation: "Терпи, ведь Аллах не теряет награды добродетельных",
    transliteration: "Wasbir fa'innallaha la yudi'u ajral muhsinin",
    surah: "Худ",
    surahNumber: 11,
    ayahNumber: 115,
    theme: "Терпение",
  },
  {
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    translation: "Поистине, Аллах с терпеливыми",
    transliteration: "Innallaha ma'as-sabirin",
    surah: "Аль-Бакара",
    surahNumber: 2,
    ayahNumber: 153,
    theme: "Терпение",
  },
  {
    arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
    translation: "Мой успех зависит только от Аллаха",
    transliteration: "Wa ma tawfiqi illa billah",
    surah: "Худ",
    surahNumber: 11,
    ayahNumber: 88,
    theme: "Упование",
  },
  {
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    translation: "Скажи: Он — Аллах Единый",
    transliteration: "Qul huwallahu ahad",
    surah: "Аль-Ихляс",
    surahNumber: 112,
    ayahNumber: 1,
    theme: "Таухид",
  },
];

// Получить аят дня (меняется каждый день)
const getAyahOfDay = (): Ayah => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return AYAHS[dayOfYear % AYAHS.length];
};

// Градиенты для тем
const THEME_GRADIENTS: Record<string, string> = {
  "Надежда": "from-emerald-500 to-teal-600",
  "Упование": "from-blue-500 to-indigo-600",
  "Зикр": "from-purple-500 to-violet-600",
  "Дуа": "from-cyan-500 to-blue-600",
  "Милость": "from-rose-500 to-pink-600",
  "Терпение": "from-amber-500 to-orange-600",
  "Таухид": "from-violet-500 to-purple-600",
};

interface AyahOfTheDayProps {
  variant?: "full" | "compact" | "minimal";
  className?: string;
}

export const AyahOfTheDay = ({ variant = "compact", className }: AyahOfTheDayProps) => {
  const [ayah, setAyah] = useState<Ayah>(getAyahOfDay());
  const [liked, setLiked] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);

  const gradient = THEME_GRADIENTS[ayah.theme] || "from-primary to-primary-dark";

  const handleLike = () => {
    setLiked(!liked);
    playSound("click");
  };

  const handleShare = async () => {
    playSound("click");
    const text = `${ayah.arabic}\n\n${ayah.translation}\n\n— ${ayah.surah}, ${ayah.ayahNumber}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        // Пользователь отменил
      }
    } else {
      // Копируем в буфер
      navigator.clipboard.writeText(text);
    }
  };

  const handleRefresh = () => {
    playSound("click");
    const currentIndex = AYAHS.indexOf(ayah);
    const nextIndex = (currentIndex + 1) % AYAHS.length;
    setAyah(AYAHS[nextIndex]);
  };

  if (variant === "minimal") {
    return (
      <div className={cn("bg-card rounded-xl p-4 border border-border/50", className)}>
        <p className="text-right font-arabic text-lg text-foreground leading-loose mb-2">
          {ayah.arabic}
        </p>
        <p className="text-sm text-muted-foreground">{ayah.translation}</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn(
        "rounded-2xl p-4 relative overflow-hidden slide-up",
        `bg-gradient-to-br ${gradient}`,
        className
      )}>
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs">Аят дня</p>
                <p className="text-white text-xs font-medium">{ayah.theme}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={handleLike}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Heart className={cn("w-4 h-4", liked ? "fill-white text-white" : "text-white/70")} />
              </button>
              <button 
                onClick={handleRefresh}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          <p className="text-right font-arabic text-xl text-white leading-loose mb-3">
            {ayah.arabic}
          </p>
          
          <p className="text-white/90 text-sm mb-2">{ayah.translation}</p>
          
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs">
              {ayah.surah}, {ayah.ayahNumber}
            </p>
            <button 
              onClick={handleShare}
              className="text-white/70 hover:text-white text-xs flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              Поделиться
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn(
      "bg-card rounded-2xl overflow-hidden border border-border/50 shadow-medium",
      className
    )}>
      {/* Header with gradient */}
      <div className={cn("p-5 relative overflow-hidden", `bg-gradient-to-br ${gradient}`)}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center subtle-float">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Аят дня</h3>
                <p className="text-white/70 text-sm">{ayah.theme}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium">
              {ayah.surah}
            </span>
          </div>

          <p className="text-right font-arabic text-2xl text-white leading-loose">
            {ayah.arabic}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {showTransliteration && ayah.transliteration && (
          <p className="text-primary italic text-sm mb-3 pb-3 border-b border-border/50">
            {ayah.transliteration}
          </p>
        )}
        
        <p className="text-foreground leading-relaxed mb-4">{ayah.translation}</p>
        
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Сура {ayah.surahNumber}, Аят {ayah.ayahNumber}
          </p>
          
          <div className="flex gap-2">
            {ayah.transliteration && (
              <button
                onClick={() => setShowTransliteration(!showTransliteration)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  showTransliteration 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                Abc
              </button>
            )}
            <button
              onClick={handleLike}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                liked 
                  ? "bg-rose-500/20 text-rose-500" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("w-5 h-5", liked && "fill-current")} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


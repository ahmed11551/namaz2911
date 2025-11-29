// Утилита для получения данных зикров, дуа, аятов по ID
// Использует e-Replika API (Bot.e-replika.ru/docs) как основной источник данных

import { eReplikaAPI } from "./api";

export interface DhikrItem {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string | null;
  count?: number; // Для зикров
  title?: string; // Для зикров
  category?: string;
  tags?: string[];
  surahNumber?: number; // Для аятов
  ayahNumber?: number; // Для аятов
  number?: number; // Для имен Аллаха, сур
}

// Данные дуа (из DuaSection)
const duasData: Record<string, DhikrItem> = {
  "morning-1": {
    id: "morning-1",
    arabic: "اللَّهُمَّ أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
    transcription: "Allahumma asbahna wa asbaha al-mulku lillah",
    russianTranscription: "Аллахумма асбахна ва асбаха аль-мульку лиллях",
    translation: "О Аллах, мы встретили утро, и вся власть принадлежит лишь Тебе",
    reference: "Сунан Абу Дауд",
    category: "morning",
    tags: ["утро", "благодарность"],
    audioUrl: null,
  },
  "morning-2": {
    id: "morning-2",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ وَنُورَهُ وَبَرَكَتَهُ",
    transcription: "Allahumma inni as’aluka khayra hadha al-yawmi wa nurahu wa barakatahu",
    russianTranscription: "О Аллах, прошу Тебя о добре, свете и благодати этого дня",
    translation: "Господи, даруй благо, свет и благословение этого дня",
    reference: "Муснад Ахмад",
    category: "morning",
    tags: ["начало дня", "барака"],
    audioUrl: null,
  },
  "evening-1": {
    id: "evening-1",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ مَا خَلَقْتَ",
    transcription: "Allahumma inni a’udhu bika min sharri ma khalaqt",
    russianTranscription: "О Аллах, ищу защиты у Тебя от зла того, что Ты сотворил",
    translation: "Господи, укрой меня от любого зла, что Ты создал",
    reference: "Сахих Муслим",
    category: "evening",
    tags: ["вечер", "защита"],
    audioUrl: null,
  },
  "sleep-1": {
    id: "sleep-1",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transcription: "Bismika Allahumma amutu wa ahya",
    russianTranscription: "Бисмика Аллахумма амуту ва ахья",
    translation: "С именем Твоим, О Аллах, я умираю и оживаю",
    reference: "Сахих аль-Бухари 6314",
    category: "night",
    tags: ["сон", "спокойствие"],
    audioUrl: null,
  },
  "gratitude-1": {
    id: "gratitude-1",
    arabic: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ فَمِنْكَ وَحْدَكَ",
    transcription: "Allahumma ma asbaha bi min ni’matin faminka wahdaka",
    russianTranscription: "О Аллах, любая милость, с которой я проснулся, от Тебя одного",
    translation: "Все блага, которыми я обладаю этим утром, от Тебя одного",
    reference: "Шарх ас-Сунна",
    category: "gratitude",
    tags: ["благодарность"],
    audioUrl: null,
  },
  "forgiveness-1": {
    id: "forgiveness-1",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ",
    transcription: "Rabbi ighfir li wa tub ‘alayya",
    russianTranscription: "Господи, прости меня и прими покаяние",
    translation: "Господи, прости меня и прими моё покаяние",
    reference: "Тирмизи",
    category: "repentance",
    tags: ["покаяние"],
    audioUrl: null,
  },
  "parents-1": {
    id: "parents-1",
    arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا",
    transcription: "Rabbi ighfir li wa liwalidayya warhamhuma",
    russianTranscription: "Господи, прости меня и моих родителей и смилуйся над ними",
    translation: "Господи, прости меня и моих родителей",
    reference: "Коран 71:28",
    category: "family",
    tags: ["родители", "милосердие"],
    audioUrl: null,
  },
  "travel-1": {
    id: "travel-1",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
    transcription: "Subhana alladhi sakhkhara lana hadha wa ma kunna lahu muqrinin",
    russianTranscription: "Пречист Тот, кто подчинил нам это, иначе мы бы не смогли",
    translation: "Хвала тому, кто подчинил нам это средство",
    reference: "Сунан Абу Дауд",
    category: "travel",
    tags: ["путешествие"],
    audioUrl: null,
  },
  "difficulty-1": {
    id: "difficulty-1",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transcription: "Hasbunallahu wa ni’ma al-wakil",
    russianTranscription: "Довольно нам Аллаха, и Он лучший Покровитель",
    translation: "Аллах нам достаточен, и Он лучший попечитель",
    reference: "Коран 3:173",
    category: "hardship",
    tags: ["уверенность"],
    audioUrl: null,
  },
  "relief-1": {
    id: "relief-1",
    arabic: "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا",
    transcription: "Allahumma la sahla illa ma ja’altahu sahlā",
    russianTranscription: "О Аллах, нет лёгкости, кроме той, что Ты сделал лёгкой",
    translation: "Господи, сделай трудное лёгким для нас",
    reference: "Ибн Хиббан",
    category: "hardship",
    tags: ["облегчение"],
    audioUrl: null,
  },
  "knowledge-1": {
    id: "knowledge-1",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transcription: "Rabbi zidni ‘ilma",
    russianTranscription: "Господи, прибавь мне знания",
    translation: "Господи, увеличь мои знания",
    reference: "Коран 20:114",
    category: "knowledge",
    tags: ["учёба"],
    audioUrl: null,
  },
  "protection-1": {
    id: "protection-1",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    transcription: "Allahumma inni a’udhu bika minal-hammi wal-hazan",
    russianTranscription: "О Аллах, ищу защиты у Тебя от тревоги и печали",
    translation: "Господи, укрой меня от тревоги и грусти",
    reference: "Сахих аль-Бухари",
    category: "protection",
    tags: ["спокойствие"],
    audioUrl: null,
  },
};

// Данные салаватов (из SalawatSection)
const salawatData: Record<string, DhikrItem> = {
  "salawat-1": {
    id: "salawat-1",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ",
    transcription: "Allahumma salli ‘ala Muhammadin wa ‘ala ali Muhammad kama sallayta ‘ala Ibrahim",
    russianTranscription: "О Аллах, благослови Мухаммада и его семейство, как Ты благословил Ибрахима",
    translation: "О Аллах, благослови Мухаммада и его семейство, как Ты благословил Ибрахима",
    reference: "Сахих аль-Бухари 3369",
    category: "general",
    audioUrl: null,
  },
  "salawat-2": {
    id: "salawat-2",
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
    transcription: "Allahumma salli wa sallim ‘ala nabiyyina Muhammad",
    russianTranscription: "О Аллах, ниспошли благословение и мир нашему Пророку Мухаммаду",
    translation: "О Аллах, даруй мир и благословение нашему пророку Мухаммаду",
    reference: "Ан-Насаи",
    category: "general",
    audioUrl: null,
  },
  "salawat-3": {
    id: "salawat-3",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ عَدَدَ مَا ذَكَرَهُ الذَّاكِرُونَ",
    transcription: "Allahumma salli ‘ala Muhammad ‘adada ma dhakarahu adh-dhakirun",
    russianTranscription: "О Аллах, благослови Мухаммада столько, сколько его поминают",
    translation: "О Аллах, благослови Мухаммада столько раз, сколько его поминают поминающие",
    reference: "Ибн Хаджар",
    category: "remembrance",
    audioUrl: null,
  },
};

// Данные калим (из KalimaSection)
const kalimasData: Record<string, DhikrItem> = {
  "kalima-1": {
    id: "kalima-1",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ",
    transcription: "La ilaha illallah, Muhammadur rasulullah",
    russianTranscription: "Нет божества, кроме Аллаха; Мухаммад — Посланник Аллаха",
    translation: "Нет божества, кроме Аллаха. Мухаммад — посланник Аллаха",
    reference: "Калима Шахада",
    category: "faith",
    audioUrl: null,
  },
  "kalima-2": {
    id: "kalima-2",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transcription: "La hawla wa la quwwata illa billah",
    russianTranscription: "Нет силы и мощи ни у кого, кроме Аллаха",
    translation: "Нет силы и мощи ни у кого, кроме Аллаха",
    category: "faith",
    audioUrl: null,
  },
  "kalima-3": {
    id: "kalima-3",
    arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ",
    transcription: "Subhanallahi walhamdulillah",
    russianTranscription: "Пречист Аллах, и Ему хвала",
    translation: "Преславен Аллах, и Ему хвала",
    category: "remembrance",
    audioUrl: null,
  },
};

// Данные азкаров (из AdhkarSection)
const adhkarData: Record<string, DhikrItem> = {
  "morning-adhkar-1": {
    id: "morning-adhkar-1",
    title: "Утреннее поминание",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا",
    transcription: "Allahumma bika asbahna wa bika amsayna",
    russianTranscription: "О Аллах, Тобой мы встретили утро и вечер",
    translation: "О Аллах, с Твоей помощью мы встречаем утро и вечер",
    count: 1,
    category: "morning",
    audioUrl: null,
  },
  "evening-adhkar-1": {
    id: "evening-adhkar-1",
    title: "Вечерняя защита",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ",
    transcription: "A’udhu bikalimatillahi at-tammati",
    russianTranscription: "Ищу защиты в совершенных словах Аллаха",
    translation: "Ищу защиты в совершенных словах Аллаха от любого зла",
    count: 3,
    category: "evening",
    audioUrl: null,
  },
  "tasbih": {
    id: "tasbih",
    title: "Тасбих",
    arabic: "سُبْحَانَ اللَّهِ",
    transcription: "Subhanallah",
    russianTranscription: "Субханаллах",
    translation: "Преславен Аллах",
    count: 33,
    category: "after-prayer",
    audioUrl: null,
  },
  "tahmid": {
    id: "tahmid",
    title: "Тахмид",
    arabic: "الْحَمْدُ لِلَّهِ",
    transcription: "Alhamdulillah",
    russianTranscription: "Альхамдулиллах",
    translation: "Хвала Аллаху",
    count: 33,
    category: "after-prayer",
    audioUrl: null,
  },
  "takbir": {
    id: "takbir",
    title: "Такбир",
    arabic: "اللَّهُ أَكْبَرُ",
    transcription: "Allahu Akbar",
    russianTranscription: "Аллаху Акбар",
    translation: "Аллах велик",
    count: 34,
    category: "after-prayer",
    audioUrl: null,
  },
  "seeking-forgiveness": {
    id: "seeking-forgiveness",
    title: "Астагфируллах",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    transcription: "Astaghfirullah wa atubu ilayh",
    russianTranscription: "Прошу у Аллаха прощения и возвращаюсь к Нему",
    translation: "Я прошу у Аллаха прощения и обращаюсь к Нему с покаянием",
    count: 3,
    category: "repentance",
    audioUrl: null,
  },
  "peace": {
    id: "peace",
    title: "Дуа о спокойствии",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
    transcription: "Ya Hayyu ya Qayyum birahmatika astaghith",
    russianTranscription: "О Живой, о Вечный, прошу Твоей милости",
    translation: "О Живой, о Сущий, прошу Твою милость и спокойствие",
    count: 1,
    category: "relief",
    audioUrl: null,
  },
};

// Функция для получения данных по ID и типу (асинхронная, использует e-Replika API)
export async function getDhikrItemById(
  itemId: string,
  itemType: "dua" | "ayah" | "surah" | "adhkar" | "salawat" | "kalima" | "name_of_allah"
): Promise<DhikrItem | null> {
  try {
    switch (itemType) {
      case "dua": {
        // Получаем из e-Replika API
        const dua = await eReplikaAPI.getDuaById(itemId);
        if (dua) {
          return {
            id: dua.id,
            arabic: dua.arabic,
            transcription: dua.transcription,
            russianTranscription: dua.russianTranscription,
            translation: dua.translation,
            reference: dua.reference,
            audioUrl: dua.audioUrl,
          };
        }
        // Fallback на локальные данные
        return duasData[itemId] || null;
      }
      case "salawat": {
        // Получаем из e-Replika API
        const salawat = await eReplikaAPI.getSalawat();
        const item = salawat.find(s => s.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            reference: item.reference,
            audioUrl: item.audioUrl,
          };
        }
        return salawatData[itemId] || null;
      }
      case "kalima": {
        // Получаем из e-Replika API
        const kalimas = await eReplikaAPI.getKalimas();
        const item = kalimas.find(k => k.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            reference: item.reference,
            audioUrl: item.audioUrl,
          };
        }
        return kalimasData[itemId] || null;
      }
      case "adhkar": {
        // Получаем из e-Replika API
        const adhkar = await eReplikaAPI.getAdhkar();
        const item = adhkar.find(a => a.id === itemId);
        if (item) {
          return {
            id: item.id,
            title: item.title,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            count: item.count,
            audioUrl: item.audioUrl,
          };
        }
        return adhkarData[itemId] || null;
      }
      case "ayah": {
        // Получаем из e-Replika API
        const ayahs = await eReplikaAPI.getAyahs();
        const item = ayahs.find(a => a.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            surahNumber: item.surahNumber,
            ayahNumber: item.ayahNumber,
            audioUrl: item.audioUrl,
          };
        }
        return null;
      }
      case "name_of_allah": {
        // Получаем из e-Replika API
        const names = await eReplikaAPI.getNamesOfAllah();
        const item = names.find(n => n.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            number: item.number,
            audioUrl: item.audioUrl,
          };
        }
        return null;
      }
      case "surah": {
        // Получаем из e-Replika API
        const surahs = await eReplikaAPI.getSurahs();
        const surah = surahs.find(s => s.id === itemId);
        if (surah) {
          return {
            id: surah.id,
            arabic: surah.nameArabic,
            transcription: surah.nameTransliteration,
            translation: surah.name,
            number: surah.number,
          };
        }
        return null;
      }
      default:
        return null;
    }
  } catch (error) {
    console.error("Error fetching dhikr item:", error);
    // Fallback на расширенные локальные данные
    switch (itemType) {
      case "dua":
        return allDuasData[itemId] || null;
      case "salawat":
        return allSalawatData[itemId] || null;
      case "kalima":
        return allKalimasData[itemId] || null;
      case "adhkar":
        return allAdhkarData[itemId] || null;
      case "surah":
        return localSurahs.find(s => s.id === itemId) || null;
      case "name_of_allah":
        return localNamesOfAllah.find(n => n.id === itemId) || null;
      default:
        return null;
    }
  }
}

// Функция для получения всех доступных элементов по категории (асинхронная, использует e-Replika API)
export async function getAvailableItemsByCategory(
  category: "dua" | "adhkar" | "salawat" | "kalima"
): Promise<DhikrItem[]> {
  // Локальные данные как fallback (используем расширенные данные)
  const getLocalData = () => {
    switch (category) {
      case "dua":
        return Object.values(allDuasData);
      case "salawat":
        return Object.values(allSalawatData);
      case "kalima":
        return Object.values(allKalimasData);
      case "adhkar":
        return Object.values(allAdhkarData);
      default:
        return [];
    }
  };

  try {
    let items: DhikrItem[] = [];
    
    switch (category) {
      case "dua": {
        const duas = await eReplikaAPI.getDuas();
        items = duas.map(dua => ({
          id: dua.id,
          arabic: dua.arabic,
          transcription: dua.transcription,
          russianTranscription: dua.russianTranscription,
          translation: dua.translation,
          reference: dua.reference,
          audioUrl: dua.audioUrl,
          category: dua.category || "general",
        }));
        break;
      }
      case "salawat": {
        const salawat = await eReplikaAPI.getSalawat();
        items = salawat.map(item => ({
          id: item.id,
          arabic: item.arabic,
          transcription: item.transcription,
          russianTranscription: item.russianTranscription,
          translation: item.translation,
          reference: item.reference,
          audioUrl: item.audioUrl,
        }));
        break;
      }
      case "kalima": {
        const kalimas = await eReplikaAPI.getKalimas();
        items = kalimas.map(item => ({
          id: item.id,
          arabic: item.arabic,
          transcription: item.transcription,
          russianTranscription: item.russianTranscription,
          translation: item.translation,
          reference: item.reference,
          audioUrl: item.audioUrl,
        }));
        break;
      }
      case "adhkar": {
        const adhkar = await eReplikaAPI.getAdhkar();
        items = adhkar.map(item => ({
          id: item.id,
          title: item.title,
          arabic: item.arabic,
          transcription: item.transcription,
          russianTranscription: item.russianTranscription,
          translation: item.translation,
          count: item.count,
          audioUrl: item.audioUrl,
          category: item.category || "general",
        }));
        break;
      }
    }

    // Если API вернул пустой массив, используем локальные данные
    if (items.length === 0) {
      console.log(`API returned empty for ${category}, using local data`);
      return getLocalData();
    }

    return items;
  } catch (error) {
    console.error("Error fetching items by category from e-Replika API:", error);
    return getLocalData();
  }
}

// Функция для получения аятов (из e-Replika API)
export async function getAyahs(surahNumber?: number): Promise<DhikrItem[]> {
  try {
    const ayahs = await eReplikaAPI.getAyahs(surahNumber);
    return ayahs.map(item => ({
      id: item.id,
      arabic: item.arabic,
      transcription: item.transcription,
      russianTranscription: item.russianTranscription,
      translation: item.translation,
      surahNumber: item.surahNumber,
      ayahNumber: item.ayahNumber,
      audioUrl: item.audioUrl,
    }));
  } catch (error) {
    console.error("Error fetching ayahs from e-Replika API:", error);
    return [];
  }
}

// Импорт полных данных из расширенных модулей
import { ALL_SURAHS } from "./quran-data";
import { NAMES_OF_ALLAH } from "./names-of-allah";
import { EXTENDED_DUAS, EXTENDED_ADHKAR, EXTENDED_SALAWAT, EXTENDED_KALIMAS } from "./dhikr-extended-data";

// Локальные данные сур (все 114 сур из quran-data)
const localSurahs: DhikrItem[] = ALL_SURAHS.map(s => ({
  id: s.id,
  arabic: s.nameArabic,
  transcription: s.nameTransliteration,
  translation: s.name,
  number: s.number,
}));

// Локальные данные 99 имён Аллаха (полный список из names-of-allah)
const localNamesOfAllah: DhikrItem[] = NAMES_OF_ALLAH.map(n => ({
  id: n.id,
  arabic: n.arabic,
  transcription: n.transcription,
  russianTranscription: n.russianTranscription,
  translation: n.translation,
  number: n.number,
}));

// Расширенные локальные дуа
const extendedDuasData: Record<string, DhikrItem> = EXTENDED_DUAS.reduce((acc, dua) => {
  acc[dua.id] = dua;
  return acc;
}, {} as Record<string, DhikrItem>);

// Расширенные локальные азкары
const extendedAdhkarData: Record<string, DhikrItem> = EXTENDED_ADHKAR.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, DhikrItem>);

// Расширенные локальные салаваты
const extendedSalawatData: Record<string, DhikrItem> = EXTENDED_SALAWAT.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, DhikrItem>);

// Расширенные локальные калимы
const extendedKalimasData: Record<string, DhikrItem> = EXTENDED_KALIMAS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, DhikrItem>);

// Объединённые данные (старые + новые)
const allDuasData = { ...duasData, ...extendedDuasData };
const allAdhkarData = { ...adhkarData, ...extendedAdhkarData };
const allSalawatData = { ...salawatData, ...extendedSalawatData };
const allKalimasData = { ...kalimasData, ...extendedKalimasData };

// Функция для получения сур (из e-Replika API)
export async function getSurahs(): Promise<DhikrItem[]> {
  try {
    const surahs = await eReplikaAPI.getSurahs();
    const items = surahs.map(item => ({
      id: item.id,
      arabic: item.nameArabic,
      transcription: item.nameTransliteration,
      translation: item.name,
      number: item.number,
    }));
    
    // Если API вернул пустой массив, используем локальные данные
    if (items.length === 0) {
      console.log("API returned empty for surahs, using local data");
      return localSurahs;
    }
    
    return items;
  } catch (error) {
    console.error("Error fetching surahs from e-Replika API:", error);
    return localSurahs;
  }
}

// Функция для получения 99 имен Аллаха (из e-Replika API)
export async function getNamesOfAllah(): Promise<DhikrItem[]> {
  try {
    const names = await eReplikaAPI.getNamesOfAllah();
    const items = names.map(item => ({
      id: item.id,
      arabic: item.arabic,
      transcription: item.transcription,
      russianTranscription: item.russianTranscription,
      translation: item.translation,
      number: item.number,
      audioUrl: item.audioUrl,
    }));
    
    // Если API вернул пустой массив, используем локальные данные
    if (items.length === 0) {
      console.log("API returned empty for names of Allah, using local data");
      return localNamesOfAllah;
    }
    
    return items;
  } catch (error) {
    console.error("Error fetching names of Allah from e-Replika API:", error);
    return localNamesOfAllah;
  }
}


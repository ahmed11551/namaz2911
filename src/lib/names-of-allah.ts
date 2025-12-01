// 99 Прекрасных Имён Аллаха (Асма уль-Хусна)
// Источник: https://bot.e-replika.ru/docs

export interface NameOfAllah {
  id: string;
  number: number;
  arabic: string;
  transcription: string;
  russianTranscription: string;
  translation: string;
  meaning: string;
  audioUrl?: string | null;
}

// Полный список 99 имён Аллаха
export const NAMES_OF_ALLAH: NameOfAllah[] = [
  { id: "name-1", number: 1, arabic: "الله", transcription: "Allah", russianTranscription: "Аллах", translation: "Бог", meaning: "Единственный истинный Бог, достойный поклонения" },
  { id: "name-2", number: 2, arabic: "الرَّحْمَنُ", transcription: "Ar-Rahman", russianTranscription: "Ар-Рахман", translation: "Милостивый", meaning: "Обладатель безграничной милости ко всем творениям" },
  { id: "name-3", number: 3, arabic: "الرَّحِيمُ", transcription: "Ar-Rahim", russianTranscription: "Ар-Рахим", translation: "Милосердный", meaning: "Проявляющий особую милость к верующим" },
  { id: "name-4", number: 4, arabic: "الْمَلِكُ", transcription: "Al-Malik", russianTranscription: "Аль-Малик", translation: "Царь, Владыка", meaning: "Абсолютный Властелин всего сущего" },
  { id: "name-5", number: 5, arabic: "الْقُدُّوسُ", transcription: "Al-Quddus", russianTranscription: "Аль-Куддус", translation: "Святой", meaning: "Пречистый от любых недостатков" },
  { id: "name-6", number: 6, arabic: "السَّلَامُ", transcription: "As-Salam", russianTranscription: "Ас-Салям", translation: "Мир", meaning: "Источник мира и безопасности" },
  { id: "name-7", number: 7, arabic: "الْمُؤْمِنُ", transcription: "Al-Mu'min", russianTranscription: "Аль-Мумин", translation: "Оберегающий веру", meaning: "Дарующий безопасность и веру" },
  { id: "name-8", number: 8, arabic: "الْمُهَيْمِنُ", transcription: "Al-Muhaymin", russianTranscription: "Аль-Мухаймин", translation: "Хранитель", meaning: "Наблюдающий и оберегающий всё" },
  { id: "name-9", number: 9, arabic: "الْعَزِيزُ", transcription: "Al-Aziz", russianTranscription: "Аль-Азиз", translation: "Могущественный", meaning: "Непобедимый, Всемогущий" },
  { id: "name-10", number: 10, arabic: "الْجَبَّارُ", transcription: "Al-Jabbar", russianTranscription: "Аль-Джаббар", translation: "Могучий", meaning: "Исправляющий и подчиняющий" },
  { id: "name-11", number: 11, arabic: "الْمُتَكَبِّرُ", transcription: "Al-Mutakabbir", russianTranscription: "Аль-Мутакаббир", translation: "Превосходящий", meaning: "Величайший, превыше всего" },
  { id: "name-12", number: 12, arabic: "الْخَالِقُ", transcription: "Al-Khaliq", russianTranscription: "Аль-Халик", translation: "Творец", meaning: "Создатель всего из ничего" },
  { id: "name-13", number: 13, arabic: "الْبَارِئُ", transcription: "Al-Bari", russianTranscription: "Аль-Бари", translation: "Создатель", meaning: "Создающий без образца" },
  { id: "name-14", number: 14, arabic: "الْمُصَوِّرُ", transcription: "Al-Musawwir", russianTranscription: "Аль-Мусаввир", translation: "Придающий облик", meaning: "Дающий форму каждому творению" },
  { id: "name-15", number: 15, arabic: "الْغَفَّارُ", transcription: "Al-Ghaffar", russianTranscription: "Аль-Гаффар", translation: "Всепрощающий", meaning: "Многократно прощающий грехи" },
  { id: "name-16", number: 16, arabic: "الْقَهَّارُ", transcription: "Al-Qahhar", russianTranscription: "Аль-Каххар", translation: "Господствующий", meaning: "Подчиняющий Своей воле всё" },
  { id: "name-17", number: 17, arabic: "الْوَهَّابُ", transcription: "Al-Wahhab", russianTranscription: "Аль-Ваххаб", translation: "Дарующий", meaning: "Безвозмездно одаривающий" },
  { id: "name-18", number: 18, arabic: "الرَّزَّاقُ", transcription: "Ar-Razzaq", russianTranscription: "Ар-Раззак", translation: "Наделяющий уделом", meaning: "Дающий пропитание всем" },
  { id: "name-19", number: 19, arabic: "الْفَتَّاحُ", transcription: "Al-Fattah", russianTranscription: "Аль-Фаттах", translation: "Открывающий", meaning: "Открывающий врата милости" },
  { id: "name-20", number: 20, arabic: "الْعَلِيمُ", transcription: "Al-Alim", russianTranscription: "Аль-Алим", translation: "Всезнающий", meaning: "Знающий всё явное и сокрытое" },
  { id: "name-21", number: 21, arabic: "الْقَابِضُ", transcription: "Al-Qabid", russianTranscription: "Аль-Кабид", translation: "Сжимающий", meaning: "Ограничивающий удел" },
  { id: "name-22", number: 22, arabic: "الْبَاسِطُ", transcription: "Al-Basit", russianTranscription: "Аль-Басит", translation: "Расширяющий", meaning: "Расширяющий удел и сердца" },
  { id: "name-23", number: 23, arabic: "الْخَافِضُ", transcription: "Al-Khafid", russianTranscription: "Аль-Хафид", translation: "Понижающий", meaning: "Унижающий неверующих" },
  { id: "name-24", number: 24, arabic: "الرَّافِعُ", transcription: "Ar-Rafi", russianTranscription: "Ар-Рафи", translation: "Возвышающий", meaning: "Возвышающий верующих" },
  { id: "name-25", number: 25, arabic: "الْمُعِزُّ", transcription: "Al-Mu'izz", russianTranscription: "Аль-Муизз", translation: "Дающий могущество", meaning: "Возвеличивающий кого пожелает" },
  { id: "name-26", number: 26, arabic: "الْمُذِلُّ", transcription: "Al-Mudhill", russianTranscription: "Аль-Музилль", translation: "Унижающий", meaning: "Унижающий кого пожелает" },
  { id: "name-27", number: 27, arabic: "السَّمِيعُ", transcription: "As-Sami", russianTranscription: "Ас-Сами", translation: "Всеслышащий", meaning: "Слышащий все звуки и мольбы" },
  { id: "name-28", number: 28, arabic: "الْبَصِيرُ", transcription: "Al-Basir", russianTranscription: "Аль-Басыр", translation: "Всевидящий", meaning: "Видящий всё явное и сокрытое" },
  { id: "name-29", number: 29, arabic: "الْحَكَمُ", transcription: "Al-Hakam", russianTranscription: "Аль-Хакам", translation: "Судья", meaning: "Справедливый Судья" },
  { id: "name-30", number: 30, arabic: "الْعَدْلُ", transcription: "Al-Adl", russianTranscription: "Аль-Адль", translation: "Справедливый", meaning: "Абсолютно справедливый" },
  { id: "name-31", number: 31, arabic: "اللَّطِيفُ", transcription: "Al-Latif", russianTranscription: "Аль-Латыф", translation: "Добрый, Проницательный", meaning: "Знающий тонкости и проявляющий заботу" },
  { id: "name-32", number: 32, arabic: "الْخَبِيرُ", transcription: "Al-Khabir", russianTranscription: "Аль-Хабир", translation: "Сведущий", meaning: "Осведомлённый обо всём" },
  { id: "name-33", number: 33, arabic: "الْحَلِيمُ", transcription: "Al-Halim", russianTranscription: "Аль-Халим", translation: "Кроткий", meaning: "Не спешащий с наказанием" },
  { id: "name-34", number: 34, arabic: "الْعَظِيمُ", transcription: "Al-Azim", russianTranscription: "Аль-Азым", translation: "Великий", meaning: "Величественный, Превеликий" },
  { id: "name-35", number: 35, arabic: "الْغَفُورُ", transcription: "Al-Ghafur", russianTranscription: "Аль-Гафур", translation: "Прощающий", meaning: "Много и часто прощающий" },
  { id: "name-36", number: 36, arabic: "الشَّكُورُ", transcription: "Ash-Shakur", russianTranscription: "Аш-Шакур", translation: "Благодарный", meaning: "Воздающий за малое многим" },
  { id: "name-37", number: 37, arabic: "الْعَلِيُّ", transcription: "Al-Aliyy", russianTranscription: "Аль-Алий", translation: "Высочайший", meaning: "Превознесённый над всем" },
  { id: "name-38", number: 38, arabic: "الْكَبِيرُ", transcription: "Al-Kabir", russianTranscription: "Аль-Кабир", translation: "Большой", meaning: "Величайший во всём" },
  { id: "name-39", number: 39, arabic: "الْحَفِيظُ", transcription: "Al-Hafiz", russianTranscription: "Аль-Хафиз", translation: "Хранящий", meaning: "Оберегающий всё творение" },
  { id: "name-40", number: 40, arabic: "الْمُقِيتُ", transcription: "Al-Muqit", russianTranscription: "Аль-Мукыт", translation: "Поддерживающий", meaning: "Дающий пропитание и силу" },
  { id: "name-41", number: 41, arabic: "الْحَسِيبُ", transcription: "Al-Hasib", russianTranscription: "Аль-Хасиб", translation: "Расчётливый", meaning: "Достаточный, Учитывающий" },
  { id: "name-42", number: 42, arabic: "الْجَلِيلُ", transcription: "Al-Jalil", russianTranscription: "Аль-Джалиль", translation: "Величественный", meaning: "Обладатель величия и славы" },
  { id: "name-43", number: 43, arabic: "الْكَرِيمُ", transcription: "Al-Karim", russianTranscription: "Аль-Карим", translation: "Щедрый", meaning: "Благородный, Великодушный" },
  { id: "name-44", number: 44, arabic: "الرَّقِيبُ", transcription: "Ar-Raqib", russianTranscription: "Ар-Ракыб", translation: "Наблюдающий", meaning: "Следящий за всем" },
  { id: "name-45", number: 45, arabic: "الْمُجِيبُ", transcription: "Al-Mujib", russianTranscription: "Аль-Муджиб", translation: "Отвечающий", meaning: "Отвечающий на мольбы" },
  { id: "name-46", number: 46, arabic: "الْوَاسِعُ", transcription: "Al-Wasi", russianTranscription: "Аль-Васи", translation: "Объемлющий", meaning: "Всеохватывающий Своим знанием и милостью" },
  { id: "name-47", number: 47, arabic: "الْحَكِيمُ", transcription: "Al-Hakim", russianTranscription: "Аль-Хаким", translation: "Мудрый", meaning: "Обладатель совершенной мудрости" },
  { id: "name-48", number: 48, arabic: "الْوَدُودُ", transcription: "Al-Wadud", russianTranscription: "Аль-Вадуд", translation: "Любящий", meaning: "Проявляющий любовь к рабам" },
  { id: "name-49", number: 49, arabic: "الْمَجِيدُ", transcription: "Al-Majid", russianTranscription: "Аль-Маджид", translation: "Славный", meaning: "Обладатель славы и щедрости" },
  { id: "name-50", number: 50, arabic: "الْبَاعِثُ", transcription: "Al-Ba'ith", russianTranscription: "Аль-Баис", translation: "Воскрешающий", meaning: "Воскрешающий творения" },
  { id: "name-51", number: 51, arabic: "الشَّهِيدُ", transcription: "Ash-Shahid", russianTranscription: "Аш-Шахид", translation: "Свидетель", meaning: "Видящий и знающий всё" },
  { id: "name-52", number: 52, arabic: "الْحَقُّ", transcription: "Al-Haqq", russianTranscription: "Аль-Хакк", translation: "Истина", meaning: "Несомненная Истина" },
  { id: "name-53", number: 53, arabic: "الْوَكِيلُ", transcription: "Al-Wakil", russianTranscription: "Аль-Вакиль", translation: "Попечитель", meaning: "Достаточный Попечитель" },
  { id: "name-54", number: 54, arabic: "الْقَوِيُّ", transcription: "Al-Qawiyy", russianTranscription: "Аль-Кавий", translation: "Сильный", meaning: "Обладатель совершенной силы" },
  { id: "name-55", number: 55, arabic: "الْمَتِينُ", transcription: "Al-Matin", russianTranscription: "Аль-Матин", translation: "Прочный", meaning: "Непоколебимый в Своей силе" },
  { id: "name-56", number: 56, arabic: "الْوَلِيُّ", transcription: "Al-Waliyy", russianTranscription: "Аль-Валий", translation: "Покровитель", meaning: "Близкий Покровитель верующих" },
  { id: "name-57", number: 57, arabic: "الْحَمِيدُ", transcription: "Al-Hamid", russianTranscription: "Аль-Хамид", translation: "Славный", meaning: "Достойный всяческой хвалы" },
  { id: "name-58", number: 58, arabic: "الْمُحْصِي", transcription: "Al-Muhsi", russianTranscription: "Аль-Мухсы", translation: "Учитывающий", meaning: "Знающий число всего" },
  { id: "name-59", number: 59, arabic: "الْمُبْدِئُ", transcription: "Al-Mubdi", russianTranscription: "Аль-Мубди", translation: "Начинающий", meaning: "Начинающий творение" },
  { id: "name-60", number: 60, arabic: "الْمُعِيدُ", transcription: "Al-Mu'id", russianTranscription: "Аль-Муид", translation: "Возвращающий", meaning: "Воссоздающий творение" },
  { id: "name-61", number: 61, arabic: "الْمُحْيِي", transcription: "Al-Muhyi", russianTranscription: "Аль-Мухйи", translation: "Оживляющий", meaning: "Дарующий жизнь" },
  { id: "name-62", number: 62, arabic: "الْمُمِيتُ", transcription: "Al-Mumit", russianTranscription: "Аль-Мумит", translation: "Умерщвляющий", meaning: "Забирающий жизнь" },
  { id: "name-63", number: 63, arabic: "الْحَيُّ", transcription: "Al-Hayy", russianTranscription: "Аль-Хайй", translation: "Живой", meaning: "Вечно Живой" },
  { id: "name-64", number: 64, arabic: "الْقَيُّومُ", transcription: "Al-Qayyum", russianTranscription: "Аль-Каййум", translation: "Сущий", meaning: "Самодостаточный, Поддерживающий всё" },
  { id: "name-65", number: 65, arabic: "الْوَاجِدُ", transcription: "Al-Wajid", russianTranscription: "Аль-Ваджид", translation: "Находящий", meaning: "Не нуждающийся ни в чём" },
  { id: "name-66", number: 66, arabic: "الْمَاجِدُ", transcription: "Al-Majid", russianTranscription: "Аль-Маджид", translation: "Благородный", meaning: "Щедрый и Великодушный" },
  { id: "name-67", number: 67, arabic: "الْوَاحِدُ", transcription: "Al-Wahid", russianTranscription: "Аль-Вахид", translation: "Единый", meaning: "Единственный без сотоварища" },
  { id: "name-68", number: 68, arabic: "الصَّمَدُ", transcription: "As-Samad", russianTranscription: "Ас-Самад", translation: "Вечный", meaning: "К Которому обращаются все" },
  { id: "name-69", number: 69, arabic: "الْقَادِرُ", transcription: "Al-Qadir", russianTranscription: "Аль-Кадир", translation: "Могущественный", meaning: "Способный на всё" },
  { id: "name-70", number: 70, arabic: "الْمُقْتَدِرُ", transcription: "Al-Muqtadir", russianTranscription: "Аль-Муктадир", translation: "Всемогущий", meaning: "Определяющий меру всего" },
  { id: "name-71", number: 71, arabic: "الْمُقَدِّمُ", transcription: "Al-Muqaddim", russianTranscription: "Аль-Мукаддим", translation: "Выдвигающий вперёд", meaning: "Приближающий кого пожелает" },
  { id: "name-72", number: 72, arabic: "الْمُؤَخِّرُ", transcription: "Al-Mu'akhkhir", russianTranscription: "Аль-Муаххир", translation: "Откладывающий", meaning: "Отдаляющий кого пожелает" },
  { id: "name-73", number: 73, arabic: "الْأَوَّلُ", transcription: "Al-Awwal", russianTranscription: "Аль-Авваль", translation: "Первый", meaning: "Предвечный, без начала" },
  { id: "name-74", number: 74, arabic: "الْآخِرُ", transcription: "Al-Akhir", russianTranscription: "Аль-Ахир", translation: "Последний", meaning: "Вечный, без конца" },
  { id: "name-75", number: 75, arabic: "الظَّاهِرُ", transcription: "Az-Zahir", russianTranscription: "Аз-Захир", translation: "Явный", meaning: "Превосходящий всё" },
  { id: "name-76", number: 76, arabic: "الْبَاطِنُ", transcription: "Al-Batin", russianTranscription: "Аль-Батын", translation: "Скрытый", meaning: "Знающий тайное" },
  { id: "name-77", number: 77, arabic: "الْوَالِي", transcription: "Al-Wali", russianTranscription: "Аль-Вали", translation: "Правитель", meaning: "Управляющий всеми делами" },
  { id: "name-78", number: 78, arabic: "الْمُتَعَالِي", transcription: "Al-Muta'ali", russianTranscription: "Аль-Мутаали", translation: "Превознесённый", meaning: "Возвышенный над всем" },
  { id: "name-79", number: 79, arabic: "الْبَرُّ", transcription: "Al-Barr", russianTranscription: "Аль-Барр", translation: "Благостный", meaning: "Добродетельный к творениям" },
  { id: "name-80", number: 80, arabic: "التَّوَّابُ", transcription: "At-Tawwab", russianTranscription: "Ат-Тавваб", translation: "Принимающий покаяние", meaning: "Много принимающий покаяние" },
  { id: "name-81", number: 81, arabic: "الْمُنْتَقِمُ", transcription: "Al-Muntaqim", russianTranscription: "Аль-Мунтаким", translation: "Воздающий", meaning: "Карающий упорствующих" },
  { id: "name-82", number: 82, arabic: "الْعَفُوُّ", transcription: "Al-Afuww", russianTranscription: "Аль-Афувв", translation: "Извиняющий", meaning: "Стирающий грехи" },
  { id: "name-83", number: 83, arabic: "الرَّؤُوفُ", transcription: "Ar-Ra'uf", russianTranscription: "Ар-Рауф", translation: "Сострадательный", meaning: "Нежный и Заботливый" },
  { id: "name-84", number: 84, arabic: "مَالِكُ الْمُلْكِ", transcription: "Malik al-Mulk", russianTranscription: "Малик уль-Мульк", translation: "Владыка царства", meaning: "Властелин всего сущего" },
  { id: "name-85", number: 85, arabic: "ذُو الْجَلَالِ وَالْإِكْرَامِ", transcription: "Dhul-Jalali wal-Ikram", russianTranscription: "Зуль-Джаляли валь-Икрам", translation: "Обладатель величия и почёта", meaning: "Достойный почитания" },
  { id: "name-86", number: 86, arabic: "الْمُقْسِطُ", transcription: "Al-Muqsit", russianTranscription: "Аль-Муксит", translation: "Справедливый", meaning: "Воздающий по справедливости" },
  { id: "name-87", number: 87, arabic: "الْجَامِعُ", transcription: "Al-Jami", russianTranscription: "Аль-Джами", translation: "Собирающий", meaning: "Объединяющий творения" },
  { id: "name-88", number: 88, arabic: "الْغَنِيُّ", transcription: "Al-Ghaniyy", russianTranscription: "Аль-Ганий", translation: "Богатый", meaning: "Не нуждающийся ни в ком" },
  { id: "name-89", number: 89, arabic: "الْمُغْنِي", transcription: "Al-Mughni", russianTranscription: "Аль-Мугни", translation: "Обогащающий", meaning: "Делающий богатыми" },
  { id: "name-90", number: 90, arabic: "الْمَانِعُ", transcription: "Al-Mani", russianTranscription: "Аль-Мани", translation: "Защищающий", meaning: "Удерживающий от вреда" },
  { id: "name-91", number: 91, arabic: "الضَّارُّ", transcription: "Ad-Darr", russianTranscription: "Ад-Дарр", translation: "Причиняющий вред", meaning: "Поражающий кого пожелает" },
  { id: "name-92", number: 92, arabic: "النَّافِعُ", transcription: "An-Nafi", russianTranscription: "Ан-Нафи", translation: "Приносящий пользу", meaning: "Дающий пользу кому пожелает" },
  { id: "name-93", number: 93, arabic: "النُّورُ", transcription: "An-Nur", russianTranscription: "Ан-Нур", translation: "Свет", meaning: "Свет небес и земли" },
  { id: "name-94", number: 94, arabic: "الْهَادِي", transcription: "Al-Hadi", russianTranscription: "Аль-Хади", translation: "Ведущий", meaning: "Направляющий на истинный путь" },
  { id: "name-95", number: 95, arabic: "الْبَدِيعُ", transcription: "Al-Badi", russianTranscription: "Аль-Бади", translation: "Изобретатель", meaning: "Создатель без образца" },
  { id: "name-96", number: 96, arabic: "الْبَاقِي", transcription: "Al-Baqi", russianTranscription: "Аль-Баки", translation: "Вечный", meaning: "Остающийся вечно" },
  { id: "name-97", number: 97, arabic: "الْوَارِثُ", transcription: "Al-Warith", russianTranscription: "Аль-Варис", translation: "Наследник", meaning: "Наследующий всё" },
  { id: "name-98", number: 98, arabic: "الرَّشِيدُ", transcription: "Ar-Rashid", russianTranscription: "Ар-Рашид", translation: "Направляющий", meaning: "Ведущий к цели" },
  { id: "name-99", number: 99, arabic: "الصَّبُورُ", transcription: "As-Sabur", russianTranscription: "Ас-Сабур", translation: "Терпеливый", meaning: "Не спешащий с наказанием" },
];

// Функция получения имени по номеру
export const getNameByNumber = (number: number): NameOfAllah | undefined => {
  return NAMES_OF_ALLAH.find(n => n.number === number);
};

// Группировка имён по категориям атрибутов
export const NAME_CATEGORIES = {
  majesty: [4, 5, 9, 10, 11, 16, 34, 37, 38, 42, 49, 78, 84, 85], // Величие
  mercy: [2, 3, 15, 17, 18, 35, 36, 43, 48, 79, 82, 83], // Милость
  power: [54, 55, 69, 70], // Сила
  knowledge: [20, 27, 28, 31, 32, 44, 51, 58], // Знание
  creation: [12, 13, 14, 59, 60, 61, 62, 95], // Творение
  guidance: [6, 19, 45, 56, 80, 94, 98], // Наставление
  justice: [29, 30, 81, 86], // Справедливость
  existence: [63, 64, 67, 68, 73, 74, 75, 76, 96, 97], // Бытие
};


// Компонент раздела Азкары с категориями

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LucideIcon } from "lucide-react";
import { Search, Moon, Sun, Sunrise, Sunset, Repeat, Heart, Utensils } from "lucide-react";
import { AdhkarCard } from "./AdhkarCard";

interface AdhkarCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  adhkar: Array<{
    id: string;
    title: string;
    icon: LucideIcon;
    color: string;
    text: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    count: number;
    category: string;
  }>;
}

export const AdhkarSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories: AdhkarCategory[] = [
    {
      id: "after-prayer",
      name: "После намаза",
      icon: Sun,
      color: "category-prayer",
      adhkar: [
        {
          id: "tasbih",
          title: "Тасбих",
          icon: Repeat,
          color: "primary",
          text: "سُبْحَانَ اللَّهِ",
          transcription: "Subhanallah",
          russianTranscription: "Субханаллах",
          translation: "Свят Аллах",
          count: 33,
          category: "После намаза",
        },
        {
          id: "tahmid",
          title: "Тахмид",
          icon: Sun,
          color: "accent",
          text: "الْحَمْدُ لِلَّهِ",
          transcription: "Alhamdulillah",
          russianTranscription: "Альхамдулиллах",
          translation: "Хвала Аллаху",
          count: 33,
          category: "После намаза",
        },
        {
          id: "takbir",
          title: "Такбир",
          icon: Moon,
          color: "category-prayer",
          text: "اللَّهُ أَكْبَرُ",
          transcription: "Allahu Akbar",
          russianTranscription: "Аллаху Акбар",
          translation: "Аллах Велик",
          count: 34,
          category: "После намаза",
        },
      ],
    },
    {
      id: "morning",
      name: "Утренние",
      icon: Sunrise,
      color: "category-morning",
      adhkar: [
        {
          id: "morning-la-ilaha",
          title: "Ля иляха",
          icon: Heart,
          color: "primary",
          text: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
          transcription: "La ilaha illallah",
          russianTranscription: "Ля иляха илляллах",
          translation: "Нет божества, кроме Аллаха",
          count: 100,
          category: "Утренние",
        },
        {
          id: "morning-astaghfir",
          title: "Истигфар утром",
          icon: Repeat,
          color: "accent",
          text: "أَسْتَغْفِرُ اللَّهَ",
          transcription: "Astaghfirullah",
          russianTranscription: "Астагфируллах",
          translation: "Прошу прощения у Аллаха",
          count: 100,
          category: "Утренние",
        },
      ],
    },
    {
      id: "evening",
      name: "Вечерние",
      icon: Sunset,
      color: "category-evening",
      adhkar: [
        {
          id: "evening-la-ilaha",
          title: "Ля иляха",
          icon: Heart,
          color: "primary",
          text: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
          transcription: "La ilaha illallah",
          russianTranscription: "Ля иляха илляллах",
          translation: "Нет божества, кроме Аллаха",
          count: 100,
          category: "Вечерние",
        },
      ],
    },
    {
      id: "before-sleep",
      name: "Перед сном",
      icon: Moon,
      color: "category-sleep",
      adhkar: [
        {
          id: "sleep-tahmid",
          title: "Тахмид перед сном",
          icon: Heart,
          color: "accent",
          text: "الْحَمْدُ لِلَّهِ",
          transcription: "Alhamdulillah",
          russianTranscription: "Альхамдулиллах",
          translation: "Хвала Аллаху",
          count: 33,
          category: "Перед сном",
        },
        {
          id: "sleep-takbir",
          title: "Такбир перед сном",
          icon: Repeat,
          color: "primary",
          text: "اللَّهُ أَكْبَرُ",
          transcription: "Allahu Akbar",
          russianTranscription: "Аллаху Акбар",
          translation: "Аллах Велик",
          count: 34,
          category: "Перед сном",
        },
      ],
    },
    {
      id: "general",
      name: "Общие",
      icon: Heart,
      color: "category-general",
      adhkar: [
        {
          id: "general-la-hawla",
          title: "Ля хауля",
          icon: Repeat,
          color: "primary",
          text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
          transcription: "La hawla wa la quwwata illa billah",
          russianTranscription: "Ля хауля ва ля куввата илля биллях",
          translation: "Нет силы и мощи ни у кого, кроме Аллаха",
          count: 100,
          category: "Общие",
        },
        {
          id: "general-subhanallah",
          title: "СубханАллах",
          icon: Heart,
          color: "accent",
          text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ",
          transcription: "Subhanallahi wa bihamdih, subhanallahil 'azim",
          russianTranscription: "Субханаллахи ва бихамдих, субханаллахиль 'азим",
          translation: "Свят Аллах и хвала Ему, Свят Великий Аллах",
          count: 100,
          category: "Общие",
        },
      ],
    },
  ];

  const filteredCategories = categories.map((category) => ({
    ...category,
    adhkar: category.adhkar.filter(
      (dhikr) =>
        dhikr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dhikr.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dhikr.transcription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dhikr.russianTranscription && dhikr.russianTranscription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        dhikr.translation.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.adhkar.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Search Bar */}
      <Card className="glass shadow-medium border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск по азкарам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {filteredCategories.length === 0 ? (
        <Card className="glass shadow-medium">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Ничего не найдено. Попробуйте другой запрос.
          </CardContent>
        </Card>
      ) : (
        filteredCategories.map((category) => (
          <div key={category.id} className="space-y-4">
            <Card className="glass shadow-medium border-border/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription>{category.adhkar.length} азкаров</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.adhkar.map((dhikr) => (
                <AdhkarCard key={dhikr.id} dhikr={dhikr} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Info Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-accent">Примечание:</strong> Рекомендуется произносить эти азкары в указанное время.
            Нажмите на карточку, чтобы начать счёт. После завершения счётчика появится сообщение о завершении.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

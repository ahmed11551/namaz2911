// История действий - стиль Fintrack
import { useState, useEffect, useMemo } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  Calendar,
  Clock,
  Filter,
  Search,
  ChevronDown,
  Target,
  BookOpen,
  Sparkles,
  Heart,
  Moon,
  Sun,
  Star,
  TrendingUp,
  Check,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spiritualPathAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import type { Goal } from "@/types/spiritual-path";
import { format, isToday, isYesterday, startOfDay, subDays } from "date-fns";
import { ru } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  type: "goal_progress" | "goal_created" | "goal_completed" | "qaza_prayer" | "streak" | "badge";
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  value?: number;
  timestamp: Date;
  category?: string;
}

// Генерация тестовой истории на основе целей
const generateHistory = (goals: Goal[], qazaCompleted: number): HistoryEntry[] => {
  const entries: HistoryEntry[] = [];
  const now = new Date();
  
  // Добавляем записи на основе целей
  goals.forEach((goal, index) => {
    // Создание цели
    if (goal.created_at) {
      entries.push({
        id: `created_${goal.id}`,
        type: "goal_created",
        title: "Новая цель",
        description: goal.title,
        icon: Target,
        color: "from-blue-500 to-cyan-500",
        timestamp: new Date(goal.created_at),
        category: goal.category,
      });
    }
    
    // Прогресс по цели
    if (goal.current_value > 0) {
      for (let i = 0; i < Math.min(goal.current_value, 5); i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        entries.push({
          id: `progress_${goal.id}_${i}`,
          type: "goal_progress",
          title: goal.title,
          description: `+1 к прогрессу`,
          icon: goal.category === "prayer" ? Moon : goal.category === "quran" ? BookOpen : Sparkles,
          color: goal.category === "prayer" ? "from-violet-500 to-purple-500" : 
                 goal.category === "quran" ? "from-emerald-500 to-teal-500" : 
                 "from-amber-500 to-orange-500",
          value: 1,
          timestamp: subDays(now, daysAgo),
          category: goal.category,
        });
      }
    }
    
    // Выполненные цели
    if (goal.status === "completed") {
      entries.push({
        id: `completed_${goal.id}`,
        type: "goal_completed",
        title: "Цель достигнута! 🎉",
        description: goal.title,
        icon: Check,
        color: "from-green-500 to-emerald-500",
        timestamp: goal.updated_at ? new Date(goal.updated_at) : now,
        category: goal.category,
      });
    }
  });
  
  // Добавляем каза намазы
  if (qazaCompleted > 0) {
    const prayers = ["Фаджр", "Зухр", "Аср", "Магриб", "Иша", "Витр"];
    for (let i = 0; i < Math.min(qazaCompleted, 10); i++) {
      entries.push({
        id: `qaza_${i}`,
        type: "qaza_prayer",
        title: "Каза намаз",
        description: `${prayers[i % prayers.length]} восполнен`,
        icon: Moon,
        color: "from-indigo-500 to-violet-500",
        value: 1,
        timestamp: subDays(now, Math.floor(i / 2)),
      });
    }
  }
  
  // Сортируем по дате (новые сверху)
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Группировка по дням
const groupByDate = (entries: HistoryEntry[]) => {
  const groups: { date: Date; label: string; entries: HistoryEntry[] }[] = [];
  
  entries.forEach(entry => {
    const dayStart = startOfDay(entry.timestamp);
    const existingGroup = groups.find(g => g.date.getTime() === dayStart.getTime());
    
    if (existingGroup) {
      existingGroup.entries.push(entry);
    } else {
      let label: string;
      if (isToday(entry.timestamp)) {
        label = "Сегодня";
      } else if (isYesterday(entry.timestamp)) {
        label = "Вчера";
      } else {
        label = format(entry.timestamp, "d MMMM", { locale: ru });
      }
      
      groups.push({
        date: dayStart,
        label,
        entries: [entry],
      });
    }
  });
  
  return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const History = () => {
  const { userData } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "goals" | "qaza">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const goalsData = await spiritualPathAPI.getGoals("all");
        setGoals(goalsData);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const qazaCompleted = userData?.repayment_progress?.completed_prayers
    ? Object.values(userData.repayment_progress.completed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;

  const history = useMemo(() => generateHistory(goals, qazaCompleted), [goals, qazaCompleted]);
  
  const filteredHistory = useMemo(() => {
    let filtered = history;
    
    if (filter === "goals") {
      filtered = filtered.filter(e => e.type.startsWith("goal"));
    } else if (filter === "qaza") {
      filtered = filtered.filter(e => e.type === "qaza_prayer");
    }
    
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [history, filter, searchQuery]);

  const groupedHistory = useMemo(() => groupByDate(filteredHistory), [filteredHistory]);

  // Статистика
  const todayCount = history.filter(e => isToday(e.timestamp)).length;
  const weekTotal = history.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">История</h1>
            <p className="text-sm text-muted-foreground">Ваши достижения и действия</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
              <span className="text-primary font-semibold text-sm">{todayCount} сегодня</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white slide-up stagger-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-white/70" />
              <span className="text-white/70 text-sm">За неделю</span>
            </div>
            <p className="text-3xl font-bold">{weekTotal}</p>
            <p className="text-white/70 text-xs">действий</p>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white slide-up stagger-2">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-white/70" />
              <span className="text-white/70 text-sm">Всего целей</span>
            </div>
            <p className="text-3xl font-bold">{goals.length}</p>
            <p className="text-white/70 text-xs">активных</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative slide-up stagger-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по истории..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <div className="flex gap-2 slide-up stagger-4">
            {[
              { id: "all", label: "Все" },
              { id: "goals", label: "Цели" },
              { id: "qaza", label: "Каза" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        {groupedHistory.length > 0 ? (
          <div className="space-y-6">
            {groupedHistory.map((group, groupIdx) => (
              <div key={group.date.getTime()} className="slide-up" style={{ animationDelay: `${0.4 + groupIdx * 0.1}s` }}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{group.label}</p>
                    <p className="text-xs text-muted-foreground">{group.entries.length} действий</p>
                  </div>
                </div>

                {/* Entries */}
                <div className="space-y-2 ml-5 border-l-2 border-border/30 pl-5">
                  {group.entries.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3 hover:border-primary/30 transition-colors"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        `bg-gradient-to-br ${entry.color}`
                      )}>
                        <entry.icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{entry.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        {entry.value && (
                          <p className={cn(
                            "text-sm font-semibold flex items-center gap-1",
                            entry.value > 0 ? "text-primary" : "text-destructive"
                          )}>
                            {entry.value > 0 ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(entry.value)}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {format(entry.timestamp, "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">История пуста</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Ничего не найдено" : "Начните выполнять цели и они появятся здесь"}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default History;


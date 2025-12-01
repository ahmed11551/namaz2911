// AI Чат-помощник - стиль Fintrack
import { useState, useRef, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Heart,
  Target,
  BookOpen,
  Flame,
  Moon,
  Sun,
  Clock,
  Zap,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// AI советы на основе данных пользователя
const generateAIResponse = (userMessage: string, goals: Goal[], stats: { streak: number; completed: number }) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Приветствие
  if (lowerMessage.includes("привет") || lowerMessage.includes("салам") || lowerMessage.includes("здравствуй")) {
    const greetings = [
      "Ас-саляму алейкум! 🌙 Рада видеть вас! Чем могу помочь сегодня?",
      "Ва алейкум ас-салям! ✨ Как ваш духовный путь? Готова помочь с любыми вопросами!",
      "Приветствую вас! 🕌 Ин ша Аллах, сегодня будет продуктивный день. Что хотите обсудить?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Мотивация
  if (lowerMessage.includes("мотив") || lowerMessage.includes("лень") || lowerMessage.includes("устал") || lowerMessage.includes("не хочу")) {
    const motivations = [
      `💪 Помните: "Поистине, с трудностью приходит облегчение" (Коран 94:6). Вы уже на правильном пути - ${stats.completed} действий позади!`,
      `🔥 У вас ${stats.streak} дней подряд! Не сдавайтесь сейчас. Каждый намаз - это инвестиция в ахират.`,
      "🌟 Пророк ﷺ сказал: «Самые любимые дела для Аллаха — постоянные, даже если они малы». Начните с малого!",
      "✨ Один ракаат лучше, чем ничего. Бисмиллях, начните прямо сейчас!",
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }
  
  // О целях
  if (lowerMessage.includes("цел") || lowerMessage.includes("прогресс") || lowerMessage.includes("как дела")) {
    if (goals.length === 0) {
      return "📋 У вас пока нет активных целей. Хотите, помогу создать первую? Рекомендую начать с ежедневного утреннего азкара!";
    }
    const activeGoals = goals.filter(g => g.status === "active");
    const completedToday = goals.filter(g => g.current_value > 0).length;
    return `📊 У вас ${activeGoals.length} активных целей. ${completedToday > 0 ? `Сегодня уже прогресс по ${completedToday} целям - ма ша Аллах! 🎉` : "Давайте начнём день с благословения!"}`;
  }
  
  // Намаз
  if (lowerMessage.includes("намаз") || lowerMessage.includes("молитв") || lowerMessage.includes("каза")) {
    return "🕌 Намаз - столп ислама и связь с Аллахом. Совет: выполняйте каза-намазы после каждого фард-намаза. Даже 1-2 каза в день - это 365-730 намазов в год!";
  }
  
  // Коран
  if (lowerMessage.includes("коран") || lowerMessage.includes("аят") || lowerMessage.includes("сур")) {
    return "📖 Чтение Корана - свет для сердца. Начните с 1 страницы в день. Пророк ﷺ сказал: «Читайте Коран, ибо он придёт заступником за своих читателей в День Суда»";
  }
  
  // Зикр
  if (lowerMessage.includes("зикр") || lowerMessage.includes("тасбих") || lowerMessage.includes("азкар")) {
    return "📿 33 раза СубханАллах, 33 раза Альхамдулиллях, 34 раза Аллаху Акбар после каждого намаза - и вы на пути к Раю! Используйте Тасбих в приложении 🌟";
  }
  
  // Дуа
  if (lowerMessage.includes("дуа") || lowerMessage.includes("молитв") || lowerMessage.includes("проси")) {
    return "🤲 Лучшее время для дуа: последняя треть ночи, между азаном и икаматом, в пятницу после 'Аср. Аллах любит, когда Его рабы просят!";
  }
  
  // Совет дня
  if (lowerMessage.includes("совет") || lowerMessage.includes("что делать") || lowerMessage.includes("подскаж")) {
    const tips = [
      "💡 Совет дня: Начните день с утренних азкаров. Это защита на весь день!",
      "💡 Совет дня: Сделайте истигфар 100 раз - это открывает двери ризка",
      "💡 Совет дня: Прочитайте суру Аль-Мульк перед сном - защита от мучений могилы",
      "💡 Совет дня: Салават пророку ﷺ 10 раз = 10 благословений от Аллаха!",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  // Время молитвы
  const hour = new Date().getHours();
  if (lowerMessage.includes("время") || lowerMessage.includes("сейчас") || lowerMessage.includes("какой намаз")) {
    if (hour >= 4 && hour < 6) return "🌅 Сейчас время Фаджра. Благословенное время! Не пропустите утренний намаз.";
    if (hour >= 12 && hour < 15) return "☀️ Сейчас время Зухра. Полуденный намаз даёт силы на весь день!";
    if (hour >= 15 && hour < 18) return "🌤 Сейчас время 'Асра. Пророк ﷺ особо предупреждал о важности этого намаза.";
    if (hour >= 18 && hour < 20) return "🌇 Сейчас время Магриба. Разговейтесь и совершите намаз!";
    if (hour >= 20 || hour < 4) return "🌙 Сейчас время 'Иша. Завершите день намазом и витром!";
  }
  
  // Дефолтный ответ
  const defaults = [
    "🤔 Интересный вопрос! Могу помочь с целями, намазом, зикром или дать совет. Что вас интересует?",
    "✨ Я здесь, чтобы помочь на вашем духовном пути. Спросите о целях, намазе, Коране или попросите мотивацию!",
    "🌙 Аллах любит, когда Его рабы стремятся к знаниям. Чем могу помочь?",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
};

// Быстрые ответы
const QUICK_REPLIES = [
  { icon: Sparkles, text: "Дай совет", color: "from-purple-500 to-pink-500" },
  { icon: Target, text: "Мой прогресс", color: "from-blue-500 to-cyan-500" },
  { icon: Heart, text: "Мотивация", color: "from-red-500 to-orange-500" },
  { icon: BookOpen, text: "О Коране", color: "from-emerald-500 to-teal-500" },
];

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ас-саляму алейкум! 🌙 Я ваш AI-помощник на духовном пути. Могу помочь с мотивацией, советами по намазу, зикру и достижению целей. Спрашивайте что угодно!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState({ streak: 0, completed: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Загружаем данные для контекста AI
    const loadData = async () => {
      try {
        const goalsData = await spiritualPathAPI.getGoals("all");
        setGoals(goalsData);
        
        const streaks = await spiritualPathAPI.getStreaks();
        const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
        const completed = goalsData.reduce((sum, g) => sum + g.current_value, 0);
        setStats({ streak: currentStreak, completed });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Имитация задержки AI
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const aiResponse = generateAIResponse(input.trim(), goals, stats);
    
    const assistantMessage: Message = {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
    setTimeout(() => handleSend(), 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainHeader />

      {/* Chat Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-4 py-4">
        <div className="container mx-auto max-w-lg flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center breathing-glow">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white flex items-center gap-2">
              AI Помощник
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px]">BETA</span>
            </h2>
            <p className="text-white/70 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Онлайн • Готов помочь
            </p>
          </div>
          <div className="flex gap-1">
            {[Moon, Zap, MessageCircle].map((Icon, i) => (
              <button key={i} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon className="w-5 h-5 text-white/70" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-40">
        <div className="container mx-auto max-w-lg space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 slide-up",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Avatar */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                message.role === "assistant" 
                  ? "bg-gradient-to-br from-violet-500 to-purple-600" 
                  : "bg-gradient-to-br from-primary to-primary-dark"
              )}>
                {message.role === "assistant" ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.role === "assistant"
                  ? "bg-card border border-border/50 rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                <p className={cn(
                  "text-sm leading-relaxed",
                  message.role === "assistant" ? "text-foreground" : "text-primary-foreground"
                )}>
                  {message.content}
                </p>
                <p className={cn(
                  "text-[10px] mt-1",
                  message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70"
                )}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 slide-up">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      <div className="fixed bottom-36 left-0 right-0 px-4">
        <div className="container mx-auto max-w-lg">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(reply.text)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap",
                  "bg-gradient-to-r text-white text-sm font-medium",
                  "hover:scale-105 active:scale-95 transition-transform",
                  "shadow-lg",
                  reply.color
                )}
              >
                <reply.icon className="w-4 h-4" />
                {reply.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 px-4 py-3">
        <div className="container mx-auto max-w-lg">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Напишите сообщение..."
              className="flex-1 h-12 px-4 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
                "hover:shadow-lg hover:scale-105 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AIChat;


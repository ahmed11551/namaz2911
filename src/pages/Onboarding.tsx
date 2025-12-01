// Onboarding экраны - стиль Fintrack
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Target,
  BookOpen,
  Moon,
  Heart,
  Check,
  Flame,
  Star,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  illustration: string;
  decorations: React.ReactNode;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: "Ас-саляму алейкум!",
    subtitle: "Добро пожаловать",
    description: "Ваш персональный помощник на пути к духовному совершенству. Трекер намазов, целей и благих дел.",
    icon: Sparkles,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    illustration: "🕌",
    decorations: (
      <>
        <div className="absolute top-20 right-10 w-20 h-20 bg-white/10 rounded-full animate-float" />
        <div className="absolute bottom-40 left-5 w-12 h-12 bg-white/10 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-40 left-10 text-4xl animate-float" style={{ animationDelay: "0.5s" }}>✨</div>
      </>
    ),
  },
  {
    id: 2,
    title: "Восполняйте намазы",
    subtitle: "Каза-трекер",
    description: "Рассчитайте пропущенные намазы и отслеживайте прогресс восполнения. Не откладывайте на завтра!",
    icon: Moon,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    illustration: "🌙",
    decorations: (
      <>
        <div className="absolute top-32 right-8 text-3xl animate-pulse">⭐</div>
        <div className="absolute bottom-48 left-8 text-2xl animate-pulse" style={{ animationDelay: "0.3s" }}>🌟</div>
        <div className="absolute top-48 left-16 text-xl animate-pulse" style={{ animationDelay: "0.6s" }}>✨</div>
      </>
    ),
  },
  {
    id: 3,
    title: "Ставьте цели",
    subtitle: "Духовный рост",
    description: "Чтение Корана, зикр, садака — создавайте цели и превращайте благие дела в привычку.",
    icon: Target,
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    illustration: "🎯",
    decorations: (
      <>
        <div className="absolute top-24 right-12 w-16 h-16 border-4 border-white/20 rounded-full animate-spin-slow" />
        <div className="absolute bottom-44 left-12 w-8 h-8 bg-white/10 rounded-lg rotate-45 animate-bounce" />
      </>
    ),
  },
  {
    id: 4,
    title: "Читайте зикры",
    subtitle: "Поминание Аллаха",
    description: "Коллекция дуа, азкаров и салаватов. Тасбих-счётчик поможет вести подсчёт.",
    icon: BookOpen,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    illustration: "📿",
    decorations: (
      <>
        <div className="absolute top-28 left-8 text-2xl animate-float">🤲</div>
        <div className="absolute bottom-52 right-12 text-3xl animate-float" style={{ animationDelay: "0.7s" }}>💫</div>
      </>
    ),
  },
  {
    id: 5,
    title: "Получайте награды",
    subtitle: "Геймификация",
    description: "Зарабатывайте бейджи, поддерживайте серии и следите за своим прогрессом с AI-помощником.",
    icon: Trophy,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    illustration: "🏆",
    decorations: (
      <>
        <div className="absolute top-20 right-16 text-2xl animate-bounce">🎉</div>
        <div className="absolute bottom-48 left-10 text-xl animate-bounce" style={{ animationDelay: "0.2s" }}>🌟</div>
        <div className="absolute top-44 left-20 text-xl animate-bounce" style={{ animationDelay: "0.4s" }}>🔥</div>
      </>
    ),
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    
    if (currentSlide === SLIDES.length - 1) {
      // Сохраняем что onboarding пройден
      localStorage.setItem("onboarding_completed", "true");
      navigate("/");
      return;
    }
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isAnimating || currentSlide === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/");
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-all duration-500",
      `bg-gradient-to-br ${slide.gradient}`
    )}>
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          Пропустить
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative Elements */}
        {slide.decorations}

        {/* Illustration */}
        <div className={cn(
          "text-[120px] mb-8 transition-all duration-500",
          isAnimating ? "opacity-0 scale-75" : "opacity-100 scale-100"
        )}>
          {slide.illustration}
        </div>

        {/* Icon Badge */}
        <div className={cn(
          "w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6 transition-all duration-500",
          isAnimating ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
        )}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Text Content */}
        <div className={cn(
          "text-center transition-all duration-500",
          isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}>
          <p className="text-white/70 text-sm mb-2">{slide.subtitle}</p>
          <h1 className="text-3xl font-bold text-white mb-4">{slide.title}</h1>
          <p className="text-white/80 text-base max-w-xs mx-auto leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 sm:p-6 lg:p-8 pb-8 sm:pb-12">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => !isAnimating && setCurrentSlide(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === currentSlide 
                  ? "w-8 bg-white" 
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <button
            onClick={handleNext}
            className={cn(
              "flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg",
              "flex items-center justify-center gap-2",
              "hover:bg-primary/90 active:scale-[0.98] transition-all",
              "shadow-lg shadow-black/20"
            )}
          >
            {currentSlide === SLIDES.length - 1 ? (
              <>
                Начать
                <Sparkles className="w-5 h-5" />
              </>
            ) : (
              <>
                Далее
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add floating animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;


// Декоративные плавающие элементы в стиле Fintrack
import { cn } from "@/lib/utils";

interface FloatingDecorationsProps {
  variant?: "default" | "minimal" | "vibrant";
  className?: string;
}

export const FloatingDecorations = ({ 
  variant = "default",
  className 
}: FloatingDecorationsProps) => {
  if (variant === "minimal") {
    return (
      <div className={cn("pointer-events-none fixed inset-0 overflow-hidden z-0", className)}>
        <div className="deco-circle deco-circle-1" />
      </div>
    );
  }

  if (variant === "vibrant") {
    return (
      <div className={cn("pointer-events-none fixed inset-0 overflow-hidden z-0", className)}>
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/10 blur-3xl floating-element" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-violet-500/15 to-purple-500/10 blur-3xl floating-element" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/10 blur-3xl floating-element" style={{ animationDelay: "4s" }} />
        
        {/* Floating icons */}
        <div className="absolute top-20 right-20 text-2xl floating-element opacity-30" style={{ animationDelay: "1s" }}>🕌</div>
        <div className="absolute top-40 left-10 text-xl floating-element opacity-20" style={{ animationDelay: "2s" }}>✨</div>
        <div className="absolute bottom-40 right-30 text-xl floating-element opacity-20" style={{ animationDelay: "3s" }}>🌙</div>
        <div className="absolute bottom-60 left-20 text-lg floating-element opacity-15" style={{ animationDelay: "4s" }}>⭐</div>
      </div>
    );
  }

  return (
    <div className={cn("pointer-events-none fixed inset-0 overflow-hidden z-0", className)}>
      {/* Decorative circles */}
      <div className="deco-circle deco-circle-1" />
      <div className="deco-circle deco-circle-2" />
      <div className="deco-circle deco-circle-3" />
      
      {/* Subtle floating particles */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-primary/30 floating-element" />
      <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-violet-500/30 floating-element" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-1/3 right-1/3 w-2 h-2 rounded-full bg-amber-500/30 floating-element" style={{ animationDelay: "3s" }} />
    </div>
  );
};

// Карточка с 3D эффектом
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "green" | "purple" | "orange" | "blue";
}

export const Card3D = ({ children, className, glowColor = "green" }: Card3DProps) => {
  const glowClasses = {
    green: "hover:shadow-[0_20px_50px_rgba(34,197,94,0.15)]",
    purple: "hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)]",
    orange: "hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)]",
    blue: "hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)]",
  };

  return (
    <div className={cn(
      "relative transition-all duration-300 ease-out",
      "hover:translate-y-[-4px] hover:scale-[1.02]",
      glowClasses[glowColor],
      className
    )}>
      {children}
    </div>
  );
};

// 3D Иконка
interface Icon3DProps {
  children: React.ReactNode;
  gradient?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Icon3D = ({ 
  children, 
  gradient = "from-primary to-primary-dark",
  size = "md",
  className 
}: Icon3DProps) => {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-xl",
    md: "w-14 h-14 rounded-2xl",
    lg: "w-20 h-20 rounded-3xl",
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center",
      `bg-gradient-to-br ${gradient}`,
      "shadow-lg transform-gpu",
      "before:absolute before:inset-0 before:rounded-inherit before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-50",
      "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-3/4 after:h-4 after:bg-black/20 after:blur-xl after:rounded-full",
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

// Анимированный фон
export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      
      {/* Animated gradient blobs */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div 
          className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] morph-shape"
          style={{ top: "-10%", left: "-10%" }}
        />
        <div 
          className="absolute w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] morph-shape"
          style={{ top: "30%", right: "-10%", animationDelay: "-4s" }}
        />
        <div 
          className="absolute w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] morph-shape"
          style={{ bottom: "10%", left: "20%", animationDelay: "-2s" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px"
        }}
      />
    </div>
  );
};

// Illustration placeholder
interface IllustrationProps {
  type: "mosque" | "quran" | "prayer" | "star" | "moon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Illustration = ({ type, size = "md", className }: IllustrationProps) => {
  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl",
  };

  const illustrations = {
    mosque: "🕌",
    quran: "📖",
    prayer: "🤲",
    star: "⭐",
    moon: "🌙",
  };

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      <span className="subtle-float">{illustrations[type]}</span>
      {/* Glow effect behind */}
      <div className="absolute inset-0 blur-2xl opacity-30 bg-primary rounded-full scale-150" />
    </div>
  );
};


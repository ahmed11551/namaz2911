import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plane, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserData } from "@/hooks/useUserData";

export const TravelPrayersSection = () => {
  const { userData, loading } = useUserData();

  // Если данных нет, показываем сообщение
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Для отображения сафар-намазов необходимо сначала рассчитать долг намазов
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const travelPrayersData = userData.debt_calculation?.travel_prayers || {
    dhuhr_safar: 0,
    asr_safar: 0,
    isha_safar: 0,
  };
  // В реальном приложении здесь будет отдельный трекинг для сафар-намазов
  // Для демо используем 0 как начальное значение
  const travelPrayers = [
    { name: "Зухр (сафар)", completed: 0, total: travelPrayersData.dhuhr_safar, emoji: "☀️" },
    { name: "Аср (сафар)", completed: 0, total: travelPrayersData.asr_safar, emoji: "🌤️" },
    { name: "Иша (сафар)", completed: 0, total: travelPrayersData.isha_safar, emoji: "🌙" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Info Alert */}
      <Alert className="border-accent/30 bg-accent/5">
        <Info className="h-4 w-4 text-accent" />
        <AlertDescription>
          В дни путешествия (сафар) четырёхракаатные намазы (Зухр, Аср, Иша) сокращаются до двух
          ракаатов. Фаджр, Магриб и Витр не сокращаются.
        </AlertDescription>
      </Alert>

      {/* Travel Prayers Header */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            <CardTitle>Намазы в путешествии</CardTitle>
          </div>
          <CardDescription>
            Отслеживайте восполнение сокращённых намазов из периодов сафара
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Travel Prayer Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {travelPrayers.map((prayer) => {
          const percentage = Math.round((prayer.completed / prayer.total) * 100);
          return (
            <Card
              key={prayer.name}
              className="bg-gradient-card hover:shadow-medium transition-shadow duration-300 border-border/50"
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{prayer.emoji}</span>
                    <h3 className="font-semibold text-foreground">{prayer.name}</h3>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-bold gradient-text">
                        {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Восполнено: {prayer.completed}</span>
                    <span>Всего: {prayer.total}</span>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Осталось: {prayer.total - prayer.completed} намазов
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-primary text-primary-foreground shadow-glow">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-sm opacity-90">Общий прогресс сафар-намазов</div>
            <div className="text-4xl font-bold">
              {Math.round(
                (travelPrayers.reduce((sum, p) => sum + p.completed, 0) /
                  travelPrayers.reduce((sum, p) => sum + p.total, 0)) *
                  100
              )}
              %
            </div>
            <div className="text-sm opacity-90">
              {travelPrayers.reduce((sum, p) => sum + p.completed, 0)} из{" "}
              {travelPrayers.reduce((sum, p) => sum + p.total, 0)} намазов восполнено
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground">О сокращении намазов в путешествии:</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li>Зухр сокращается с 4 до 2 ракаатов</li>
              <li>Аср сокращается с 4 до 2 ракаатов</li>
              <li>Иша сокращается с 4 до 2 ракаатов</li>
              <li>Фаджр (2 ракаата) не сокращается</li>
              <li>Магриб (3 ракаата) не сокращается</li>
              <li>Витр не сокращается</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

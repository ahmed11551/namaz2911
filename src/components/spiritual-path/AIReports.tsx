// Компонент для AI-отчетов
// Разные уровни для разных тарифов

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  BarChart3,
  Lightbulb,
  Zap,
  Crown,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { AIReport, AIInsight, AIPrediction } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

// Получить тариф пользователя из localStorage
const getUserTier = (): "muslim" | "mutahsin" | "sahib_al_waqf" => {
  const storedTier = localStorage.getItem("user_tier");
  if (storedTier === "muslim" || storedTier === "mutahsin" || storedTier === "sahib_al_waqf") {
    return storedTier;
  }
  // По умолчанию - базовый тариф
  return "muslim";
};

export const AIReports = () => {
  const { toast } = useToast();
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "custom">("weekly");
  const userTier = getUserTier();

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await spiritualPathAPI.getAIReport(reportType);
      setReport(data);
    } catch (error) {
      console.error("Error loading AI report:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отчет",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "achievement":
        return <Target className="w-5 h-5 text-green-500" />;
      case "trend":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "motivation":
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      default:
        return <Brain className="w-5 h-5 text-primary" />;
    }
  };

  const getInsightColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "achievement":
        return "bg-green-50 border-green-200";
      case "trend":
        return "bg-blue-50 border-blue-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "motivation":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-background border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка отчета...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI-отчеты
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Персонализированная аналитика вашего духовного пути
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {userTier === "muslim" && (
              <>
                <Star className="w-3 h-3" />
                Муслим
              </>
            )}
            {userTier === "mutahsin" && (
              <>
                <Zap className="w-3 h-3" />
                Мутахсин
              </>
            )}
            {userTier === "sahib_al_waqf" && (
              <>
                <Crown className="w-3 h-3" />
                Сахиб аль-Вакф
              </>
            )}
          </Badge>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={(value) => setReportType(value as typeof reportType)}>
        <TabsList>
          <TabsTrigger value="weekly">Неделя</TabsTrigger>
          <TabsTrigger value="monthly">Месяц</TabsTrigger>
          <TabsTrigger value="custom">Произвольный</TabsTrigger>
        </TabsList>

        <TabsContent value={reportType} className="space-y-4">
          {report ? (
            <>
              {/* Основные метрики */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Основные метрики
                  </CardTitle>
                  <CardDescription>
                    Период: {format(new Date(report.period_start), "dd.MM.yyyy", { locale: ru })} -{" "}
                    {format(new Date(report.period_end), "dd.MM.yyyy", { locale: ru })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {report.insights.slice(0, 3).map((insight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          getInsightColor(insight.type)
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getInsightIcon(insight.type)}
                          <span className="text-sm font-semibold">{insight.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.value !== undefined && (
                          <p className="text-lg font-bold mt-2">{insight.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Инсайты */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Инсайты
                  </CardTitle>
                  <CardDescription>
                    {userTier === "muslim" && "1 общий инсайт (бесплатно)"}
                    {userTier === "mutahsin" && "Расширенная аналитика"}
                    {userTier === "sahib_al_waqf" && "Глубинные инсайты с взаимосвязями"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.insights.map((insight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border flex items-start gap-3",
                          getInsightColor(insight.type)
                        )}
                      >
                        <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          {insight.metric && (
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {insight.metric}
                              </Badge>
                              {insight.value !== undefined && (
                                <span className="text-sm font-semibold">{insight.value}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Рекомендации (для PRO и Premium) */}
              {(userTier === "mutahsin" || userTier === "sahib_al_waqf") && report.recommendations && (
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Персонализированные рекомендации
                    </CardTitle>
                    <CardDescription>
                      {userTier === "mutahsin" && "3 рекомендации (PRO)"}
                      {userTier === "sahib_al_waqf" && "Расширенные рекомендации (Premium)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border bg-primary/5 border-primary/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="flex-1 text-sm">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Прогнозы (только для Premium) */}
              {userTier === "sahib_al_waqf" && report.predictions && report.predictions.length > 0 && (
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Прогнозная аналитика
                    </CardTitle>
                    <CardDescription>
                      Глубинные инсайты с выявлением взаимосвязей (Premium)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.predictions.map((prediction, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{prediction.metric}</h4>
                            <Badge variant="outline" className="text-xs">
                              Уверенность: {prediction.confidence}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Прогноз: <span className="font-semibold">{prediction.predicted_value}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Период: {prediction.timeframe}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Информация о тарифе для бесплатных пользователей */}
              {userTier === "muslim" && (
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Обновите тариф для большего
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      С тарифом "Мутахсин" вы получите расширенную аналитику и 3 персонализированные рекомендации.
                      С тарифом "Сахиб аль-Вакф" - прогнозную аналитику и глубинные инсайты.
                    </p>
                    <Button variant="outline" onClick={() => {
                      toast({
                        title: "Обновление тарифа",
                        description: "Перейдите в настройки для обновления тарифа",
                      });
                    }}>
                      Обновить тариф
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">
                    Отчет не найден
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Попробуйте загрузить отчет снова
                  </p>
                  <Button onClick={loadReport} className="mt-4">
                    Загрузить отчет
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};


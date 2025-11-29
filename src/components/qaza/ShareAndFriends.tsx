// Компонент для поделиться и доступа друзьям (соревновательный эффект)

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Users, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUserData } from "@/hooks/useUserData";
import { calculateAchievements, calculateProgressStats, type Achievement } from "@/lib/prayer-utils";

interface Friend {
  id: string;
  name: string;
  progress: number;
  avatar?: string;
}

export const ShareAndFriends = () => {
  const { toast } = useToast();
  const { userData, loading: userDataLoading } = useUserData();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [friendCode, setFriendCode] = useState("");

  // Рассчитываем достижения на основе реальных данных
  const achievements = useMemo(() => calculateAchievements(userData), [userData]);

  // Рассчитываем реальный прогресс
  const stats = useMemo(() => calculateProgressStats(userData), [userData]);
  const overallProgress = stats.overallProgress;

  // Mock данные друзей (в будущем можно интегрировать с API)
  const friends: Friend[] = [
    { id: "1", name: "Ахмад", progress: 75 },
    { id: "2", name: "Марьям", progress: 68 },
    { id: "3", name: "Юсуф", progress: 82 },
  ];

  const handleShare = async (achievementId?: string) => {
    try {
      const achievement = achievementId ? achievements.find((a) => a.id === achievementId) : null;
      const shareText = achievement
        ? `${achievement.description}. Прогресс: ${overallProgress}%`
        : `Мой прогресс в восполнении намазов: ${overallProgress}%. Восполнено ${stats.totalCompleted} из ${stats.totalMissed} намазов.`;

      const shareData: ShareData = {
        title: achievement
          ? `Я получил достижение "${achievement.title}"!`
          : "Мой прогресс в восполнении намазов",
        text: shareText,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Успешно поделились",
          description: "Ваш прогресс был отправлен",
        });
      } else {
        // Fallback: копирование в буфер обмена
        try {
          await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
          toast({
            title: "Ссылка скопирована",
            description: "Информация о вашем прогрессе скопирована в буфер обмена",
          });
        } catch (clipboardError) {
          toast({
            title: "Ошибка",
            description: "Не удалось скопировать в буфер обмена",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      // Пользователь отменил шаринг - это нормально, не показываем ошибку
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось поделиться",
          variant: "destructive",
        });
      }
    }
    setShareDialogOpen(false);
  };

  const handleAddFriend = () => {
    if (!friendCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код друга",
        variant: "destructive",
      });
      return;
    }

    // В реальном приложении здесь будет запрос к API
    toast({
      title: "Друг добавлен",
      description: "Теперь вы можете видеть прогресс друг друга",
    });
    setFriendCode("");
    setFriendsDialogOpen(false);
  };

  // Показываем загрузку, если данные еще не загружены
  if (userDataLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Загрузка данных...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievements Card */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle>Достижения</CardTitle>
            </div>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Поделиться
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Поделиться достижениями</DialogTitle>
                  <DialogDescription>
                    Выберите достижение для публикации или поделитесь общим прогрессом
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <Button
                    onClick={() => handleShare()}
                    className="w-full"
                    variant="outline"
                  >
                    Поделиться общим прогрессом
                  </Button>
                  {achievements
                    .filter((a) => a.unlocked)
                    .map((achievement) => (
                      <Button
                        key={achievement.id}
                        onClick={() => handleShare(achievement.id)}
                        className="w-full"
                        variant="outline"
                      >
                        <span className="mr-2">{achievement.icon}</span>
                        {achievement.title}
                      </Button>
                    ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Ваши достижения в восполнении намазов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`text-center p-4 rounded-lg border transition-all ${
                  achievement.unlocked
                    ? "bg-primary/10 border-primary/50 shadow-glow"
                    : "bg-card opacity-50 border-border"
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-sm font-semibold">{achievement.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {achievement.description}
                </div>
                {achievement.unlocked && achievement.unlockedDate && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {achievement.unlockedDate.toLocaleDateString("ru-RU")}
                  </Badge>
                )}
                {!achievement.unlocked && achievement.progress !== undefined && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.progress}%</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Friends Leaderboard */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Друзья</CardTitle>
            </div>
            <Dialog open={friendsDialogOpen} onOpenChange={setFriendsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Добавить друга
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить друга</DialogTitle>
                  <DialogDescription>
                    Введите код друга, чтобы видеть его прогресс и соревноваться
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="friendCode">Код друга</Label>
                    <Input
                      id="friendCode"
                      placeholder="Введите код друга"
                      value={friendCode}
                      onChange={(e) => setFriendCode(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setFriendsDialogOpen(false)}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                    <Button onClick={handleAddFriend} className="flex-1 bg-primary">
                      Добавить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Соревнуйтесь с друзьями в восполнении намазов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Your Progress */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  Вы
                </div>
                <div>
                  <div className="font-semibold">Ваш прогресс</div>
                  <div className="text-sm text-muted-foreground">{overallProgress}% выполнено</div>
                </div>
              </div>
              <Badge variant="default" className="bg-primary">
                {overallProgress}%
              </Badge>
            </div>

            {/* Friends List */}
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {friend.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{friend.name}</div>
                    <div className="text-sm text-muted-foreground">{friend.progress}% выполнено</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {friend.progress > overallProgress ? (
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  ) : null}
                  <Badge variant="outline">{friend.progress}%</Badge>
                </div>
              </div>
            ))}

            {friends.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Добавьте друзей, чтобы соревноваться
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


// Компонент для групповых целей (Совместные челленджи)
// Доступно только для тарифа "Сахиб аль-Вакф"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Copy,
  Check,
  Trophy,
  Crown,
  ExternalLink,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { GoalGroup, GoalGroupMember, Goal } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

// TODO: Получить тариф пользователя из API или контекста
// Пока используем заглушку
const getUserTier = (): "muslim" | "mutahsin" | "sahib_al_waqf" => {
  // В реальном приложении это должно приходить из API
  return "sahib_al_waqf"; // Для тестирования
};

interface GroupGoalsProps {
  goals?: Goal[];
  onRefresh?: () => void;
}

export const GroupGoals = ({ goals = [], onRefresh }: GroupGoalsProps) => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GoalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GoalGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GoalGroupMember[]>([]);
  const [groupGoal, setGroupGoal] = useState<Goal | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const userTier = getUserTier();
  const isPremium = userTier === "sahib_al_waqf";

  useEffect(() => {
    if (isPremium) {
      loadGroups();
    }
  }, [isPremium]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await spiritualPathAPI.getGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить группы",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (name: string, goalId: string) => {
    try {
      const newGroup = await spiritualPathAPI.createGroup(name, goalId);
      toast({
        title: "Группа создана",
        description: "Теперь вы можете пригласить участников",
      });
      setCreateDialogOpen(false);
      loadGroups();
      onRefresh?.();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать группу",
        variant: "destructive",
      });
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код приглашения",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await spiritualPathAPI.joinGroup(inviteCode.trim());
      toast({
        title: "Успешно",
        description: `Вы присоединились к группе "${result.group.name}"`,
      });
      setJoinDialogOpen(false);
      setInviteCode("");
      loadGroups();
      onRefresh?.();
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось присоединиться к группе. Проверьте код приглашения.",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteCode = (code: string) => {
    const inviteUrl = `${window.location.origin}/spiritual-path/group/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    toast({
      title: "Ссылка скопирована",
      description: "Отправьте ссылку участникам",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const loadGroupDetails = async (group: GoalGroup) => {
    setSelectedGroup(group);
    // TODO: Загрузить участников и цель группы через API
    // Пока используем заглушку
    const goal = goals.find((g) => g.id === group.goal_id);
    setGroupGoal(goal || null);
  };

  if (!isPremium) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Групповые цели
          </CardTitle>
          <CardDescription>
            Совместные челленджи доступны только для тарифа "Сахиб аль-Вакф"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500/50" />
            <p className="text-lg font-semibold mb-2">Премиум функция</p>
            <p className="text-muted-foreground mb-4">
              Групповые цели позволяют создавать совместные челленджи с друзьями
            </p>
            <Button variant="outline" onClick={() => {
              toast({
                title: "Обновление тарифа",
                description: "Перейдите в настройки для обновления тарифа",
              });
            }}>
              Обновить тариф
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка групп...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Групповые цели
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Создавайте совместные челленджи с друзьями
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать группу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать групповую цель</DialogTitle>
                <DialogDescription>
                  Выберите существующую цель или создайте новую для совместного челленджа
                </DialogDescription>
              </DialogHeader>
              <CreateGroupForm
                goals={goals}
                onSubmit={(name, goalId) => {
                  handleCreateGroup(name, goalId);
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Присоединиться
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Присоединиться к группе</DialogTitle>
                <DialogDescription>
                  Введите код приглашения или ссылку
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-code">Код приглашения</Label>
                  <Input
                    id="invite-code"
                    placeholder="GRP-XXXXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleJoinGroup} className="flex-1">
                    Присоединиться
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setJoinDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                У вас пока нет групповых целей
              </p>
              <p className="text-sm text-muted-foreground">
                Создайте группу или присоединитесь к существующей
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => {
            const goal = goals.find((g) => g.id === group.goal_id);
            const progressPercent = goal
              ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
              : 0;

            return (
              <Card
                key={group.id}
                className="bg-gradient-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => loadGroupDetails(group)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        {goal?.title || "Цель не найдена"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      <Users className="w-3 h-3 mr-1" />
                      Группа
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Прогресс</span>
                          <span className="font-semibold">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {goal.current_value} из {goal.target_value}
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(group.created_at), "dd.MM.yyyy", { locale: ru })}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyInviteCode(group.invite_code);
                      }}
                    >
                      {copiedCode === group.invite_code ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Копировать ссылку
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Диалог деталей группы */}
      {selectedGroup && (
        <AlertDialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedGroup.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Детали групповой цели и участники
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              {groupGoal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{groupGoal.title}</CardTitle>
                    <CardDescription>{groupGoal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Общий прогресс</span>
                          <span className="font-semibold">
                            {Math.min(100, Math.round((groupGoal.current_value / groupGoal.target_value) * 100))}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, Math.round((groupGoal.current_value / groupGoal.target_value) * 100))}
                          className="h-3"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Выполнено:</span>
                          <span className="font-semibold ml-2">
                            {groupGoal.current_value} из {groupGoal.target_value}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Создано:</span>
                          <span className="font-semibold ml-2">
                            {format(new Date(selectedGroup.created_at), "dd.MM.yyyy", { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Таблица лидеров
                </h3>
                <div className="space-y-2">
                  {groupMembers.length > 0 ? (
                    groupMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          index === 0 && "bg-yellow-50 border-yellow-200",
                          index === 1 && "bg-gray-50 border-gray-200",
                          index === 2 && "bg-amber-50 border-amber-200",
                          index > 2 && "bg-background border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                              index === 0 && "bg-yellow-500 text-white",
                              index === 1 && "bg-gray-400 text-white",
                              index === 2 && "bg-amber-600 text-white",
                              index > 2 && "bg-muted text-muted-foreground"
                            )}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">
                              Участник #{member.user_id.slice(-4)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Вклад: {member.progress_contribution}
                            </p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Trophy
                            className={cn(
                              "w-5 h-5",
                              index === 0 && "text-yellow-500",
                              index === 1 && "text-gray-400",
                              index === 2 && "text-amber-600"
                            )}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Участники загружаются...
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Код приглашения</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {selectedGroup.invite_code}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyInviteCode(selectedGroup.invite_code)}
                  >
                    {copiedCode === selectedGroup.invite_code ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Копировать
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Закрыть</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

// Компонент формы создания группы
interface CreateGroupFormProps {
  goals: Goal[];
  onSubmit: (name: string, goalId: string) => void;
  onCancel: () => void;
}

const CreateGroupForm = ({ goals, onSubmit, onCancel }: CreateGroupFormProps) => {
  const [name, setName] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  const activeGoals = goals.filter((g) => g.status === "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGoalId) {
      return;
    }
    onSubmit(name.trim(), selectedGoalId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="group-name">Название группы</Label>
        <Input
          id="group-name"
          placeholder="Например: Челлендж 100 000 салаватов"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2"
          required
        />
      </div>
      <div>
        <Label htmlFor="goal-select">Выберите цель</Label>
        <select
          id="goal-select"
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          <option value="">-- Выберите цель --</option>
          {activeGoals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title} ({goal.current_value} / {goal.target_value})
            </option>
          ))}
        </select>
        {activeGoals.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Сначала создайте активную цель
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={!name.trim() || !selectedGoalId}>
          Создать группу
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
};


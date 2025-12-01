// Типы для системы друзей (соревновательный эффект)

export interface Friend {
  id: string;
  user_id: string;
  friend_user_id: string;
  friend_name?: string;
  friend_avatar?: string;
  friend_progress?: FriendProgress;
  created_at: Date;
  updated_at: Date;
}

export interface FriendProgress {
  overall_progress: number;
  total_completed: number;
  total_missed: number;
  daily_pace: number;
  current_streak: number;
  achievements_count: number;
  last_updated: Date;
}

export interface FriendCode {
  code: string;
  user_id: string;
  expires_at?: Date;
  created_at: Date;
}

export interface AddFriendRequest {
  friend_code: string;
}

export interface AddFriendResponse {
  success: boolean;
  friend?: Friend;
  error?: string;
}

export interface FriendsListResponse {
  friends: Friend[];
  total: number;
}

export interface FriendComparison {
  your_progress: FriendProgress;
  friend_progress: FriendProgress;
  difference: {
    progress_diff: number;
    completed_diff: number;
    pace_diff: number;
    streak_diff: number;
  };
}


import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserNickname } from '@/components/UserNickname';
import { DonorBadge } from '@/components/DonorBadge';
import { 
  User, Trash2, Edit2, Reply, Flag, ThumbsUp, ThumbsDown, 
  Save, X, MoreHorizontal, MessageSquare 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Profile, AppRole, DonorTier } from '@/types/database';

interface CommentItemProps {
  comment: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    profiles: Profile | null;
    user_role?: AppRole;
    donor_tier?: DonorTier;
    nickname_color?: string | null;
    helpful_count?: number;
    not_helpful_count?: number;
    user_vote?: boolean | null;
    replies?: CommentItemProps['comment'][];
  };
  currentUserId?: string;
  canModerate: boolean;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onReply: (parentId: string, content: string) => void;
  onReport: (commentId: string) => void;
  onVote: (commentId: string, isHelpful: boolean) => void;
  isNested?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  canModerate,
  onDelete,
  onEdit,
  onReply,
  onReport,
  onVote,
  isNested = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleSaveReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const isOwner = currentUserId === comment.user_id;
  const canDelete = isOwner || canModerate;
  const wasEdited = comment.updated_at !== comment.created_at;
  const helpfulScore = (comment.helpful_count || 0) - (comment.not_helpful_count || 0);

  return (
    <Card className={cn("bg-card border-border", isNested && "ml-8 mt-2 border-l-2 border-l-primary/30")}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={cn(
            "rounded-full bg-secondary flex items-center justify-center shrink-0",
            isNested ? "w-8 h-8" : "w-10 h-10"
          )}>
            {comment.profiles?.avatar_url ? (
              <img 
                src={comment.profiles.avatar_url} 
                alt="" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={cn(isNested ? "w-4 h-4" : "w-5 h-5")} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <UserNickname 
                username={comment.profiles?.username || 'Unknown'} 
                userId={comment.user_id}
                role={comment.user_role}
                donorTier={comment.donor_tier}
                customColor={comment.nickname_color}
                profilePrimaryColor={comment.profiles?.profile_primary_color}
                profileAccentColor={comment.profiles?.profile_accent_color}
                profileEmoji={comment.profiles?.profile_emoji}
                className="text-sm font-medium"
              />
              {comment.donor_tier && comment.donor_tier !== 'none' && (
                <DonorBadge tier={comment.donor_tier} size="sm" />
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.created_at)}
              </span>
              {wasEdited && (
                <span className="text-xs text-muted-foreground italic">(изменено)</span>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="w-3 h-3 mr-1" />
                    Сохранить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}>
                    <X className="w-3 h-3 mr-1" />
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-2 mt-2">
                {/* Helpful votes */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2",
                      comment.user_vote === true && "text-green-500"
                    )}
                    onClick={() => onVote(comment.id, true)}
                    disabled={!currentUserId}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </Button>
                  <span className={cn(
                    "text-xs font-medium min-w-[1.5rem] text-center",
                    helpfulScore > 0 && "text-green-500",
                    helpfulScore < 0 && "text-red-500"
                  )}>
                    {helpfulScore > 0 ? `+${helpfulScore}` : helpfulScore}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2",
                      comment.user_vote === false && "text-red-500"
                    )}
                    onClick={() => onVote(comment.id, false)}
                    disabled={!currentUserId}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Reply button */}
                {!isNested && currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    <Reply className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Ответить</span>
                  </Button>
                )}

                {/* Show replies */}
                {comment.replies && comment.replies.length > 0 && !isNested && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">
                      {showReplies ? 'Скрыть' : `Ответы (${comment.replies.length})`}
                    </span>
                  </Button>
                )}

                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(comment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    )}
                    {currentUserId && !isOwner && (
                      <DropdownMenuItem onClick={() => onReport(comment.id)}>
                        <Flag className="w-4 h-4 mr-2" />
                        Пожаловаться
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Reply form */}
            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Напишите ответ..."
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveReply} disabled={!replyContent.trim()}>
                    <Reply className="w-3 h-3 mr-1" />
                    Ответить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                canModerate={canModerate}
                onDelete={onDelete}
                onEdit={onEdit}
                onReply={onReply}
                onReport={onReport}
                onVote={onVote}
                isNested
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

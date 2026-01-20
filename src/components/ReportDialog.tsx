import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Flag, AlertTriangle } from 'lucide-react';

interface ReportDialogProps {
  projectId: string;
  projectTitle: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Спам или реклама' },
  { value: 'inappropriate', label: 'Неприемлемый контент' },
  { value: 'copyright', label: 'Нарушение авторских прав' },
  { value: 'malware', label: 'Вредоносное ПО' },
  { value: 'misleading', label: 'Вводящая в заблуждение информация' },
  { value: 'other', label: 'Другое' }
];

export function ReportDialog({ projectId, projectTitle, trigger }: ReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Войдите, чтобы отправить жалобу',
        variant: 'destructive'
      });
      return;
    }

    if (!reason) {
      toast({
        title: 'Выберите причину',
        description: 'Пожалуйста, укажите причину жалобы',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a support ticket for the report
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: `Жалоба на проект: ${projectTitle}`,
        status: 'open',
        priority: 50 // High priority for reports
      });

      if (error) throw error;

      // Get the created ticket and add details
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ticket) {
        const reasonLabel = REPORT_REASONS.find(r => r.value === reason)?.label || reason;
        const content = `🚨 **Жалоба на ресурс**\n\n**Проект:** ${projectTitle}\n**ID проекта:** ${projectId}\n**Причина:** ${reasonLabel}\n\n**Описание:**\n${description || 'Не указано'}`;
        
        await supabase.from('support_messages').insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          content
        });
      }

      toast({
        title: 'Жалоба отправлена',
        description: 'Модераторы рассмотрят вашу жалобу в ближайшее время'
      });

      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить жалобу',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Flag className="h-4 w-4 mr-2" />
            Пожаловаться
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Пожаловаться на ресурс
          </DialogTitle>
          <DialogDescription>
            Отправьте жалобу, если этот ресурс нарушает правила сообщества
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Причина жалобы</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium mb-2 block">
              Подробности (необязательно)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите проблему подробнее..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 символов
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason}
            variant="destructive"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить жалобу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

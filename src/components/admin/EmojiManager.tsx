import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomEmoji } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { groupEmojisByCategory } from '@/components/EmojiText';

const CATEGORIES = ['general', 'pepe', 'reactions', 'minecraft', 'memes'];

export function EmojiManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shortcode, setShortcode] = useState('');
  const [category, setCategory] = useState('general');
  const [emojiFile, setEmojiFile] = useState<File | null>(null);

  // Fetch all emojis
  const { data: emojis = [], isLoading } = useQuery({
    queryKey: ['admin-emojis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emojis')
        .select('*')
        .order('category')
        .order('shortcode');
      if (error) throw error;
      return data as CustomEmoji[];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!emojiFile || !shortcode || !user) {
        throw new Error('Missing required fields');
      }

      // Validate shortcode format
      if (!/^[a-zA-Z0-9_-]+$/.test(shortcode)) {
        throw new Error('Shortcode can only contain letters, numbers, underscores and dashes');
      }

      // Upload image to storage
      const ext = emojiFile.name.split('.').pop()?.toLowerCase();
      const isAnimated = ext === 'gif' || ext === 'webp';
      const filePath = `${shortcode}.${ext}`;

      // First, try to delete existing file if any
      await supabase.storage
        .from('project-files')
        .remove([`emojis/${filePath}`]);

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(`emojis/${filePath}`, emojiFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(`emojis/${filePath}`);

      // Insert emoji record
      const { error: insertError } = await supabase
        .from('emojis')
        .insert({
          shortcode: shortcode.toLowerCase(),
          image_url: publicUrl,
          is_animated: isAnimated,
          category,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['custom-emojis'] });
      toast({ title: 'Эмодзи добавлен!' });
      setIsDialogOpen(false);
      setShortcode('');
      setEmojiFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message.includes('duplicate')
          ? 'Этот shortcode уже существует'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (emoji: CustomEmoji) => {
      // Delete from database
      const { error } = await supabase
        .from('emojis')
        .delete()
        .eq('id', emoji.id);

      if (error) throw error;

      // Try to delete from storage (ignore errors)
      const fileName = emoji.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('project-files')
          .remove([`emojis/${fileName}`]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['custom-emojis'] });
      toast({ title: 'Эмодзи удален' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка удаления',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const groupedEmojis = groupEmojisByCategory(emojis);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Кастомные эмодзи</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Добавить эмодзи</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="shortcode">Shortcode</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">:</span>
                  <Input
                    id="shortcode"
                    value={shortcode}
                    onChange={(e) => setShortcode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="pepe_happy"
                    className="glass-input"
                  />
                  <span className="text-muted-foreground">:</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Будет использоваться как :{shortcode || 'shortcode'}:
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Изображение</Label>
                <div className="flex items-center gap-4">
                  {emojiFile ? (
                    <img
                      src={URL.createObjectURL(emojiFile)}
                      alt="Preview"
                      className="w-12 h-12 object-contain rounded border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded border border-dashed border-border flex items-center justify-center">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex-1">
                    <Button variant="outline" className="w-full cursor-pointer" asChild>
                      <span>
                        {emojiFile ? emojiFile.name : 'Выбрать файл'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => setEmojiFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, GIF или WebP. Рекомендуемый размер: 64x64 или 128x128
                </p>
              </div>

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !shortcode || !emojiFile}
                className="w-full"
              >
                {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Добавить эмодзи
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {Object.keys(groupedEmojis).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Нет добавленных эмодзи
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEmojis).map(([cat, catEmojis]) => (
              <div key={cat}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                  {cat}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {catEmojis.map((emoji) => (
                    <div
                      key={emoji.id}
                      className="group relative aspect-square rounded-lg border border-border bg-secondary/50 flex items-center justify-center hover:border-primary/50 transition-colors"
                    >
                      <img
                        src={emoji.image_url}
                        alt={`:${emoji.shortcode}:`}
                        title={`:${emoji.shortcode}:`}
                        className="w-8 h-8 object-contain"
                      />
                      <button
                        onClick={() => deleteMutation.mutate(emoji)}
                        disabled={deleteMutation.isPending}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        :{emoji.shortcode}:
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
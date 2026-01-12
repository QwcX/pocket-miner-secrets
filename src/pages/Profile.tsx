import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2, Save, Camera, ImagePlus, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DISCORD_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TELEGRAM_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

interface ExtendedProfile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  discord_username: string | null;
  telegram_username: string | null;
  profile_primary_color: string | null;
  profile_accent_color: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    discord_username: '',
    telegram_username: '',
    profile_primary_color: '',
    profile_accent_color: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ExtendedProfile | null;
    },
    enabled: !!user?.id,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        discord_username: profile.discord_username || '',
        telegram_username: profile.telegram_username || '',
        profile_primary_color: profile.profile_primary_color || '',
        profile_accent_color: profile.profile_accent_color || '',
      });
    }
  }, [profile]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      let avatarUrl = profile?.avatar_url;
      let bannerUrl = profile?.banner_url;

      // Upload avatar if changed
      if (avatarFile) {
        const avatarPath = `${user.id}/avatar.${avatarFile.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(avatarPath);

        avatarUrl = publicUrl;
      }

      // Upload banner if changed
      if (bannerFile) {
        const bannerPath = `${user.id}/banner.${bannerFile.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(bannerPath, bannerFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(bannerPath);

        bannerUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          bio: formData.bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          discord_username: formData.discord_username || null,
          telegram_username: formData.telegram_username || null,
          profile_primary_color: formData.profile_primary_color || null,
          profile_accent_color: formData.profile_accent_color || null,
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({ title: 'Профиль обновлен!' });
      setAvatarFile(null);
      setBannerFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message.includes('duplicate')
          ? 'Это имя пользователя уже занято'
          : 'Не удалось обновить профиль',
        variant: 'destructive',
      });
    },
  });

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const avatarPreview = avatarFile 
    ? URL.createObjectURL(avatarFile) 
    : profile?.avatar_url;

  const bannerPreview = bannerFile
    ? URL.createObjectURL(bannerFile)
    : profile?.banner_url;

  const removeBanner = () => {
    setBannerFile(null);
    // If there's an existing banner, we need to update the form to remove it
    if (profile?.banner_url) {
      // We'll handle this by setting a flag or updating directly
      supabase
        .from('profiles')
        .update({ banner_url: null })
        .eq('id', user?.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
          toast({ title: 'Баннер удален' });
        });
    }
  };

  return (
    <>
      <Helmet>
        <title>Профиль | TestLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8 max-w-3xl">
          <Card className="glass-card overflow-hidden">
            {/* Banner Section */}
            <div className="relative">
              <div 
                className="h-48 bg-gradient-to-br from-primary/30 via-accent/20 to-minecraft-diamond/30"
                style={bannerPreview ? {
                  backgroundImage: `url(${bannerPreview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {}}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                
                {/* Banner controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <label className="p-2 rounded-lg bg-background/50 backdrop-blur-sm cursor-pointer hover:bg-background/70 transition-colors">
                    <ImagePlus className="w-5 h-5 text-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {(bannerPreview || bannerFile) && (
                    <button 
                      type="button"
                      onClick={removeBanner}
                      className="p-2 rounded-lg bg-destructive/50 backdrop-blur-sm cursor-pointer hover:bg-destructive/70 transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar overlapping banner */}
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden shadow-xl">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-14 h-14 text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <CardHeader className="pt-16 pb-4">
              <CardTitle>Настройки профиля</CardTitle>
              <CardDescription>
                Управляйте информацией вашего аккаунта
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="username"
                    className="glass-input"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Расскажите о себе..."
                    rows={3}
                    className="glass-input resize-none"
                  />
                </div>

                {/* Profile colors */}
                <div className="border-t border-border/50 pt-6">
                  <h3 className="text-lg font-medium mb-4">Цвета профиля</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile_primary_color">Primary цвет</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="profile_primary_color"
                          type="color"
                          value={formData.profile_primary_color || '#000000'}
                          onChange={(e) =>
                            setFormData({ ...formData, profile_primary_color: e.target.value })
                          }
                          className="h-10 w-14 p-1 glass-input"
                          aria-label="Primary цвет"
                        />
                        <Input
                          value={formData.profile_primary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, profile_primary_color: e.target.value })
                          }
                          placeholder="#RRGGBB"
                          className="glass-input"
                          inputMode="text"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="glass-button"
                          onClick={() => setFormData({ ...formData, profile_primary_color: '' })}
                        >
                          Сброс
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Совет: выбери цвет с хорошим контрастом к фону, чтобы ник читался.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile_accent_color">Accent цвет</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="profile_accent_color"
                          type="color"
                          value={formData.profile_accent_color || '#000000'}
                          onChange={(e) =>
                            setFormData({ ...formData, profile_accent_color: e.target.value })
                          }
                          className="h-10 w-14 p-1 glass-input"
                          aria-label="Accent цвет"
                        />
                        <Input
                          value={formData.profile_accent_color}
                          onChange={(e) =>
                            setFormData({ ...formData, profile_accent_color: e.target.value })
                          }
                          placeholder="#RRGGBB"
                          className="glass-input"
                          inputMode="text"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="glass-button"
                          onClick={() => setFormData({ ...formData, profile_accent_color: '' })}
                        >
                          Сброс
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Accent используется для деталей (бейджи/обводки/акценты).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="border-t border-border/50 pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    Социальные сети
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Discord */}
                    <div className="space-y-2">
                      <Label htmlFor="discord" className="flex items-center gap-2">
                        <span className="text-[#5865F2]"><DISCORD_ICON /></span>
                        Discord
                      </Label>
                      <Input
                        id="discord"
                        value={formData.discord_username}
                        onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                        placeholder="username#0000 или username"
                        className="glass-input"
                      />
                    </div>

                    {/* Telegram */}
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="flex items-center gap-2">
                        <span className="text-[#229ED9]"><TELEGRAM_ICON /></span>
                        Telegram
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input
                          id="telegram"
                          value={formData.telegram_username}
                          onChange={(e) => setFormData({ ...formData, telegram_username: e.target.value.replace('@', '') })}
                          placeholder="username"
                          className="glass-input pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/user/${user?.id}`)}
                    className="glass-button"
                  >
                    Посмотреть профиль
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}

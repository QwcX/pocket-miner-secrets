import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload as UploadIcon, 
  X, 
  Plus,
  Loader2,
  ArrowLeft,
  Image,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import { ContentType, CONTENT_TYPE_LABELS } from '@/types/database';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

const uploadSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(100, 'Максимум 100 символов'),
  description: z.string().min(20, 'Минимум 20 символов').max(5000, 'Максимум 5000 символов'),
  content_type: z.enum(['plugin', 'mod', 'map', 'resourcepack', 'build', 'config']),
  version_number: z.string().min(1, 'Укажите версию'),
  download_url: z.string().url('Введите корректную ссылку').min(1, 'Укажите ссылку на скачивание'),
});

const MINECRAFT_VERSIONS = [
  '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
  '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
  '1.15.2', '1.14.4', '1.13.2', '1.12.2', '1.11.2', '1.10.2', '1.9.4', '1.8.9', '1.7.10',
];

export default function Upload() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: '' as ContentType | '',
    version_number: '1.0.0',
    download_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now().toString(36);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 10 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const toggleVersion = (version: string) => {
    if (selectedVersions.includes(version)) {
      setSelectedVersions(selectedVersions.filter((v) => v !== version));
    } else {
      setSelectedVersions([...selectedVersions, version]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = uploadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(formData.title);
      let thumbnailUrl = null;

      // Upload thumbnail
      if (thumbnailFile) {
        const thumbnailPath = `${user!.id}/${slug}/thumbnail.${thumbnailFile.name.split('.').pop()}`;
        const { error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailPath, thumbnailFile);

        if (thumbnailError) throw thumbnailError;

        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailPath);

        thumbnailUrl = publicUrl;
      }

      // Create project - is_approved = false (goes to moderation)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          author_id: user!.id,
          title: formData.title,
          slug,
          description: formData.description,
          content_type: formData.content_type as ContentType,
          minecraft_versions: selectedVersions,
          tags,
          thumbnail_url: thumbnailUrl,
          download_url: formData.download_url,
          is_approved: false, // Goes to moderation
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create version
      const { error: versionError } = await supabase
        .from('project_versions')
        .insert({
          project_id: project.id,
          version_number: formData.version_number,
          file_url: formData.download_url,
          file_size: 0,
          minecraft_versions: selectedVersions,
        });

      if (versionError) throw versionError;

      toast({
        title: 'Отправлено на модерацию!',
        description: 'Ваш проект будет проверен модераторами',
      });

      navigate('/my-projects');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка загрузки',
        description: error.message || 'Попробуйте позже',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Загрузить проект | TestLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8 max-w-3xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Загрузить проект</CardTitle>
              <CardDescription>
                Заполните информацию о вашем проекте
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Alert className="mb-6 bg-minecraft-gold/10 border-minecraft-gold">
                <AlertCircle className="h-4 w-4 text-minecraft-gold" />
                <AlertDescription className="text-minecraft-gold">
                  Все проекты проходят проверку модераторами перед публикацией
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    placeholder="Мой крутой плагин"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                  )}
                </div>

                {/* Content Type */}
                <div className="space-y-2">
                  <Label>Тип контента *</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) => setFormData({ ...formData, content_type: value as ContentType })}
                  >
                    <SelectTrigger className={errors.content_type ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.content_type && (
                    <p className="text-xs text-destructive">{errors.content_type}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    placeholder="Подробное описание вашего проекта..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/5000 символов
                  </p>
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
                </div>

                {/* Minecraft Versions */}
                <div className="space-y-2">
                  <Label>Поддерживаемые версии Minecraft</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg max-h-48 overflow-y-auto">
                    {MINECRAFT_VERSIONS.map((version) => (
                      <Badge
                        key={version}
                        variant={selectedVersions.includes(version) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleVersion(version)}
                      >
                        {version}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Теги</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Добавить тег"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>Обложка</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {thumbnailFile ? (
                      <div className="flex items-center justify-center gap-4">
                        <Image className="w-8 h-8 text-primary" />
                        <span className="text-sm">{thumbnailFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setThumbnailFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Image className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Нажмите для выбора изображения
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG до 5MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Version Number */}
                <div className="space-y-2">
                  <Label htmlFor="version">Номер версии *</Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={formData.version_number}
                    onChange={(e) => setFormData({ ...formData, version_number: e.target.value })}
                    className={errors.version_number ? 'border-destructive' : ''}
                  />
                  {errors.version_number && (
                    <p className="text-xs text-destructive">{errors.version_number}</p>
                  )}
                </div>

                {/* Download URL */}
                <div className="space-y-2">
                  <Label htmlFor="download_url">Ссылка на скачивание *</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="download_url"
                      placeholder="https://drive.google.com/... или https://workupload.com/..."
                      value={formData.download_url}
                      onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                      className={`pl-10 ${errors.download_url ? 'border-destructive' : ''}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Поддерживаются: Google Drive, Yandex Disk, WorkUpload, MediaFire и др.
                  </p>
                  {errors.download_url && (
                    <p className="text-xs text-destructive">{errors.download_url}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Отправить на модерацию
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}

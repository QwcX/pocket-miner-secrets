import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, History, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ProjectVersion } from '@/types/database';
import { cn } from '@/lib/utils';

interface VersionTimelineProps {
  versions: ProjectVersion[];
  onDownload: (fileUrl: string) => void;
  canDownload: boolean;
}

export function VersionTimeline({ versions, onDownload, canDownload }: VersionTimelineProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>(versions[0]?.id || '');
  const [expandedChangelogs, setExpandedChangelogs] = useState<Set<string>>(new Set());

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Неизвестно';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const toggleChangelog = (versionId: string) => {
    const newExpanded = new Set(expandedChangelogs);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedChangelogs(newExpanded);
  };

  const selectedVersionData = versions.find(v => v.id === selectedVersion) || versions[0];

  if (versions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Нет доступных версий</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version selector */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Выберите версию</h3>
                <p className="text-sm text-muted-foreground">
                  Всего {versions.length} {versions.length === 1 ? 'версия' : 'версий'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Выберите версию" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v, i) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version_number} {i === 0 && '(последняя)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedVersionData && onDownload(selectedVersionData.file_url)}
                disabled={!canDownload || !selectedVersionData}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать
              </Button>
            </div>
          </div>

          {/* Selected version info */}
          {selectedVersionData && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedVersionData.minecraft_versions?.map(mc => (
                  <Badge key={mc} variant="outline" className="text-xs">
                    {mc}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Размер: {formatFileSize(selectedVersionData.file_size)} • 
                Скачиваний: {selectedVersionData.downloads_count} • 
                {formatDate(selectedVersionData.created_at)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version timeline */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            История обновлений
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline items */}
            <div className="space-y-4">
              {versions.map((version, index) => {
                const isExpanded = expandedChangelogs.has(version.id);
                const isLatest = index === 0;
                
                return (
                  <div key={version.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-2.5 top-2 w-3 h-3 rounded-full border-2",
                      isLatest 
                        ? "bg-primary border-primary" 
                        : "bg-background border-muted-foreground"
                    )} />

                    <div className={cn(
                      "p-4 rounded-lg border transition-colors",
                      isLatest 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-card border-border hover:border-primary/30"
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">v{version.version_number}</span>
                            {isLatest && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                Последняя
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(version.created_at)}
                          </p>
                          
                          {/* Minecraft versions */}
                          {version.minecraft_versions && version.minecraft_versions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {version.minecraft_versions.slice(0, 5).map(mc => (
                                <Badge key={mc} variant="secondary" className="text-xs">
                                  {mc}
                                </Badge>
                              ))}
                              {version.minecraft_versions.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{version.minecraft_versions.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Changelog */}
                          {version.changelog && (
                            <div className="mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 -ml-2"
                                onClick={() => toggleChangelog(version.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    Скрыть изменения
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Показать изменения
                                  </>
                                )}
                              </Button>
                              
                              {isExpanded && (
                                <div className="mt-2 p-3 rounded bg-secondary/50 text-sm whitespace-pre-wrap">
                                  {version.changelog}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={isLatest ? 'default' : 'outline'}
                          onClick={() => onDownload(version.file_url)}
                          disabled={!canDownload}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

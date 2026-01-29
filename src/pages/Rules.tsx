import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ScrollText, Shield, Ban, MessageSquare, Upload, 
  AlertTriangle, CheckCircle, XCircle 
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const rules = [
  {
    title: 'Общие правила',
    icon: Shield,
    items: [
      { type: 'allowed', text: 'Уважительное отношение ко всем участникам сообщества' },
      { type: 'allowed', text: 'Конструктивная критика и помощь другим пользователям' },
      { type: 'allowed', text: 'Использование русского или английского языка' },
      { type: 'forbidden', text: 'Оскорбления, угрозы и дискриминация' },
      { type: 'forbidden', text: 'Спам, реклама и самопиар без согласования' },
      { type: 'forbidden', text: 'Обход блокировок с помощью мультиаккаунтов' },
    ],
  },
  {
    title: 'Правила загрузки контента',
    icon: Upload,
    items: [
      { type: 'allowed', text: 'Загрузка собственных работ и проектов' },
      { type: 'allowed', text: 'Публикация легальных сливов с указанием источника' },
      { type: 'allowed', text: 'Подробное описание функционала и требований' },
      { type: 'forbidden', text: 'Вредоносный код, вирусы, майнеры' },
      { type: 'forbidden', text: 'Контент, нарушающий авторские права (по запросу правообладателя)' },
      { type: 'forbidden', text: 'Фейковые или неработающие файлы' },
      { type: 'forbidden', text: 'Контент для взрослых или шок-контент' },
    ],
  },
  {
    title: 'Правила общения',
    icon: MessageSquare,
    items: [
      { type: 'allowed', text: 'Обсуждение проектов и помощь в настройке' },
      { type: 'allowed', text: 'Отзывы и честные оценки проектов' },
      { type: 'allowed', text: 'Вопросы по работе платформы' },
      { type: 'forbidden', text: 'Флуд и оффтоп в комментариях' },
      { type: 'forbidden', text: 'Накрутка рейтинга и фейковые отзывы' },
      { type: 'forbidden', text: 'Разглашение личной информации других пользователей' },
    ],
  },
];

const punishments = [
  { offense: 'Первое нарушение', punishment: 'Предупреждение' },
  { offense: 'Повторное нарушение', punishment: 'Временная блокировка (1-7 дней)' },
  { offense: 'Систематические нарушения', punishment: 'Временная блокировка (30 дней)' },
  { offense: 'Грубые нарушения', punishment: 'Перманентная блокировка' },
  { offense: 'Распространение вредоносного ПО', punishment: 'Перманентная блокировка без предупреждения' },
];

export default function Rules() {
  return (
    <>
      <Helmet>
        <title>Правила сообщества | NeuroLeak</title>
        <meta name="description" content="Правила использования платформы NeuroLeak. Ознакомьтесь с правилами загрузки контента и общения." />
      </Helmet>
      
      <Layout>
        <div className="container py-8 px-4 max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-primary/50 text-primary mb-4">
              <ScrollText className="w-3 h-3 mr-1" />
              Правила
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">
              Правила сообщества
            </h1>
            <p className="text-lg text-muted-foreground">
              Соблюдение правил обеспечивает комфортное использование платформы для всех
            </p>
          </div>

          {/* Rules Sections */}
          <div className="space-y-8 mb-12">
            {rules.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {item.type === 'allowed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        )}
                        <span className="text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Punishments */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Ban className="w-5 h-5" />
                Наказания за нарушения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {punishments.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border"
                  >
                    <span className="text-foreground">{item.offense}</span>
                    <Badge variant="outline" className="text-destructive border-destructive/30">
                      {item.punishment}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="mt-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-medium mb-1">Важно</p>
              <p className="text-sm text-muted-foreground">
                Администрация оставляет за собой право изменять правила без предварительного уведомления.
                Незнание правил не освобождает от ответственности. При регистрации вы автоматически 
                соглашаетесь с данными правилами.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

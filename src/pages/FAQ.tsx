import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Download, Upload, Shield, CreditCard, MessageSquare } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const faqCategories = [
  {
    title: 'Скачивание',
    icon: Download,
    questions: [
      {
        q: 'Как скачать проект?',
        a: 'Перейдите на страницу интересующего проекта и нажмите кнопку "Скачать". Для некоторых проектов требуется регистрация или определенный уровень доната.',
      },
      {
        q: 'Почему у меня ограничение на скачивания?',
        a: 'Бесплатные пользователи имеют лимит 10 скачиваний в день. Донаторы получают увеличенные лимиты или безлимитное скачивание в зависимости от уровня подписки.',
      },
      {
        q: 'Файл не скачивается, что делать?',
        a: 'Попробуйте отключить блокировщик рекламы или использовать другой браузер. Если проблема сохраняется, обратитесь в поддержку.',
      },
    ],
  },
  {
    title: 'Загрузка контента',
    icon: Upload,
    questions: [
      {
        q: 'Как загрузить свой проект?',
        a: 'Зарегистрируйтесь на сайте, перейдите в раздел "Загрузить проект" и заполните форму. После модерации ваш проект появится в каталоге.',
      },
      {
        q: 'Сколько времени занимает модерация?',
        a: 'Обычно модерация занимает от нескольких часов до 1-2 дней. Донаторы получают приоритетную модерацию.',
      },
      {
        q: 'Какие файлы можно загружать?',
        a: 'Разрешены архивы (zip, rar, 7z), jar-файлы для плагинов, а также другие форматы связанные с Minecraft контентом. Максимальный размер файла: 100 МБ.',
      },
    ],
  },
  {
    title: 'Аккаунт и безопасность',
    icon: Shield,
    questions: [
      {
        q: 'Как сменить пароль?',
        a: 'Перейдите в настройки профиля и используйте функцию смены пароля. Если вы забыли пароль, используйте восстановление через email.',
      },
      {
        q: 'Как удалить аккаунт?',
        a: 'Для удаления аккаунта обратитесь в поддержку через соответствующий раздел.',
      },
      {
        q: 'Мой аккаунт заблокирован, что делать?',
        a: 'Если вы считаете, что блокировка ошибочна, обратитесь в поддержку с объяснением ситуации.',
      },
    ],
  },
  {
    title: 'Донат и подписки',
    icon: CreditCard,
    questions: [
      {
        q: 'Какие преимущества дает донат?',
        a: 'Донаторы получают: увеличенные лимиты скачиваний, приоритетную модерацию, уникальные значки, доступ к эксклюзивному контенту и многое другое.',
      },
      {
        q: 'Как оформить подписку?',
        a: 'Перейдите в раздел "Донат" и выберите подходящий уровень. Оплата доступна через различные платежные системы.',
      },
      {
        q: 'Можно ли вернуть деньги?',
        a: 'Возврат средств возможен в течение 24 часов после оплаты, если услуги не были использованы. Обратитесь в поддержку.',
      },
    ],
  },
  {
    title: 'Общие вопросы',
    icon: MessageSquare,
    questions: [
      {
        q: 'Как связаться с поддержкой?',
        a: 'Используйте раздел "Поддержка" на сайте или напишите нам в Discord/Telegram.',
      },
      {
        q: 'Как пожаловаться на контент?',
        a: 'На странице каждого проекта есть кнопка "Пожаловаться". Укажите причину жалобы, и модераторы рассмотрят ее.',
      },
      {
        q: 'Как стать модератором?',
        a: 'Мы периодически набираем модераторов из активных участников сообщества. Следите за анонсами в Discord.',
      },
    ],
  },
];

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>FAQ - Часто задаваемые вопросы | NeuroLeak</title>
        <meta name="description" content="Ответы на часто задаваемые вопросы о NeuroLeak. Скачивание, загрузка контента, донат и многое другое." />
      </Helmet>
      
      <Layout>
        <div className="container py-8 px-4 max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-primary/50 text-primary mb-4">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">
              Часто задаваемые вопросы
            </h1>
            <p className="text-lg text-muted-foreground">
              Ответы на популярные вопросы о работе с платформой
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                </div>
                
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${category.title}-${index}`}
                      className="bg-card border border-border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 p-6 rounded-xl bg-card border border-border text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Не нашли ответ на свой вопрос?
            </h3>
            <p className="text-muted-foreground mb-4">
              Обратитесь в поддержку, и мы поможем вам
            </p>
            <a 
              href="/support" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Написать в поддержку
            </a>
          </div>
        </div>
      </Layout>
    </>
  );
}

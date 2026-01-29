import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { 
  Mail, MessageSquare, Send, Github, 
  ExternalLink, Clock, CheckCircle 
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const contacts = [
  {
    icon: MessageSquare,
    title: 'Discord',
    description: 'Быстрая связь с командой',
    link: '#',
    linkText: 'Перейти в Discord',
  },
  {
    icon: Send,
    title: 'Telegram',
    description: 'Канал и чат сообщества',
    link: '#',
    linkText: 'Открыть Telegram',
  },
  {
    icon: Github,
    title: 'GitHub',
    description: 'Исходный код и баг-репорты',
    link: '#',
    linkText: 'Открыть GitHub',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'support@neuroleak.com',
    link: 'mailto:support@neuroleak.com',
    linkText: 'Написать письмо',
  },
];

export default function Contact() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: 'Сообщение отправлено!',
      description: 'Мы свяжемся с вами в ближайшее время',
    });
  };

  return (
    <>
      <Helmet>
        <title>Контакты | NeuroLeak</title>
        <meta name="description" content="Свяжитесь с командой NeuroLeak. Discord, Telegram, Email и форма обратной связи." />
      </Helmet>
      
      <Layout>
        <div className="container py-8 px-4">
          {/* Hero */}
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-primary/50 text-primary mb-4">
              <Mail className="w-3 h-3 mr-1" />
              Контакты
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">
              Свяжитесь с нами
            </h1>
            <p className="text-lg text-muted-foreground">
              Есть вопросы или предложения? Мы всегда рады помочь!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Contact Methods */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground mb-4">Способы связи</h2>
              
              {contacts.map((contact) => (
                <Card key={contact.title} className="hover:border-primary/50 transition-colors">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <contact.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{contact.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{contact.description}</p>
                    </div>
                    <a 
                      href={contact.link}
                      className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0"
                    >
                      {contact.linkText}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}

              {/* Support Link */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Нужна помощь?</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Используйте нашу систему поддержки для быстрого решения вопросов
                  </p>
                  <Button asChild size="sm">
                    <Link to="/support">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Открыть поддержку
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Форма обратной связи</CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Спасибо за обращение!
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Мы получили ваше сообщение и ответим в ближайшее время.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({ name: '', email: '', subject: '', message: '' });
                        }}
                      >
                        Отправить еще
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Имя</Label>
                          <Input
                            id="name"
                            placeholder="Ваше имя"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Тема</Label>
                        <Input
                          id="subject"
                          placeholder="Тема обращения"
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Сообщение</Label>
                        <Textarea
                          id="message"
                          placeholder="Опишите ваш вопрос или предложение..."
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          'Отправка...'
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Отправить сообщение
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

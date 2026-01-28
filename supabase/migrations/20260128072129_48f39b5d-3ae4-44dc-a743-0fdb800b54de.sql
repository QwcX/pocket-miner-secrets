-- Table for project subscriptions (notifications when project is updated)
CREATE TABLE IF NOT EXISTS public.project_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.project_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe to projects"
  ON public.project_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe from projects"
  ON public.project_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_subscriptions;

-- Create function to notify subscribers when project is updated
CREATE OR REPLACE FUNCTION public.notify_project_subscribers()
RETURNS TRIGGER AS $$
DECLARE
  subscriber_record RECORD;
  project_title TEXT;
  project_slug TEXT;
BEGIN
  -- Get project info
  SELECT title, slug INTO project_title, project_slug FROM public.projects WHERE id = NEW.project_id;
  
  -- Notify all subscribers
  FOR subscriber_record IN 
    SELECT user_id FROM public.project_subscriptions 
    WHERE project_id = NEW.project_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      subscriber_record.user_id,
      'project_update',
      'Обновление проекта',
      'Проект "' || project_title || '" получил новую версию ' || NEW.version_number,
      '/project/' || project_slug
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new project versions
CREATE OR REPLACE TRIGGER on_project_version_created
  AFTER INSERT ON public.project_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_subscribers();

-- Create function to notify author followers about new projects
CREATE OR REPLACE FUNCTION public.notify_author_followers()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  author_username TEXT;
BEGIN
  -- Get author username
  SELECT username INTO author_username FROM public.profiles WHERE id = NEW.author_id;
  
  -- Notify all followers
  FOR follower_record IN 
    SELECT follower_id FROM public.profile_subscriptions 
    WHERE following_id = NEW.author_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      follower_record.follower_id,
      'author_new_project',
      'Новый проект от ' || COALESCE(author_username, 'автора'),
      'Автор ' || COALESCE(author_username, 'которого вы отслеживаете') || ' загрузил новый проект: "' || NEW.title || '"',
      '/project/' || NEW.slug
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new projects (only for approved ones)
CREATE OR REPLACE TRIGGER on_project_approved_notify_followers
  AFTER UPDATE OF is_approved ON public.projects
  FOR EACH ROW
  WHEN (NEW.is_approved = true AND OLD.is_approved = false)
  EXECUTE FUNCTION public.notify_author_followers();
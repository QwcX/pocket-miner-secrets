-- 1. Remove moderator access to private messages (privacy violation)
DROP POLICY IF EXISTS "Moderators can view all messages" ON public.private_messages;

-- 2. Add server-side spam validation trigger for private messages
CREATE OR REPLACE FUNCTION public.check_message_content()
RETURNS TRIGGER AS $$
DECLARE
  blocked_word TEXT;
BEGIN
  FOR blocked_word IN SELECT word FROM public.blocked_words LOOP
    IF LOWER(NEW.content) LIKE '%' || LOWER(blocked_word) || '%' THEN
      RAISE EXCEPTION 'Message contains blocked content';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for private messages
DROP TRIGGER IF EXISTS validate_message_content ON public.private_messages;
CREATE TRIGGER validate_message_content
  BEFORE INSERT ON public.private_messages
  FOR EACH ROW EXECUTE FUNCTION public.check_message_content();

-- Create trigger for wall posts too
DROP TRIGGER IF EXISTS validate_wall_post_content ON public.profile_wall_posts;
CREATE TRIGGER validate_wall_post_content
  BEFORE INSERT ON public.profile_wall_posts
  FOR EACH ROW EXECUTE FUNCTION public.check_message_content();

-- Create trigger for comments
DROP TRIGGER IF EXISTS validate_comment_content ON public.comments;
CREATE TRIGGER validate_comment_content
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.check_message_content();
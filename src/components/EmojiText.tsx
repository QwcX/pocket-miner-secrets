import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomEmoji } from '@/types/database';
import { cn } from '@/lib/utils';

interface EmojiTextProps {
  text: string;
  className?: string;
}

// Parse text and replace :shortcode: with emoji images
export function EmojiText({ text, className }: EmojiTextProps) {
  const { data: emojis = [] } = useQuery({
    queryKey: ['custom-emojis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emojis')
        .select('*')
        .order('shortcode');
      if (error) throw error;
      return data as CustomEmoji[];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Create a map for quick lookup
  const emojiMap = new Map(emojis.map(e => [e.shortcode, e]));

  // Parse text and replace :shortcode: patterns
  const parseEmojis = (input: string): (string | JSX.Element)[] => {
    const pattern = /:([a-zA-Z0-9_-]+):/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(input)) !== null) {
      // Add text before the emoji
      if (match.index > lastIndex) {
        parts.push(input.slice(lastIndex, match.index));
      }

      const shortcode = match[1];
      const emoji = emojiMap.get(shortcode);

      if (emoji) {
        // Replace with emoji image
        parts.push(
          <img
            key={`${emoji.id}-${match.index}`}
            src={emoji.image_url}
            alt={`:${shortcode}:`}
            title={`:${shortcode}:`}
            className={cn(
              'inline-block align-middle',
              emoji.is_animated ? 'w-6 h-6' : 'w-5 h-5'
            )}
            loading="lazy"
          />
        );
      } else {
        // Keep original text if emoji not found
        parts.push(match[0]);
      }

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      parts.push(input.slice(lastIndex));
    }

    return parts;
  };

  const parsedContent = parseEmojis(text);

  return (
    <span className={className}>
      {parsedContent.map((part, index) =>
        typeof part === 'string' ? <span key={index}>{part}</span> : part
      )}
    </span>
  );
}

// Hook to get all available emojis for picker
export function useCustomEmojis() {
  return useQuery({
    queryKey: ['custom-emojis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emojis')
        .select('*')
        .order('category', { ascending: true })
        .order('shortcode', { ascending: true });
      if (error) throw error;
      return data as CustomEmoji[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Group emojis by category
export function groupEmojisByCategory(emojis: CustomEmoji[]): Record<string, CustomEmoji[]> {
  return emojis.reduce((acc, emoji) => {
    const category = emoji.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(emoji);
    return acc;
  }, {} as Record<string, CustomEmoji[]>);
}

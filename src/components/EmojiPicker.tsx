import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Meme emoji collections - using emoji shortcodes
const EMOJI_CATEGORIES = {
  pepe: {
    name: 'Pepe',
    icon: '🐸',
    emojis: [
      { code: ':pepe_laugh:', emoji: '😂🐸' },
      { code: ':pepe_sad:', emoji: '😢🐸' },
      { code: ':pepe_angry:', emoji: '😠🐸' },
      { code: ':pepe_happy:', emoji: '😊🐸' },
      { code: ':pepe_cry:', emoji: '😭🐸' },
      { code: ':pepe_cool:', emoji: '😎🐸' },
      { code: ':pepe_smug:', emoji: '😏🐸' },
      { code: ':pepe_clown:', emoji: '🤡🐸' },
      { code: ':pepe_think:', emoji: '🤔🐸' },
      { code: ':pepe_pog:', emoji: '😮🐸' },
      { code: ':pepe_love:', emoji: '😍🐸' },
      { code: ':pepe_ok:', emoji: '👌🐸' },
      { code: ':pepe_thumbsup:', emoji: '👍🐸' },
      { code: ':pepe_thumbsdown:', emoji: '👎🐸' },
      { code: ':pepe_pray:', emoji: '🙏🐸' },
      { code: ':pepe_fire:', emoji: '🔥🐸' },
      { code: ':pepe_sus:', emoji: '🧐🐸' },
      { code: ':pepe_shock:', emoji: '😱🐸' },
      { code: ':pepe_sleep:', emoji: '😴🐸' },
      { code: ':pepe_wink:', emoji: '😉🐸' },
    ],
  },
  memes: {
    name: 'Мемы',
    icon: '🗿',
    emojis: [
      { code: ':trollface:', emoji: '😈' },
      { code: ':rage:', emoji: '🤬' },
      { code: ':forever_alone:', emoji: '😿' },
      { code: ':derp:', emoji: '🥴' },
      { code: ':okay:', emoji: '😐' },
      { code: ':not_bad:', emoji: '😌' },
      { code: ':me_gusta:', emoji: '😋' },
      { code: ':yao_ming:', emoji: '😆' },
      { code: ':poker_face:', emoji: '😶' },
      { code: ':cereal_guy:', emoji: '🥣' },
      { code: ':lol:', emoji: '😂' },
      { code: ':kekw:', emoji: '🤣' },
      { code: ':monkaS:', emoji: '😰' },
      { code: ':pepehands:', emoji: '😿' },
      { code: ':sadge:', emoji: '😔' },
      { code: ':pog:', emoji: '😮' },
      { code: ':omegalul:', emoji: '😆' },
      { code: ':copium:', emoji: '💨' },
      { code: ':based:', emoji: '💪' },
      { code: ':gigachad:', emoji: '🗿' },
    ],
  },
  reactions: {
    name: 'Реакции',
    icon: '👍',
    emojis: [
      { code: ':thumbsup:', emoji: '👍' },
      { code: ':thumbsdown:', emoji: '👎' },
      { code: ':heart:', emoji: '❤️' },
      { code: ':fire:', emoji: '🔥' },
      { code: ':100:', emoji: '💯' },
      { code: ':clap:', emoji: '👏' },
      { code: ':eyes:', emoji: '👀' },
      { code: ':skull:', emoji: '💀' },
      { code: ':cap:', emoji: '🧢' },
      { code: ':nerd:', emoji: '🤓' },
      { code: ':brain:', emoji: '🧠' },
      { code: ':crown:', emoji: '👑' },
      { code: ':gem:', emoji: '💎' },
      { code: ':rocket:', emoji: '🚀' },
      { code: ':money:', emoji: '💰' },
      { code: ':star:', emoji: '⭐' },
      { code: ':pray:', emoji: '🙏' },
      { code: ':facepalm:', emoji: '🤦' },
      { code: ':shrug:', emoji: '🤷' },
      { code: ':muscle:', emoji: '💪' },
    ],
  },
  faces: {
    name: 'Лица',
    icon: '😀',
    emojis: [
      { code: ':grin:', emoji: '😁' },
      { code: ':joy:', emoji: '😂' },
      { code: ':rofl:', emoji: '🤣' },
      { code: ':smile:', emoji: '😊' },
      { code: ':sweat_smile:', emoji: '😅' },
      { code: ':wink:', emoji: '😉' },
      { code: ':blush:', emoji: '😊' },
      { code: ':yum:', emoji: '😋' },
      { code: ':sunglasses:', emoji: '😎' },
      { code: ':heart_eyes:', emoji: '😍' },
      { code: ':kissing:', emoji: '😘' },
      { code: ':thinking:', emoji: '🤔' },
      { code: ':neutral:', emoji: '😐' },
      { code: ':expressionless:', emoji: '😑' },
      { code: ':unamused:', emoji: '😒' },
      { code: ':rolling_eyes:', emoji: '🙄' },
      { code: ':smirk:', emoji: '😏' },
      { code: ':persevere:', emoji: '😣' },
      { code: ':disappointed:', emoji: '😞' },
      { code: ':worried:', emoji: '😟' },
    ],
  },
  gaming: {
    name: 'Игры',
    icon: '🎮',
    emojis: [
      { code: ':gg:', emoji: '🏆' },
      { code: ':ez:', emoji: '😎' },
      { code: ':noob:', emoji: '👶' },
      { code: ':pro:', emoji: '🏅' },
      { code: ':lag:', emoji: '🐢' },
      { code: ':rage_quit:', emoji: '💢' },
      { code: ':clutch:', emoji: '🎯' },
      { code: ':headshot:', emoji: '🎯' },
      { code: ':victory:', emoji: '✌️' },
      { code: ':defeat:', emoji: '😢' },
      { code: ':respawn:', emoji: '🔄' },
      { code: ':loot:', emoji: '🎁' },
      { code: ':xp:', emoji: '⬆️' },
      { code: ':level_up:', emoji: '📈' },
      { code: ':controller:', emoji: '🎮' },
      { code: ':keyboard:', emoji: '⌨️' },
      { code: ':mouse:', emoji: '🖱️' },
      { code: ':minecraft:', emoji: '⛏️' },
      { code: ':sword:', emoji: '⚔️' },
      { code: ':shield:', emoji: '🛡️' },
    ],
  },
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pepe');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 text-xl hover:bg-secondary"
      >
        😎
      </Button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 z-50 w-80 rounded-lg border border-border bg-background shadow-xl animate-in fade-in-0 zoom-in-95">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-10 bg-secondary/50 rounded-t-lg rounded-b-none">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  title={category.name}
                >
                  {category.icon}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <TabsContent key={key} value={key} className="m-0">
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {category.emojis.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleEmojiClick(item.emoji)}
                        className="flex items-center justify-center h-12 w-12 text-2xl rounded-md hover:bg-secondary transition-colors"
                        title={item.code}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}

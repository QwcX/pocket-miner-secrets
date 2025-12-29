import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ImageEmoji {
  code: string;
  url: string;
  alt: string;
}

interface TextEmoji {
  code: string;
  emoji: string;
}

type EmojiItem = ImageEmoji | TextEmoji;

const isImageEmoji = (item: EmojiItem): item is ImageEmoji => 'url' in item;

// Pepe pack from SigStick (stored locally in public/assets/emoji)
const SIGSTICK_PEPE: ImageEmoji[] = Array.from({ length: 24 }, (_, i) => ({
  code: `:pepe_sig_${i}:`,
  url: `/assets/emoji/pepe-sigstick/${i}.webp`,
  alt: `Pepe sticker ${i}`,
}));

// Pepe category from emoji.gg (stored locally in public/assets/emoji)
const EMOJI_GG_PEPE: ImageEmoji[] = [
  { code: ':reversa:', url: '/assets/emoji/pepe-emoji-gg/reversa.gif', alt: 'reversa' },
  { code: ':yay:', url: '/assets/emoji/pepe-emoji-gg/yay.gif', alt: 'yay' },
  { code: ':uu:', url: '/assets/emoji/pepe-emoji-gg/uu.png', alt: 'uu' },
  { code: ':noconexion:', url: '/assets/emoji/pepe-emoji-gg/noconexion.png', alt: 'noconexion' },
  { code: ':soga:', url: '/assets/emoji/pepe-emoji-gg/soga.png', alt: 'soga' },
  { code: ':bed:', url: '/assets/emoji/pepe-emoji-gg/bed.gif', alt: 'bed' },
  { code: ':jsjs:', url: '/assets/emoji/pepe-emoji-gg/jsjs.gif', alt: 'jsjs' },
  { code: ':noob:', url: '/assets/emoji/pepe-emoji-gg/noob.gif', alt: 'noob' },
  { code: ':whatttt:', url: '/assets/emoji/pepe-emoji-gg/whatttt.png', alt: 'whatttt' },
  { code: ':toxic:', url: '/assets/emoji/pepe-emoji-gg/toxic.gif', alt: 'toxic' },
  { code: ':peepopurple:', url: '/assets/emoji/pepe-emoji-gg/peepopurple.png', alt: 'peepopurple' },
  { code: ':sleepypepe:', url: '/assets/emoji/pepe-emoji-gg/sleepypepe.png', alt: 'sleepypepe' },
  { code: ':s4ic1d4:', url: '/assets/emoji/pepe-emoji-gg/s4ic1d4.png', alt: 's4ic1d4' },
  { code: ':pepelooking:', url: '/assets/emoji/pepe-emoji-gg/pepelooking.png', alt: 'pepelooking' },
  { code: ':owol:', url: '/assets/emoji/pepe-emoji-gg/owol.png', alt: 'owol' },
  { code: ':life:', url: '/assets/emoji/pepe-emoji-gg/life.png', alt: 'life' },
  { code: ':ok:', url: '/assets/emoji/pepe-emoji-gg/ok.png', alt: 'ok' },
  { code: ':peepopog:', url: '/assets/emoji/pepe-emoji-gg/peepopog.gif', alt: 'peepopog' },
  { code: ':pepelmao:', url: '/assets/emoji/pepe-emoji-gg/pepelmao.gif', alt: 'pepelmao' },
  { code: ':pepesmoking:', url: '/assets/emoji/pepe-emoji-gg/pepesmoking.gif', alt: 'pepesmoking' },
  { code: ':spedpepe:', url: '/assets/emoji/pepe-emoji-gg/spedpepe.png', alt: 'spedpepe' },
  { code: ':delusional:', url: '/assets/emoji/pepe-emoji-gg/delusional.png', alt: 'delusional' },
  { code: ':swepepeviking:', url: '/assets/emoji/pepe-emoji-gg/swepepeviking.png', alt: 'swepepeviking' },
  { code: ':stephblush:', url: '/assets/emoji/pepe-emoji-gg/stephblush.png', alt: 'stephblush' },
  { code: ':pepeflower:', url: '/assets/emoji/pepe-emoji-gg/pepeflower.gif', alt: 'pepeflower' },
];

const REACTION_EMOJIS: TextEmoji[] = [
  { code: ':thumbsup:', emoji: '👍' },
  { code: ':thumbsdown:', emoji: '👎' },
  { code: ':heart:', emoji: '❤️' },
  { code: ':fire:', emoji: '🔥' },
  { code: ':100:', emoji: '💯' },
  { code: ':clap:', emoji: '👏' },
  { code: ':eyes:', emoji: '👀' },
  { code: ':joy:', emoji: '😂' },
  { code: ':sob:', emoji: '😭' },
  { code: ':angry:', emoji: '😠' },
  { code: ':thinking:', emoji: '🤔' },
  { code: ':sunglasses:', emoji: '😎' },
  { code: ':ok_hand:', emoji: '👌' },
  { code: ':pray:', emoji: '🙏' },
  { code: ':muscle:', emoji: '💪' },
];

const GAMING_EMOJIS: TextEmoji[] = [
  { code: ':gg:', emoji: '🏆' },
  { code: ':controller:', emoji: '🎮' },
  { code: ':sword:', emoji: '⚔️' },
  { code: ':shield:', emoji: '🛡️' },
  { code: ':pickaxe:', emoji: '⛏️' },
  { code: ':potion:', emoji: '🧪' },
  { code: ':diamond:', emoji: '💎' },
  { code: ':target:', emoji: '🎯' },
  { code: ':boom:', emoji: '💥' },
  { code: ':ghost:', emoji: '👻' },
  { code: ':robot:', emoji: '🤖' },
  { code: ':dice:', emoji: '🎲' },
  { code: ':joystick:', emoji: '🕹️' },
  { code: ':rocket:', emoji: '🚀' },
  { code: ':crown:', emoji: '👑' },
];

const EMOJI_CATEGORIES = {
  sigstick: {
    name: 'Pepe (SigStick)',
    icon: '🐸',
    emojis: SIGSTICK_PEPE as EmojiItem[],
  },
  pepe: {
    name: 'Pepe (emoji.gg)',
    icon: '🟩',
    emojis: EMOJI_GG_PEPE as EmojiItem[],
  },
  reactions: {
    name: 'Реакции',
    icon: '👍',
    emojis: REACTION_EMOJIS as EmojiItem[],
  },
  gaming: {
    name: 'Игры',
    icon: '🎮',
    emojis: GAMING_EMOJIS as EmojiItem[],
  },
};

type EmojiCategoryKey = keyof typeof EMOJI_CATEGORIES;

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string, isImage?: boolean, imageUrl?: string) => void;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EmojiCategoryKey>('sigstick');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleEmojiClick = (item: EmojiItem) => {
    if (isImageEmoji(item)) {
      onEmojiSelect(item.code, true, item.url);
    } else {
      onEmojiSelect(item.emoji, false);
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(v => !v)}
        className="h-10 w-10 text-xl hover:bg-secondary"
        aria-label="Открыть панель эмодзи"
      >
        😎
      </Button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 z-50 w-[22rem] sm:w-96 rounded-lg border border-border bg-background shadow-xl animate-in fade-in-0 zoom-in-95">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EmojiCategoryKey)} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-10 bg-secondary/50 rounded-t-lg rounded-b-none">
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
                <ScrollArea className="h-72">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {category.emojis.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleEmojiClick(item)}
                        className="flex items-center justify-center h-14 w-14 rounded-md hover:bg-secondary transition-colors"
                        title={item.code}
                      >
                        {isImageEmoji(item) ? (
                          <img
                            src={item.url}
                            alt={item.alt}
                            className="w-12 h-12 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-3xl">{item.emoji}</span>
                        )}
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

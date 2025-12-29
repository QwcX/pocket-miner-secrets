import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Image-based emoji type
interface ImageEmoji {
  code: string;
  url: string;
  alt: string;
}

// Text emoji type
interface TextEmoji {
  code: string;
  emoji: string;
}

type EmojiItem = ImageEmoji | TextEmoji;

const isImageEmoji = (item: EmojiItem): item is ImageEmoji => 'url' in item;

// Pepe emojis from emoji.gg CDN
const PEPE_EMOJIS: ImageEmoji[] = [
  { code: ':pepe_laugh:', url: 'https://cdn3.emoji.gg/emojis/9680-pepe-laugh.png', alt: 'Pepe Laugh' },
  { code: ':pepe_sad:', url: 'https://cdn3.emoji.gg/emojis/5765-pepe-sad.png', alt: 'Pepe Sad' },
  { code: ':pepe_cry:', url: 'https://cdn3.emoji.gg/emojis/6240-pepe-cry.png', alt: 'Pepe Cry' },
  { code: ':pepe_ok:', url: 'https://cdn3.emoji.gg/emojis/829312-ok.png', alt: 'Pepe OK' },
  { code: ':pepe_think:', url: 'https://cdn3.emoji.gg/emojis/5926-pepe-think.png', alt: 'Pepe Think' },
  { code: ':pepe_clown:', url: 'https://cdn3.emoji.gg/emojis/3974-pepeclown.png', alt: 'Pepe Clown' },
  { code: ':pepe_smug:', url: 'https://cdn3.emoji.gg/emojis/4221-smug.png', alt: 'Pepe Smug' },
  { code: ':pepe_pog:', url: 'https://cdn3.emoji.gg/emojis/2376-poggers.png', alt: 'Pepe Pog' },
  { code: ':pepe_love:', url: 'https://cdn3.emoji.gg/emojis/8703-pepe-love.png', alt: 'Pepe Love' },
  { code: ':pepe_angry:', url: 'https://cdn3.emoji.gg/emojis/5155-pepe-angry.png', alt: 'Pepe Angry' },
  { code: ':pepe_hmm:', url: 'https://cdn3.emoji.gg/emojis/5974-pepe-hmm.png', alt: 'Pepe Hmm' },
  { code: ':pepe_hug:', url: 'https://cdn3.emoji.gg/emojis/4671-pepehug.png', alt: 'Pepe Hug' },
  { code: ':pepe_comfy:', url: 'https://cdn3.emoji.gg/emojis/8413-pepecomfy.png', alt: 'Pepe Comfy' },
  { code: ':pepe_pray:', url: 'https://cdn3.emoji.gg/emojis/1879-pepe-pray.png', alt: 'Pepe Pray' },
  { code: ':pepe_heart:', url: 'https://cdn3.emoji.gg/emojis/8134-pepeheart.png', alt: 'Pepe Heart' },
  { code: ':pepe_cool:', url: 'https://cdn3.emoji.gg/emojis/3573-pepe-cool.png', alt: 'Pepe Cool' },
  { code: ':pepe_wink:', url: 'https://cdn3.emoji.gg/emojis/5318-wink.png', alt: 'Pepe Wink' },
  { code: ':pepe_fire:', url: 'https://cdn3.emoji.gg/emojis/6146-pepe-fire.png', alt: 'Pepe Fire' },
  { code: ':monkas:', url: 'https://cdn3.emoji.gg/emojis/6257-monkas.png', alt: 'MonkaS' },
  { code: ':pepe_sweat:', url: 'https://cdn3.emoji.gg/emojis/1542-pepesweat.png', alt: 'Pepe Sweat' },
];

// Peepo emojis
const PEEPO_EMOJIS: ImageEmoji[] = [
  { code: ':peepo_happy:', url: 'https://cdn3.emoji.gg/emojis/8741-peepohappy.png', alt: 'Peepo Happy' },
  { code: ':peepo_sad:', url: 'https://cdn3.emoji.gg/emojis/8521-peeposad.png', alt: 'Peepo Sad' },
  { code: ':peepo_love:', url: 'https://cdn3.emoji.gg/emojis/4621-peepolove.png', alt: 'Peepo Love' },
  { code: ':peepo_blanket:', url: 'https://cdn3.emoji.gg/emojis/3210-peepoblanket.png', alt: 'Peepo Blanket' },
  { code: ':peepo_clap:', url: 'https://cdn3.emoji.gg/emojis/8073-peepoclap.png', alt: 'Peepo Clap' },
  { code: ':peepo_hug:', url: 'https://cdn3.emoji.gg/emojis/5713-peepohug.png', alt: 'Peepo Hug' },
  { code: ':peepo_pog:', url: 'https://cdn3.emoji.gg/emojis/569450-peepopog.gif', alt: 'Peepo Pog' },
  { code: ':peepo_cry:', url: 'https://cdn3.emoji.gg/emojis/1924-peepocry.png', alt: 'Peepo Cry' },
  { code: ':peepo_angry:', url: 'https://cdn3.emoji.gg/emojis/8924-peepoangry.png', alt: 'Peepo Angry' },
  { code: ':peepo_detective:', url: 'https://cdn3.emoji.gg/emojis/2892-peepodetective.png', alt: 'Peepo Detective' },
  { code: ':peepo_coffee:', url: 'https://cdn3.emoji.gg/emojis/9120-peepocoffee.png', alt: 'Peepo Coffee' },
  { code: ':peepo_heart:', url: 'https://cdn3.emoji.gg/emojis/5842-peepoheart.png', alt: 'Peepo Heart' },
  { code: ':peepo_run:', url: 'https://cdn3.emoji.gg/emojis/3761-peeporun.gif', alt: 'Peepo Run' },
  { code: ':peepo_wave:', url: 'https://cdn3.emoji.gg/emojis/8542-peepowave.png', alt: 'Peepo Wave' },
  { code: ':peepo_cozy:', url: 'https://cdn3.emoji.gg/emojis/6312-peepocozy.png', alt: 'Peepo Cozy' },
  { code: ':peepo_yay:', url: 'https://cdn3.emoji.gg/emojis/990264-yay.gif', alt: 'Peepo Yay' },
];

// Popular meme emojis
const MEME_EMOJIS: ImageEmoji[] = [
  { code: ':kekw:', url: 'https://cdn3.emoji.gg/emojis/3540-kekw.png', alt: 'KEKW' },
  { code: ':omegalul:', url: 'https://cdn3.emoji.gg/emojis/7374-omegalul.png', alt: 'OMEGALUL' },
  { code: ':lulw:', url: 'https://cdn3.emoji.gg/emojis/2823-lulw.png', alt: 'LULW' },
  { code: ':sadge:', url: 'https://cdn3.emoji.gg/emojis/8073-sadge.png', alt: 'Sadge' },
  { code: ':copium:', url: 'https://cdn3.emoji.gg/emojis/6140-copium.png', alt: 'Copium' },
  { code: ':pepega:', url: 'https://cdn3.emoji.gg/emojis/4352-pepega.png', alt: 'Pepega' },
  { code: ':ez:', url: 'https://cdn3.emoji.gg/emojis/3102-ez.png', alt: 'EZ' },
  { code: ':pog:', url: 'https://cdn3.emoji.gg/emojis/5426-pog.png', alt: 'Pog' },
  { code: ':clown:', url: 'https://cdn3.emoji.gg/emojis/9830-clownpepe.png', alt: 'Clown' },
  { code: ':weirdchamp:', url: 'https://cdn3.emoji.gg/emojis/5850-weirdchamp.png', alt: 'WeirdChamp' },
  { code: ':catjam:', url: 'https://cdn3.emoji.gg/emojis/7135-catjam.gif', alt: 'CatJam' },
  { code: ':pepejam:', url: 'https://cdn3.emoji.gg/emojis/8145-pepejam.gif', alt: 'PepeJam' },
  { code: ':5head:', url: 'https://cdn3.emoji.gg/emojis/7318-5head.png', alt: '5Head' },
  { code: ':pepehands:', url: 'https://cdn3.emoji.gg/emojis/4813-pepehands.png', alt: 'PepeHands' },
  { code: ':based:', url: 'https://cdn3.emoji.gg/emojis/9124-based.png', alt: 'Based' },
  { code: ':gigachad:', url: 'https://cdn3.emoji.gg/emojis/6625-gigachad.png', alt: 'GigaChad' },
];

// Standard emoji reactions
const REACTION_EMOJIS: TextEmoji[] = [
  { code: ':thumbsup:', emoji: '👍' },
  { code: ':thumbsdown:', emoji: '👎' },
  { code: ':heart:', emoji: '❤️' },
  { code: ':fire:', emoji: '🔥' },
  { code: ':100:', emoji: '💯' },
  { code: ':clap:', emoji: '👏' },
  { code: ':eyes:', emoji: '👀' },
  { code: ':skull:', emoji: '💀' },
  { code: ':nerd:', emoji: '🤓' },
  { code: ':brain:', emoji: '🧠' },
  { code: ':crown:', emoji: '👑' },
  { code: ':gem:', emoji: '💎' },
  { code: ':rocket:', emoji: '🚀' },
  { code: ':star:', emoji: '⭐' },
  { code: ':pray:', emoji: '🙏' },
  { code: ':muscle:', emoji: '💪' },
  { code: ':joy:', emoji: '😂' },
  { code: ':sob:', emoji: '😭' },
  { code: ':angry:', emoji: '😠' },
  { code: ':thinking:', emoji: '🤔' },
];

// Gaming emojis
const GAMING_EMOJIS: TextEmoji[] = [
  { code: ':gg:', emoji: '🏆' },
  { code: ':controller:', emoji: '🎮' },
  { code: ':sword:', emoji: '⚔️' },
  { code: ':shield:', emoji: '🛡️' },
  { code: ':pickaxe:', emoji: '⛏️' },
  { code: ':bow:', emoji: '🏹' },
  { code: ':potion:', emoji: '🧪' },
  { code: ':diamond:', emoji: '💎' },
  { code: ':gold:', emoji: '🥇' },
  { code: ':silver:', emoji: '🥈' },
  { code: ':bronze:', emoji: '🥉' },
  { code: ':target:', emoji: '🎯' },
  { code: ':bomb:', emoji: '💣' },
  { code: ':explosion:', emoji: '💥' },
  { code: ':ghost:', emoji: '👻' },
  { code: ':zombie:', emoji: '🧟' },
  { code: ':alien:', emoji: '👾' },
  { code: ':robot:', emoji: '🤖' },
  { code: ':dice:', emoji: '🎲' },
  { code: ':joystick:', emoji: '🕹️' },
];

const EMOJI_CATEGORIES = {
  pepe: {
    name: 'Pepe',
    icon: '🐸',
    emojis: PEPE_EMOJIS as EmojiItem[],
  },
  peepo: {
    name: 'Peepo',
    icon: '🥺',
    emojis: PEEPO_EMOJIS as EmojiItem[],
  },
  memes: {
    name: 'Мемы',
    icon: '😂',
    emojis: MEME_EMOJIS as EmojiItem[],
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

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string, isImage?: boolean, imageUrl?: string) => void;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pepe');
  const pickerRef = useRef<HTMLDivElement>(null);

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

  const handleEmojiClick = (item: EmojiItem) => {
    if (isImageEmoji(item)) {
      // For image emojis, pass the image URL to be rendered
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
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 hover:bg-secondary"
      >
        <img 
          src="https://cdn3.emoji.gg/emojis/8741-peepohappy.png" 
          alt="emoji" 
          className="w-6 h-6"
        />
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
                        onClick={() => handleEmojiClick(item)}
                        className="flex items-center justify-center h-12 w-12 rounded-md hover:bg-secondary transition-colors"
                        title={item.code}
                      >
                        {isImageEmoji(item) ? (
                          <img 
                            src={item.url} 
                            alt={item.alt} 
                            className="w-8 h-8 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-2xl">{item.emoji}</span>
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

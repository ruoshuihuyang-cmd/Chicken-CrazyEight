
import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType, Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card: CardType;
  isFaceUp?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  isPlayable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  isFaceUp = true,
  onClick,
  className,
  disabled = false,
  isPlayable = false,
}) => {
  return (
    <motion.div
      layoutId={card.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={isFaceUp && !disabled && isPlayable ? { y: -20, scale: 1.05 } : {}}
      onClick={!disabled && isPlayable ? onClick : undefined}
      className={cn(
        'relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 border-zinc-200 bg-white cursor-pointer transition-shadow duration-200',
        !isFaceUp && 'bg-chicken-orange border-white',
        isPlayable && isFaceUp && 'ring-4 ring-chicken-yellow ring-opacity-50 shadow-lg',
        disabled && 'cursor-not-allowed grayscale-[0.5]',
        className
      )}
    >
      {isFaceUp ? (
        <div className="flex flex-col h-full p-1 sm:p-2 justify-between">
          <div className={cn('flex flex-col leading-none', SUIT_COLORS[card.suit])}>
            <span className="text-sm sm:text-lg font-bold font-display">{card.rank}</span>
            <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          
          <div className={cn('text-2xl sm:text-4xl self-center', SUIT_COLORS[card.suit])}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          
          <div className={cn('flex flex-col leading-none rotate-180', SUIT_COLORS[card.suit])}>
            <span className="text-sm sm:text-lg font-bold font-display">{card.rank}</span>
            <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-md">
           {/* Chicken Pattern or Logo */}
           <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">🐥</span>
           </div>
        </div>
      )}
    </motion.div>
  );
};

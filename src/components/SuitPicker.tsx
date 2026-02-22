
import React from 'react';
import { motion } from 'motion/react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

export const SuitPicker: React.FC<SuitPickerProps> = ({ onSelect }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
      >
        <h2 className="text-2xl font-bold mb-6 font-display">选择新的花色！</h2>
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-zinc-100 hover:border-chicken-yellow hover:bg-chicken-yellow/10 transition-all group"
            >
              <span className={`text-5xl mb-2 ${SUIT_COLORS[suit]} group-hover:scale-110 transition-transform`}>
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="capitalize font-medium text-zinc-600">{suit}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

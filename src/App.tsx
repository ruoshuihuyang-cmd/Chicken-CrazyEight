/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Card as CardType, Suit, GameState, Turn, GameStatus } from './types';
import { createDeck, SUIT_SYMBOLS, SUIT_COLORS } from './constants';
import { Card } from './components/Card';
import { SuitPicker } from './components/SuitPicker';
import { Trophy, RotateCcw, Play, Info, ArrowRight } from 'lucide-react';

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>('start');
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [aiHand, setAiHand] = useState<CardType[]>([]);
  const [drawPile, setDrawPile] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn>('player');
  const [activeSuit, setActiveSuit] = useState<Suit | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({ winner: null, reason: '' });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // Initialize Game
  const startGame = () => {
    const deck = createDeck();
    const pHand = deck.splice(0, 8);
    const aHand = deck.splice(0, 8);
    
    // Find a starting card that is not an 8
    let startIndex = 0;
    while (deck[startIndex]?.rank === '8') {
      startIndex++;
    }
    const firstDiscard = deck.splice(startIndex, 1)[0];

    setPlayerHand(pHand);
    setAiHand(aHand);
    setDrawPile(deck);
    setDiscardPile([firstDiscard]);
    setActiveSuit(firstDiscard.suit);
    setCurrentTurn('player');
    setGameState('playing');
    setGameStatus({ winner: null, reason: '' });
    setLastAction('游戏开始！你的回合。');
  };

  const topDiscard = discardPile[discardPile.length - 1];

  // Check if a card is playable
  const isCardPlayable = useCallback((card: CardType) => {
    if (!topDiscard) return false;
    if (card.rank === '8') return true;
    return card.suit === activeSuit || card.rank === topDiscard.rank;
  }, [topDiscard, activeSuit]);

  // Handle Player Move
  const handleCardClick = (card: CardType) => {
    if (currentTurn !== 'player' || gameState !== 'playing') return;
    if (!isCardPlayable(card)) return;

    playCard(card, 'player');
  };

  const playCard = (card: CardType, turn: Turn) => {
    const isEight = card.rank === '8';
    
    if (turn === 'player') {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setAiHand(prev => prev.filter(c => c.id !== card.id));
    }

    setDiscardPile(prev => [...prev, card]);
    setActiveSuit(card.suit);
    setLastAction(`${turn === 'player' ? '你' : '小鸡'} 打出了 ${card.rank}${SUIT_SYMBOLS[card.suit]}`);

    if (isEight) {
      if (turn === 'player') {
        setGameState('suit_selection');
      } else {
        // AI picks a suit (simple logic: pick the suit it has most of)
        const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
        aiHand.forEach(c => { if(c.id !== card.id) suitCounts[c.suit]++ });
        const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
        setActiveSuit(bestSuit);
        setLastAction(`小鸡打出了 8！将花色改为 ${SUIT_SYMBOLS[bestSuit]}`);
        endTurn('ai');
      }
    } else {
      endTurn(turn);
    }
  };

  const endTurn = (current: Turn) => {
    // Check for win
    if (current === 'player' && playerHand.length === 1) { // 1 because state hasn't updated yet in the closure
       handleWin('player');
       return;
    }
    if (current === 'ai' && aiHand.length === 1) {
       handleWin('ai');
       return;
    }

    setCurrentTurn(current === 'player' ? 'ai' : 'player');
  };

  const handleWin = (winner: Turn) => {
    setGameState('game_over');
    setGameStatus({ 
      winner, 
      reason: winner === 'player' ? '太棒了！你赢了！' : '哎呀，小鸡赢了。再试一次吧！' 
    });
    if (winner === 'player') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD93D', '#FF8400', '#E94560']
      });
    }
  };

  const drawCard = (turn: Turn) => {
    if (drawPile.length === 0) {
      setLastAction('摸牌堆已空！跳过回合。');
      endTurn(turn);
      return;
    }

    const newDrawPile = [...drawPile];
    const card = newDrawPile.pop()!;
    setDrawPile(newDrawPile);

    if (turn === 'player') {
      setPlayerHand(prev => [...prev, card]);
      setLastAction('你摸了一张牌。');
      // In Crazy Eights, usually you draw and then your turn ends if you can't play it
      // or some rules say you keep drawing until you can play. 
      // Let's go with: draw one, if playable you can play it, otherwise end turn.
      // To keep it simple: draw one and end turn.
      setCurrentTurn('ai');
    } else {
      setAiHand(prev => [...prev, card]);
      setLastAction('小鸡摸了一张牌。');
      setCurrentTurn('player');
    }
  };

  // AI Logic
  useEffect(() => {
    if (currentTurn === 'ai' && gameState === 'playing' && !isAiThinking) {
      setIsAiThinking(true);
      
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(isCardPlayable);
        
        if (playableCards.length > 0) {
          // AI strategy: play non-8s first, then 8s
          const nonEights = playableCards.filter(c => c.rank !== '8');
          const cardToPlay = nonEights.length > 0 
            ? nonEights[Math.floor(Math.random() * nonEights.length)]
            : playableCards[0];
          
          playCard(cardToPlay, 'ai');
        } else {
          drawCard('ai');
        }
        
        setIsAiThinking(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameState, aiHand, isCardPlayable]);

  const handleSuitSelect = (suit: Suit) => {
    setActiveSuit(suit);
    setGameState('playing');
    setLastAction(`你将花色改为 ${SUIT_SYMBOLS[suit]}`);
    endTurn('player');
  };

  // Render Helpers
  if (gameState === 'start') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-chicken-yellow p-6">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🐥</div>
          <h1 className="text-6xl font-black text-chicken-red mb-2 font-display tracking-tight">
            鸡子疯狂 8 点
          </h1>
          <p className="text-xl text-chicken-orange font-bold mb-12">Crazy Eights: Chicken Edition</p>
          
          <div className="space-y-4 max-w-md mx-auto bg-white/50 p-8 rounded-3xl backdrop-blur-sm mb-12 text-left">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Info className="w-5 h-5" /> 游戏规则：
            </h3>
            <ul className="text-zinc-700 space-y-2">
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 mt-1 shrink-0 text-chicken-orange" /> 匹配弃牌堆顶牌的<b>花色</b>或<b>点数</b>。</li>
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 mt-1 shrink-0 text-chicken-orange" /> <b>数字 8</b> 是万能牌，可以随时打出并改变花色。</li>
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 mt-1 shrink-0 text-chicken-orange" /> 无牌可出时必须<b>摸一张牌</b>。</li>
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 mt-1 shrink-0 text-chicken-orange" /> 最先清空手牌的一方获胜！</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="bg-chicken-red text-white px-12 py-5 rounded-full text-2xl font-bold shadow-xl hover:bg-red-600 transition-colors flex items-center gap-3 mx-auto"
          >
            <Play className="fill-current" /> 开始游戏
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full felt-bg flex flex-col overflow-hidden relative">
      {/* Header / Status */}
      <div className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md text-white z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 px-4 py-1 rounded-full text-sm font-medium border border-white/20">
            {lastAction}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <span className="text-sm opacity-70">当前花色:</span>
             <span className={cn("text-2xl font-bold", activeSuit ? SUIT_COLORS[activeSuit] : "text-white")}>
               {activeSuit ? SUIT_SYMBOLS[activeSuit] : '-'}
             </span>
          </div>
          <button 
            onClick={() => setGameState('start')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col justify-between p-4 relative">
        
        {/* AI Hand */}
        <div className="flex justify-center h-32">
          <div className="flex -space-x-12 sm:-space-x-16 hover:space-x-2 transition-all duration-300">
            {aiHand.map((card, i) => (
              <Card 
                key={card.id} 
                card={card} 
                isFaceUp={false} 
                className="rotate-180"
              />
            ))}
          </div>
        </div>

        {/* Center Piles */}
        <div className="flex-1 flex items-center justify-center gap-8 sm:gap-16">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-white/5 rounded-xl blur-lg group-hover:bg-white/10 transition-colors"></div>
            <div 
              onClick={() => currentTurn === 'player' && drawCard('player')}
              className={cn(
                "relative cursor-pointer transition-transform active:scale-95",
                currentTurn === 'player' ? "hover:-translate-y-1" : "opacity-80 cursor-not-allowed"
              )}
            >
              <Card 
                card={{ id: 'back', suit: 'hearts', rank: 'A' }} 
                isFaceUp={false} 
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs font-bold whitespace-nowrap">
                摸牌堆 ({drawPile.length})
              </div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {discardPile.slice(-3).map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ x: -100, y: -50, opacity: 0, rotate: -20 }}
                  animate={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1, 
                    rotate: (i - 1) * 5,
                    zIndex: i 
                  }}
                  className="absolute top-0 left-0"
                  style={{ transform: `translate(-50%, -50%)` }}
                >
                  <Card card={card} isFaceUp={true} disabled={true} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="w-20 h-28 sm:w-24 sm:h-36 border-2 border-dashed border-white/20 rounded-lg"></div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs font-bold whitespace-nowrap">
              弃牌堆
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "px-6 py-2 rounded-full text-sm font-bold transition-all",
            currentTurn === 'player' ? "bg-chicken-yellow text-zinc-900 shadow-lg scale-110" : "bg-white/10 text-white/50"
          )}>
            {currentTurn === 'player' ? "你的回合" : "小鸡正在思考..."}
          </div>
          
          <div className="flex justify-center h-40 sm:h-48 w-full max-w-5xl overflow-x-auto no-scrollbar pb-4">
            <div className="flex -space-x-8 sm:-space-x-12 px-12">
              {playerHand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  isFaceUp={true}
                  isPlayable={currentTurn === 'player' && isCardPlayable(card)}
                  onClick={() => handleCardClick(card)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState === 'suit_selection' && (
          <SuitPicker onSelect={handleSuitSelect} />
        )}

        {gameState === 'game_over' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-0 w-full h-2 bg-chicken-red"></div>
              
              <div className="text-7xl mb-6">
                {gameStatus.winner === 'player' ? '🏆' : '🐥'}
              </div>
              
              <h2 className="text-4xl font-black mb-4 font-display text-zinc-900">
                {gameStatus.winner === 'player' ? '大获全胜！' : '下次努力！'}
              </h2>
              
              <p className="text-xl text-zinc-600 mb-10 font-medium">
                {gameStatus.reason}
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="w-full bg-chicken-red text-white py-5 rounded-2xl text-xl font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-6 h-6" /> 再玩一局
              </motion.button>
              
              <button 
                onClick={() => setGameState('start')}
                className="mt-6 text-zinc-400 font-bold hover:text-zinc-600 transition-colors"
              >
                返回主菜单
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

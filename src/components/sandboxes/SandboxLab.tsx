import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EFFECTS = [
  { name: 'Золотое тиснение', key: 'gold' },
  { name: 'Голография', key: 'holo' },
  { name: 'Тиснёный лён', key: 'linen' },
  { name: 'Мрамор', key: 'marble' },
];

const SandboxLab: React.FC = () => {
  const [activeEffect, setActiveEffect] = useState('gold');
  const [rotation, setRotation] = useState(0);

  const getEffectStyle = (): React.CSSProperties => {
    switch (activeEffect) {
      case 'gold':
        return {
          background: 'linear-gradient(135deg, #C4A662 0%, #E8D48B 30%, #8B6914 60%, #D4AF37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        };
      case 'holo':
        return {
          background: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #ff6b6b)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'gradientShift 3s ease infinite',
        };
      case 'linen':
        return {
          color: '#E8D9C0',
          textShadow: '0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.2)',
        };
      case 'marble':
        return {
          color: '#F0EDE8',
          textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.3)',
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#1A1C1E] gap-8">
      <motion.div
        className="w-[280px] rounded-[32px] flex flex-col items-center justify-center gap-6 p-10"
        style={{
          aspectRatio: '3 / 7',
          maxHeight: 'min(520px, 75vh)',
          background: activeEffect === 'marble'
            ? 'linear-gradient(175deg, #1A1C1E 0%, #2A2D31 100%)'
            : 'linear-gradient(175deg, #E8D9C0 0%, #E8D9C0dd 100%)',
          boxShadow: '18px 28px 50px -8px rgba(0,0,0,0.7)',
        }}
        animate={{ rotateY: rotation }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}>
        
        <h2
          className="text-3xl font-bold text-center leading-tight"
          style={getEffectStyle()}>
          Tactile<br />Typography
        </h2>

        <div
          className="w-16 h-16 rounded-full"
          style={{
            background: activeEffect === 'holo'
              ? 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)'
              : 'linear-gradient(135deg, #D4AF37, #E8D48B)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.3)',
          }}
        />
      </motion.div>

      {/* Контролы */}
      <div className="flex gap-2 flex-wrap justify-center max-w-[320px]">
        {EFFECTS.map((effect) => (
          <button
            key={effect.key}
            onClick={() => setActiveEffect(effect.key)}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeEffect === effect.key
                ? 'bg-[#C4B998] text-[#16181A]'
                : 'bg-[#2A2D31] text-[#8A8A8A]'
            }`}>
            {effect.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => setRotation(rotation + 180)}
        className="px-4 py-2 rounded-xl bg-[#2A2D31] text-[#8A8A8A] text-xs font-mono active:scale-95 transition-transform">
        🔄 Повернуть
      </button>
    </div>
  );
};

export default SandboxLab;
import React, { useState } from 'react';
import './EmojiPicker.css';

// 常用 Emoji 分类
const emojiCategories = {
  表情: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '🤔', '😎', '🤩', '😏', '😅', '😢', '😭', '😤', '😠', '🤯', '😱', '🥺', '👍', '👎', '👏', '🙏', '💪', '✌️', '🤝', '👋'],
  动物: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🐝', '🐛', '🦋', '🐌', '🐞'],
  食物: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥑', '🍔', '🍕', '🍟', '🌭', '🍿', '🍦', '🍩', '🍪', '☕', '🍺', '🍷', '🥤'],
  活动: ['⚽', '🏀', '🏈', '🎾', '🎱', '🏓', '🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎹', '🎸', '🎺', '🎻', '🥁'],
  物品: ['💻', '📱', '⌨️', '💾', '📷', '📹', '🔦', '💡', '📖', '📚', '✏️', '📝', '📁', '📋', '📌', '🔒', '🔑', '💰', '💳', '✉️', '📦', '🎁', '🏆', '🎖️'],
  符号: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💯', '✅', '❌', '⭐', '🌟', '💫', '⚡', '🔥', '💢', '💥', '❓', '❗', '💤', '🎵', '🎶', '➕', '➖', '✨'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>('表情');

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
  };

  return (
    <div className="emoji-picker-container">
      {/* 分类标签 */}
      <div className="emoji-picker-tabs">
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            className={`emoji-picker-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category as keyof typeof emojiCategories)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji 网格 */}
      <div className="emoji-picker-grid">
        {emojiCategories[activeCategory].map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            className="emoji-picker-item"
            onClick={() => handleEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;

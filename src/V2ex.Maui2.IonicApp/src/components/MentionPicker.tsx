import React, { useState, useMemo } from 'react';
import { IonSearchbar, IonAvatar, IonImg } from '@ionic/react';
import './MentionPicker.css';

export interface ReplyItem {
  floor: number;
  username: string;
  avatar?: string;
  contentPreview?: string;
}

interface MentionPickerProps {
  replies: ReplyItem[];
  onSelect: (username: string, floor: number) => void;
  onClose: () => void;
}

const MentionPicker: React.FC<MentionPickerProps> = ({ replies, onSelect, onClose }) => {
  const [searchText, setSearchText] = useState('');

  // 过滤回复
  const filteredReplies = useMemo(() => {
    if (!searchText.trim()) return replies;
    const query = searchText.toLowerCase();
    return replies.filter(
      (reply) =>
        reply.username.toLowerCase().includes(query) ||
        reply.contentPreview?.toLowerCase().includes(query) ||
        reply.floor.toString().includes(query)
    );
  }, [replies, searchText]);

  const handleSelect = (reply: ReplyItem) => {
    onSelect(reply.username, reply.floor);
  };

  return (
    <div className="mention-picker-container">
      {/* 搜索框 */}
      <div className="mention-picker-header">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value ?? '')}
          placeholder="搜索用户或楼层..."
          debounce={100}
          className="mention-searchbar"
        />
      </div>

      {/* 回复列表 */}
      <div className="mention-picker-list">
        {filteredReplies.length === 0 ? (
          <div className="mention-picker-empty">
            暂无回复
          </div>
        ) : (
          filteredReplies.map((reply) => (
            <div
              key={reply.floor}
              className="mention-picker-item"
              onClick={() => handleSelect(reply)}
            >
              <IonAvatar className="mention-avatar">
                <IonImg
                  src={reply.avatar || 'https://cdn.v2ex.com/gravatar/default?s=64'}
                  alt={reply.username}
                />
              </IonAvatar>
              <div className="mention-info">
                <div className="mention-username">
                  <span className="mention-name">{reply.username}</span>
                  <span className="mention-floor">#{reply.floor}</span>
                </div>
                {reply.contentPreview && (
                  <div className="mention-preview">{reply.contentPreview}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MentionPicker;

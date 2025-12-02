import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot } from 'lucide-react';
import type { ChatMessage, AICompanion } from '@/types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  companion?: AICompanion;
  isLoading?: boolean;
  placeholder?: string;
}

// 简单的打字机组件
const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');
    
    const intervalId = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(indexRef.current));
        indexRef.current++;
      } else {
        clearInterval(intervalId);
        onComplete?.();
      }
    }, 30); // 打字速度

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  // 简单渲染换行和加粗
  return (
    <div className="whitespace-pre-wrap">
      {displayedText.split('\n').map((line, i) => (
        <div key={i} className="min-h-[1.2em]">
          {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </div>
      ))}
    </div>
  );
};

// 解析并渲染消息内容，包括选项按钮
const MessageContent = ({ 
  content, 
  isLatest, 
  role, 
  onActionClick 
}: { 
  content: string; 
  isLatest: boolean; 
  role: 'user' | 'assistant';
  onActionClick?: (action: string) => void;
}) => {
  const [showActions, setShowActions] = useState(!isLatest);
  
  // 提取选项：查找以 • 开头的行
  const actions = content.split('\n')
    .filter(line => line.trim().startsWith('•'))
    .map(line => line.trim().substring(1).trim());

  // 过滤掉选项后的文本内容用于显示
  const displayContent = isLatest 
    ? content 
    : content; // 历史消息显示完整内容

  return (
    <div className="space-y-3">
      {isLatest && role === 'assistant' ? (
        <TypewriterText 
          text={displayContent} 
          onComplete={() => setShowActions(true)} 
        />
      ) : (
        <div className="whitespace-pre-wrap">
          {displayContent.split('\n').map((line, i) => (
            <div key={i} className="min-h-[1.2em]">
               {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                )
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 显示快捷操作按钮 */}
      {showActions && actions.length > 0 && role === 'assistant' && onActionClick && (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/10">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onActionClick(action)}
              className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-full transition-colors text-left"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export function ChatInterface({
  messages,
  onSendMessage,
  companion,
  isLoading = false,
  placeholder = '输入消息...',
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]); // isLoading 变化时也滚动，确保看到 Loading 状态

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleActionClick = (action: string) => {
    if (!isLoading) {
      onSendMessage(action);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <Bot className="w-12 h-12 mb-2" />
            <p>开始你的冒险之旅吧...</p>
          </div>
        )}
        
        {messages.map((message, index) => {
          const isLatest = index === messages.length - 1;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* 头像 */}
              <div className="flex-shrink-0 mt-1">
                {message.role === 'assistant' ? (
                  companion?.avatar_url ? (
                    <img
                      src={companion.avatar_url}
                      alt={companion.name}
                      className="w-8 h-8 rounded-full object-cover border border-border shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* 消息气泡 */}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card border rounded-tl-none'
                }`}
              >
                {message.role === 'assistant' && companion && (
                  <div className="flex items-center gap-2 mb-1 opacity-50">
                    <span className="text-xs font-medium">{companion.name}</span>
                  </div>
                )}
                
                <div className="text-sm leading-relaxed">
                  <MessageContent 
                    content={message.content} 
                    isLatest={isLatest} 
                    role={message.role as 'user' | 'assistant'}
                    onActionClick={handleActionClick}
                  />
                </div>
                
                <span className={`text-[10px] mt-1 block ${
                  message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              {companion?.avatar_url ? (
                <img
                  src={companion.avatar_url}
                  alt={companion.name}
                  className="w-8 h-8 rounded-full object-cover border border-border opacity-70"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
            <Card className="px-4 py-3 bg-card/50 border-none shadow-none">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground animate-pulse">
                  {companion?.name || 'AI'} 正在思考...
                </span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background/80 backdrop-blur-md border-t">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="gradient-bg-primary border-0 shadow-md hover:shadow-lg transition-all px-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

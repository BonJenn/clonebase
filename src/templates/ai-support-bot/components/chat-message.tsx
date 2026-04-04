'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-md'
          : 'bg-gray-100 text-gray-900 rounded-bl-md'
      }`}>
        {!isUser && (
          <div className="mb-1 flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-[10px] text-indigo-600 font-bold">AI</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Support Bot</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        {timestamp && (
          <p className={`mt-1 text-[10px] ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

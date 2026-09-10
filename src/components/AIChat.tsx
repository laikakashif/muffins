import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Sparkles, X, CornerDownLeft, Coffee, Trash2 } from 'lucide-react';
import { CartItem } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  currentCart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMenu: () => void;
  theme?: 'classic' | 'velvet' | 'pistachio' | 'espresso';
}

const getThemeSuggestions = (theme: string) => {
  switch (theme) {
    case 'velvet':
      return [
        'Recommend Gourmet Rose Velvet cake',
        'Specialities draped in plum or rose gold',
        'Traditional sweets with berry garnish',
        'How do I pay via Faysal Bank?',
        'Where do I send complaints?'
      ];
    case 'pistachio':
      return [
        'Recommend organic Pistachio Mint cupcakes',
        'Green tea or Matcha roll matching bakes',
        'Traditional sweets with pistachio & almond',
        'What savory snacks go well with tea?',
        'Where do I send complaints?'
      ];
    case 'espresso':
      return [
        'Best espresso pastries & chocolate cakes',
        'Cappuccino macarons & Tiramisu cups',
        'Coffee pairings with rich roasted bakes',
        'How do I pay via Faysal Bank?',
        'Where do I send complaints?'
      ];
    case 'classic':
    default:
      return [
        'Recommend the best chocolate cake',
        'Traditional sweets for gifting',
        'How do I pay via Faysal Bank?',
        'What savory snacks go well with tea?',
        'Where do I send complaints?'
      ];
  }
};

const getWelcomeMessage = (theme: string) => {
  switch (theme) {
    case 'velvet':
      return "A majestic welcome to our **Royal Velvet Lounge** (پتاشے)! 🍇 I am your devoted **Sweet Butler**, serving you under our royal plum and rose gold canopy. Ask me about our exquisite **Rose Velvet Cakes**, signature **French Macarons**, and custom gourmet celebrations. What sweet cravings or savory needs can I satisfy today?";
    case 'pistachio':
      return "A peaceful, organic welcome to **Pistachio Mint Harmony** (پتاشے)! 🍃 I am your devoted **Sweet Butler**. Experience the serene herbal freshness of our low-sweetness bakes, garden **Matcha Rolls**, and delicious **Mint-topped Cupcakes**. What refreshing confectionery or savory delicacies may I prepare for you today?";
    case 'espresso':
      return "Step into our cozy **Midnight Espresso Sanctuary** (پتاشے)! ☕ I am your devoted **Sweet Butler**. Surrounded by rich dark roast aromas, deep cocoa truffles, and caramelized bakes, I am here to guide your coffee pairings. What rich Tiramisu, fudge cakes, or savory cookies can I serve you today?";
    case 'classic':
    default:
      return "A very warm welcome to **Muffinns Sweets & Bakers** (پتاشے)! 🌸 I am your devoted **Sweet Butler**, here to guide you through our legendary classic confectionery menu, recommend cakes for your celebrations, or help customize your pastries. What sweet cravings or savory needs can I satisfy for you today?";
  }
};

export default function AIChat({ currentCart, isOpen, onClose, onNavigateToMenu, theme = 'classic' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and update the welcome message dynamically when the theme changes (if no user interaction yet)
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [
          {
            id: 'welcome',
            role: 'assistant',
            content: getWelcomeMessage(theme),
            timestamp: new Date()
          }
        ];
      }
      return prev;
    });
  }, [theme]);

  useEffect(() => {
    // Auto scroll to latest message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Append User Message
    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Map existing messages to clean payload format (Express expects message contents)
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          currentCart: currentCart
        })
      });

      const data = await res.json();
      
      const butlerReply = data.reply || "I apologize, my warm confectionery oven has distracted me for a moment. Could you please repeat that?";
      
      setMessages(prev => [...prev, {
        id: `butler-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: butlerReply,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: "Oh dear, our tea kettle is boiling over! Connection is currently slightly delayed, but please rest assured that Muffinns has the finest **Fudge Cakes** and **Badaam Burfis** waiting for you. Let's try again in a moment!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Welcome back! 🌸 I am your **Sweet Butler**. How may I guide you through Muffinns' gourmet selection today?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-chat-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-brand-chocolate/30 backdrop-blur-xs z-40 md:hidden cursor-pointer"
        />
      )}
      {isOpen && (
        <motion.div
          key="ai-chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22 }}
            className="fixed right-4 bottom-4 top-20 md:top-auto md:h-[620px] w-[calc(100vw-32px)] md:w-[420px] rounded-2xl bg-white shadow-2xl z-40 border border-amber-900/20 flex flex-col justify-between overflow-hidden"
          >
            {/* Header Block */}
            <div className="p-4 bg-[#2D160A] text-[#FAF5EE] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center relative">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#2D160A]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm tracking-wide text-white">Muffinns Sweet Butler</h4>
                  <p className="text-[10px] text-amber-300 font-medium uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    AI Concierge Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {messages.length > 1 && (
                  <button
                    onClick={handleClearHistory}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-amber-100/70 hover:text-red-300 transition-colors cursor-pointer"
                    title="Clear Chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-amber-100/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#FAF6F0] no-scrollbar text-[#2D160A]">
              
              {messages.map((msg, msgIdx) => {
                const isButler = msg.role === 'assistant';
                return (
                  <div
                    key={`chat-msg-${msg.id || 'msg'}-${msgIdx}`}
                    className={`flex gap-2 max-w-[85%] ${isButler ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* Tiny avatar indicator */}
                    {isButler && (
                      <div className="w-7 h-7 rounded-full bg-amber-900 text-white border border-amber-900/20 flex items-center justify-center shrink-0 self-start text-xs font-serif font-black shadow-xs">
                        B
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {/* Message Balloon */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs border ${
                          isButler
                            ? 'bg-white rounded-tl-xs border-amber-200/80 text-slate-900 font-medium'
                            : 'bg-amber-800 text-white rounded-tr-xs border-amber-900/30 font-medium'
                        }`}
                      >
                        {/* Rendering rich styling cleanly in inline Markdown replacement */}
                        <div className="whitespace-pre-wrap space-y-2">
                          {msg.content.split('\n').map((line, lIdx) => {
                            // Bold conversion **text**
                            let formattedLine = line;
                            const boldRegex = /\*\*(.*?)\*\*/g;
                            const parts = [];
                            let lastIdx = 0;
                            let match;
                            
                            let partCounter = 0;
                            while ((match = boldRegex.exec(line)) !== null) {
                              const before = line.substring(lastIdx, match.index);
                              if (before) parts.push(<span key={`txt-${msg.id || 'msg'}-${msgIdx}-${lIdx}-${partCounter++}`}>{before}</span>);
                              parts.push(
                                <strong
                                  key={`bold-${msg.id || 'msg'}-${msgIdx}-${lIdx}-${partCounter++}`}
                                  className={isButler ? "text-amber-900 font-black bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block my-0.5" : "text-amber-200 font-black bg-black/20 px-1.5 py-0.5 rounded inline-block my-0.5"}
                                >
                                  {match[1]}
                                </strong>
                              );
                              lastIdx = boldRegex.lastIndex;
                            }
                            
                            const after = line.substring(lastIdx);
                            if (after) parts.push(<span key={`txt-${msg.id || 'msg'}-${msgIdx}-${lIdx}-${partCounter++}`}>{after}</span>);
                            
                            return (
                              <p key={`line-${msg.id || 'msg'}-${msgIdx}-${lIdx}`} className={isButler ? "text-slate-900" : "text-white"}>
                                {parts.length > 0 ? parts : line}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      <p className={`text-[9px] font-semibold ${isButler ? 'text-slate-500 text-left pl-1' : 'text-amber-800 text-right pr-1'}`}>
                        {msg.timestamp.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Loader Typing indicator */}
              {isLoading && (
                <div className="flex gap-2 max-w-[80%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-full bg-amber-900 text-white border border-amber-900/20 flex items-center justify-center shrink-0 text-xs font-serif font-black shadow-xs">
                    B
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-amber-200/80 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] font-bold text-slate-700 ml-1">Butler is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips Box */}
            {messages.length === 1 && (
              <div className="p-3 bg-amber-100/60 border-t border-amber-200/60 space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-black text-amber-950 px-1">Common Butler Questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {getThemeSuggestions(theme).map((s, sIdx) => (
                    <button
                      key={`sug-${s}-${sIdx}`}
                      onClick={() => handleSendMessage(s)}
                      className="text-[11px] font-bold bg-white hover:bg-amber-800 hover:text-white px-3 py-1.5 rounded-full border border-amber-300 text-amber-950 cursor-pointer shadow-2xs transition-all active:scale-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Input Form */}
            <div className="p-3.5 bg-[#FAF5EE] border-t border-amber-200/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask our Sweet Butler anything..."
                  className="flex-grow bg-white px-4 py-2.5 rounded-xl text-xs font-medium border border-amber-300/80 focus:outline-none focus:ring-2 focus:ring-amber-600 text-slate-900 placeholder-slate-400 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-amber-800/40 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </motion.div>
      )}
    </AnimatePresence>
  );
}

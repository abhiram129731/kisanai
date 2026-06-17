import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Mic, Volume2, Sparkles, AlertCircle, 
  Trash2, Plus, Search, Bookmark, ChevronRight, FileText,
  MapPin, CloudSun, Calendar, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';

const VOICE_COMMAND_RESPONSES: Record<string, Record<string, string>> = {
  en: {
    weather: "Opening weather monitoring.",
    disease: "Opening crop disease scanner.",
    farms: "Opening your farms list."
  },
  te: {
    weather: "వాతావరణ పర్యవేక్షణను తెరుస్తున్నాను.",
    disease: "పంట తెగుళ్ల స్కానర్‌ను తెరుస్తున్నాను.",
    farms: "మీ పొలాల జాబితాను తెరుస్తున్నాను."
  },
  hi: {
    weather: "मौसम की जानकारी खोल रहा हूँ।",
    disease: "फसल रोग स्कैनर खोल रहा हूँ।",
    farms: "आपके खेतों की सूची खोल रहा हूँ।"
  },
  ta: {
    weather: "வானிலை தகவலைத் திறக்கிறேன்.",
    disease: "பயிர் நோய் கண்டறிதலைத் திறக்கிறேன்.",
    farms: "உங்கள் பண்ணைகள் பட்டியலைத் திறக்கிறேன்."
  },
  kn: {
    weather: "ಹವಾಮಾನ ಮಾಹಿತಿಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.",
    disease: "ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಹಚ್ಚುವಿಕೆಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.",
    farms: "ನಿಮ್ಮ ಜಮೀನುಗಳ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ."
  },
  mr: {
    weather: "हवामान माहिती उघडत आहे.",
    disease: "पीक रोग निदान उघडत आहे.",
    farms: "तुमच्या शेतांची यादी उघडत आहे."
  },
  gu: {
    weather: "હવામાન મોનિટરિંગ ખોલી રહ્યું છે.",
    disease: "પાક રોગ સ્કેનર ખોલી રહ્યું છે.",
    farms: "તમારા ખેતરોની સૂચિ ખોલી રહ્યું છે."
  },
  bn: {
    weather: "আবহাওয়া পর্যবেক্ষণ খোলা হচ্ছে।",
    disease: "ফসল রোগ স্ক্যানার খোলা হচ্ছে।",
    farms: "আপনার খামারের তালিকা খোলা হচ্ছে।"
  },
  pa: {
    weather: "ਮੌਸਮ ਦੀ ਨਿਗਰਾਨੀ ਖੋਲ੍ਹ ਰਿਹਾ ਹੈ।",
    disease: "ਫ਼ਸਲ ਦੀ ਬੀਮਾਰੀ ਦਾ ਸਕੈਨਰ ਖੋਲ੍ਹ ਰਿਹਾ ਹੈ।",
    farms: "ਤੁਹਾਡੇ ਖੇਤਾਂ ਦੀ ਸੂਚੀ ਖੋਲ੍ਹ ਰਿਹਾ ਹੈ।"
  },
  ml: {
    weather: "കാലാവസ്ഥാ നിരീക്ഷണം തുറക്കുന്നു.",
    disease: "വിള രോഗ സ്കാനർ തുറക്കുന്നു.",
    farms: "നിങ്ങളുടെ ഫാമുകളുടെ ലിസ്റ്റ് തുറക്കുന്നു."
  }
};

interface ChatMessage {
  _id?: string;
  id?: string;
  sender: 'user' | 'bot';
  text: string;
  date: string;
}

interface Conversation {
  _id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface SavedRecommendation {
  _id: string;
  type: 'irrigation' | 'spray' | 'harvest' | 'general';
  recommendation: string;
  date: string;
}

export const AICopilot: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Core lists state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  
  // Interface states
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  
  // Voice states
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [autoVoiceReplies, setAutoVoiceReplies] = useState(false);

  // Alexa Voice assistant states
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [continuousVoice, setContinuousVoice] = useState(false);
  const [voiceChatHistory, setVoiceChatHistory] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const voiceScrollRef = useRef<HTMLDivElement | null>(null);
  const assistantRecognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (voiceScrollRef.current) {
      voiceScrollRef.current.scrollTop = voiceScrollRef.current.scrollHeight;
    }
  }, [voiceChatHistory, voiceStatus]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState(false);

  const quickPrompts = [
    'Which crop should I grow in Telangana soils?',
    'Best fertilizer ratio for cotton crop?',
    'Why are my cotton leaves turning yellow?',
    'How much irrigation does Paddy require?'
  ];

  // Load chats & advisories on mount
  const fetchConversationsList = async () => {
    try {
      const list = await api.chat.getConversations();
      setConversations(list || []);
      return list || [];
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchSavedRecommendationsList = async () => {
    try {
      const list = await api.chat.getSavedRecommendations();
      setSavedRecommendations(list || []);
    } catch (err) {
      console.error('Failed to load saved advisories:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const list = await fetchConversationsList();
      await fetchSavedRecommendationsList();

      // Check if redirected with a query from crop scanner or dashboard
      const stateVal = location.state as { query?: string };
      if (stateVal?.query) {
        let activeId = '';
        if (list.length > 0) {
          activeId = list[0]._id;
          setActiveConversationId(list[0]._id);
        } else {
          try {
            const newConv = await api.chat.createConversation('Agricultural Query');
            setConversations([newConv]);
            activeId = newConv._id;
            setActiveConversationId(newConv._id);
          } catch (err) {
            console.error('Failed to initialize first chat session:', err);
          }
        }
        if (activeId) {
          handleSendPrompt(stateVal.query, activeId);
          // Clear routing history state parameter so it doesn't resend on reload
          window.history.replaceState({}, document.title);
        }
      } else if (list.length > 0) {
        setActiveConversationId(list[0]._id);
      }
    };
    init();
  }, []);

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (activeConversationId) {
      const loadMessages = async () => {
        setLoading(true);
        try {
          const conv = await api.chat.getConversation(activeConversationId);
          setMessages(conv.messages || []);
        } catch (err) {
          console.error('Failed to load messages:', err);
        } finally {
          setLoading(false);
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getLanguageLocale = (lang: string) => {
    switch (lang) {
      case 'te': return 'te-IN';
      case 'hi': return 'hi-IN';
      case 'ta': return 'ta-IN';
      case 'kn': return 'kn-IN';
      case 'mr': return 'mr-IN';
      case 'gu': return 'gu-IN';
      case 'bn': return 'bn-IN';
      case 'pa': return 'pa-IN';
      case 'ml': return 'ml-IN';
      default: return 'en-IN';
    }
  };

  // Text-To-Speech
  const handleSpeak = (text: string, msgId: string) => {
    if ('speechSynthesis' in window) {
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageLocale(language);

      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Create New Chat
  const handleCreateNewChat = async () => {
    try {
      const newConv = await api.chat.createConversation('New Chat Session');
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv._id);
      setSearchQuery('');
      setSearchMode(false);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Delete Chat
  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      await api.chat.deleteConversation(id);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(c => c._id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0]._id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // Send prompt (supporting both target conversation or default)
  const handleSendPrompt = async (promptText: string, targetIdOverride?: string) => {
    if (!promptText.trim()) return;

    let targetConvId = targetIdOverride || activeConversationId;
    
    // If no active session, spin up a new chat session first
    if (!targetConvId) {
      try {
        const newConv = await api.chat.createConversation('New Chat');
        setConversations(prev => [newConv, ...prev]);
        targetConvId = newConv._id;
        setActiveConversationId(newConv._id);
      } catch (err) {
        console.error('Failed to create chat session on send:', err);
        return;
      }
    }

    // Append user message immediately for responsiveness
    const tempUserMsg: ChatMessage = {
      id: 'temp-usr-' + Date.now(),
      sender: 'user',
      text: promptText,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputText('');
    setLoading(true);

    try {
      const data = await api.chat.sendMessage(targetConvId!, promptText, language);
      setMessages(data.conversation.messages || []);
      
      // Update conversations list metadata (title updates automatically on backend)
      setConversations(prev => prev.map(c => c._id === targetConvId ? data.conversation : c));
      
      if (autoVoiceReplies && data.botMessage) {
        handleSpeak(data.botMessage.text, data.botMessage._id || 'bot-new');
      }
    } catch (err: any) {
      console.error(err);
      const errBotMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: `⚠️ KisanAI Connection Error: ${err.message || 'Failed to communicate with AI model.'}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errBotMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Search logs
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    setSearchMode(true);
    try {
      const results = await api.chat.search(val);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Failed searching chat logs:', err);
    }
  };

  // Save Advisory
  const handleSaveRecommendation = async (recText: string) => {
    let type: 'irrigation' | 'spray' | 'harvest' | 'general' = 'general';
    const lower = recText.toLowerCase();
    
    if (lower.includes('water') || lower.includes('irrigation') || lower.includes('నీరు') || lower.includes('सिंचाई')) {
      type = 'irrigation';
    } else if (lower.includes('spray') || lower.includes('chemical') || lower.includes('fungicide') || lower.includes('ఎరువు') || lower.includes('छिड़काव')) {
      type = 'spray';
    } else if (lower.includes('harvest') || lower.includes('yield') || lower.includes('కోత') || lower.includes('कटाई')) {
      type = 'harvest';
    }

    try {
      await api.chat.saveRecommendation({
        type,
        recommendation: recText
      });
      alert('Agronomical advisory bookmarked to your account database successfully!');
      fetchSavedRecommendationsList();
    } catch (err: any) {
      alert(`Failed to save advisory: ${err.message || err}`);
    }
  };

  // Delete saved recommendation
  const handleDeleteSavedRecommendation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this saved advisory?')) return;
    try {
      await api.chat.deleteRecommendation(id);
      fetchSavedRecommendationsList();
    } catch (err) {
      console.error('Failed to remove recommendation:', err);
    }
  };

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getLanguageLocale(language);

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          setTimeout(() => {
            handleSendPrompt(transcript);
          }, 500);
        }
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation speech recognition is not supported on this browser. Try Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed starting speech recognition:', err);
      }
    }
  };

  const startAssistantListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported on this browser. Try Google Chrome.");
      return;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getLanguageLocale(language);

      recognition.onstart = () => {
        setVoiceStatus('listening');
        setVoiceTranscript('Listening to you...');
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setVoiceTranscript(transcript);
          setVoiceChatHistory(prev => [...prev, { sender: 'user', text: transcript }]);
          setVoiceStatus('processing');
          await handleVoiceCommand(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Assistant recognition error:", e);
        setVoiceStatus('idle');
        setVoiceTranscript("Sorry, I didn't catch that. Tap the mic to retry.");
      };

      recognition.onend = () => {
        setVoiceStatus(prev => prev === 'listening' ? 'idle' : prev);
      };

      assistantRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup failure:", err);
    }
  };

  const handleVoiceCommand = async (text: string) => {
    const lowerText = text.toLowerCase().trim();
    const activeLang = VOICE_COMMAND_RESPONSES[language] ? language : 'en';

    // Navigation triggers (all 10 languages)
    const isWeather = lowerText.includes('weather') || 
                      lowerText.includes('వాతావరణ') || 
                      lowerText.includes('मौसम') || 
                      lowerText.includes('வானிலை') || 
                      lowerText.includes('ಹವಾಮಾನ') || 
                      lowerText.includes('हवामान') || 
                      lowerText.includes('હવામાન') || 
                      lowerText.includes('আবহাওয়া') || 
                      lowerText.includes('ਮੌਸਮ') || 
                      lowerText.includes('കാലാവസ്ഥ');

    const isDisease = lowerText.includes('disease') || 
                      lowerText.includes('scan') || 
                      lowerText.includes('scans') ||
                      lowerText.includes('తెగులు') || 
                      lowerText.includes('రోగం') || 
                      lowerText.includes('స్కాన్') || 
                      lowerText.includes('रोग') || 
                      lowerText.includes('बीमारी') || 
                      lowerText.includes('स्कैन') || 
                      lowerText.includes('நோய்') || 
                      lowerText.includes('ஸ்கேன்') || 
                      lowerText.includes('ರೋಗ') || 
                      lowerText.includes('ಆಜಾರ') || 
                      lowerText.includes('आजारी') || 
                      lowerText.includes('स्कॅन') || 
                      lowerText.includes('રોગ') || 
                      lowerText.includes('સ્કેન') || 
                      lowerText.includes('ব্যাধি') || 
                      lowerText.includes('ਬਿਮਾਰੀ') || 
                      lowerText.includes('ਸਕੈਨ') || 
                      lowerText.includes('രോഗം') || 
                      lowerText.includes('സ്കാൻ');

    const isFarms = lowerText.includes('farm') || 
                    lowerText.includes('plot') || 
                    lowerText.includes('farms') ||
                    lowerText.includes('పొలం') || 
                    lowerText.includes('పొలాలు') || 
                    lowerText.includes('ఫామ్') || 
                    lowerText.includes('खेत') || 
                    lowerText.includes('फार्म') || 
                    lowerText.includes('பண்ணை') || 
                    lowerText.includes('பண்ணைகள்') || 
                    lowerText.includes('பார்ம்') || 
                    lowerText.includes('ಜಮೀನು') || 
                    lowerText.includes('ತೋಟ') || 
                    lowerText.includes('शेत') || 
                    lowerText.includes('ખેતર') || 
                    lowerText.includes('ફાર્મ') || 
                    lowerText.includes('খামার') || 
                    lowerText.includes('জমি') || 
                    lowerText.includes('ਖੇਤ') || 
                    lowerText.includes('ਫਾਰਮ') || 
                    lowerText.includes('കൃഷി') || 
                    lowerText.includes('ഫാം');
    
    if (isWeather) {
      const resp = VOICE_COMMAND_RESPONSES[activeLang]?.weather || "Opening weather dashboard.";
      setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: resp }]);
      speakAssistantResponse(resp, () => {
        setShowVoiceAssistant(false);
        navigate('/weather');
      });
      return;
    }
    
    if (isDisease) {
      const resp = VOICE_COMMAND_RESPONSES[activeLang]?.disease || "Opening crop disease scanner.";
      setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: resp }]);
      speakAssistantResponse(resp, () => {
        setShowVoiceAssistant(false);
        navigate('/disease');
      });
      return;
    }
    
    if (isFarms) {
      const resp = VOICE_COMMAND_RESPONSES[activeLang]?.farms || "Opening your farms.";
      setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: resp }]);
      speakAssistantResponse(resp, () => {
        setShowVoiceAssistant(false);
        navigate('/farms');
      });
      return;
    }

    // General AI query
    let targetConvId = activeConversationId;
    if (!targetConvId) {
      try {
        const newConv = await api.chat.createConversation('Voice Assistant Chat');
        setConversations(prev => [newConv, ...prev]);
        targetConvId = newConv._id;
        setActiveConversationId(newConv._id);
      } catch (err) {
        console.error(err);
        setVoiceStatus('idle');
        const errMsg = "Connection error. Please try again.";
        setVoiceTranscript(errMsg);
        setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: errMsg }]);
        return;
      }
    }

    const tempUserMsg: ChatMessage = {
      id: 'temp-usr-' + Date.now(),
      sender: 'user',
      text: text,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const data = await api.chat.sendMessage(targetConvId!, text, language);
      setMessages(data.conversation.messages || []);
      setConversations(prev => prev.map(c => c._id === targetConvId ? data.conversation : c));
      
      if (data.botMessage && data.botMessage.text) {
        setVoiceTranscript(data.botMessage.text);
        setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: data.botMessage.text }]);
        speakAssistantResponse(data.botMessage.text);
      } else {
        setVoiceStatus('idle');
        const errMsg = "No answer received.";
        setVoiceTranscript(errMsg);
        setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: errMsg }]);
      }
    } catch (err: any) {
      console.error(err);
      setVoiceStatus('idle');
      const errMsg = `Error connecting to AI: ${err.message || 'Please try again.'}`;
      setVoiceTranscript(errMsg);
      setVoiceChatHistory(prev => [...prev, { sender: 'bot', text: errMsg }]);
    }
  };

  const speakAssistantResponse = (text: string, onEndCallback?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageLocale(language);

      utterance.onstart = () => {
        setVoiceStatus('speaking');
      };

      utterance.onend = () => {
        setVoiceStatus('idle');
        if (onEndCallback) {
          onEndCallback();
        } else if (continuousVoice) {
          setTimeout(() => {
            startAssistantListening();
          }, 600);
        }
      };

      utterance.onerror = () => {
        setVoiceStatus('idle');
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setVoiceStatus('idle');
      if (onEndCallback) onEndCallback();
    }
  };

  return (
    <div className="copilot-page-layout">
      {/* Upper header */}
      <div className="copilot-header-card glass-card flex-between">
        <div className="flex-center" style={{ gap: '0.75rem' }}>
          <div className="bot-primary-badge flex-center">
            <Bot size={28} className="bot-primary-icon" />
          </div>
          <div>
            <h2>{t('copilot.title')}</h2>
            <p className="text-muted">{t('copilot.subtitle')}</p>
          </div>
        </div>
        <div className="flex-center" style={{ gap: '1.25rem' }}>
          <button 
            type="button"
            className="btn btn-primary flex-center"
            onClick={() => {
              setShowVoiceAssistant(true);
              setTimeout(() => {
                startAssistantListening();
              }, 300);
            }}
            style={{ gap: '0.4rem', backgroundColor: '#3b82f6', border: 'none', fontWeight: 800 }}
          >
            <Mic size={16} /> Wake Voice Assistant
          </button>
          <label className="voice-toggle-label flex-center">
            <input 
              type="checkbox" 
              checked={autoVoiceReplies} 
              onChange={(e) => setAutoVoiceReplies(e.target.checked)} 
            />
            <span>🔊 Hands-Free Voice Replies</span>
          </label>
          <span className="ai-badge badge-success flex-center">
            <Sparkles size={12} /> Gemini Core Active
          </span>
        </div>
      </div>

      <div className="copilot-chat-layout-grid">
        {/* Left sidebar: Previous Chats & Search */}
        <aside className="chatbot-left-sidebar glass-card">
          <div className="sidebar-action-header">
            <button className="btn btn-primary new-chat-btn flex-center" onClick={handleCreateNewChat}>
              <Plus size={16} /> New Session
            </button>
          </div>

          <div className="sidebar-search-box flex-center">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search chat history..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="conversations-list-scroller">
            {searchMode ? (
              <div className="search-results-wrapper">
                <div className="section-title">Search Results ({searchResults.length})</div>
                {searchResults.length === 0 ? (
                  <p className="no-items-text">No matches found.</p>
                ) : (
                  searchResults.map((res: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`conv-list-item ${activeConversationId === res.conversationId ? 'active' : ''}`}
                      onClick={() => {
                        setActiveConversationId(res.conversationId);
                        setSearchMode(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="item-title flex-center">
                        <FileText size={14} />
                        <span>{res.conversationTitle}</span>
                      </div>
                      <div className="search-match-snippet">
                        "...{res.messages[0]?.text.substring(0, 40)}..."
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="chats-list-wrapper">
                <div className="section-title">Previous Conversations</div>
                {conversationsLoading ? (
                  <div className="sidebar-skeleton-loader">
                    <div className="sk-item"></div>
                    <div className="sk-item"></div>
                    <div className="sk-item"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="no-items-text">No previous chat sessions.</p>
                ) : (
                  conversations.map((conv) => (
                    <div 
                      key={conv._id} 
                      className={`conv-list-item ${activeConversationId === conv._id ? 'active' : ''}`}
                      onClick={() => setActiveConversationId(conv._id)}
                    >
                      <div className="item-title flex-between">
                        <div className="flex-center" style={{ gap: '0.5rem', overflow: 'hidden' }}>
                          <Bot size={14} className="bot-dimmed-icon" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                        <button 
                          className="delete-conv-btn flex-center"
                          onClick={(e) => handleDeleteChat(conv._id, e)}
                          title="Delete Conversation"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="item-date">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Main Chat Panel */}
        <section className="chat-window-pane glass-card">
          <div className="chat-messages-container">
            {messages.length === 0 ? (
              <div className="chat-welcome-state flex-center flex-column">
                <div className="welcome-avatar flex-center">
                  <Bot size={36} />
                </div>
                <h3>KisanAI Agricultural Copilot</h3>
                <p>Ask anything about crop management, soil chemistry, diseases, sprays, and government schemes.</p>
                <div className="quick-suggestions-box">
                  <p className="suggest-title">Suggested Inquiries:</p>
                  <div className="suggest-chips">
                    {quickPrompts.map((qp, idx) => (
                      <button key={idx} onClick={() => handleSendPrompt(qp)} className="suggest-chip">
                        {qp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isError = msg.text.startsWith('⚠️');
                const uniqueId = msg._id || msg.id || `msg-${index}`;
                return (
                  <div key={uniqueId} className={`chat-bubble-row ${msg.sender} ${isError ? 'error-row' : ''}`}>
                    <div className={`chat-avatar flex-center ${isError ? 'error-avatar' : ''}`}>
                      {msg.sender === 'bot' ? (isError ? '⚠️' : '🤖') : '👨‍🌾'}
                    </div>
                    <div className="chat-bubble-content">
                      <div className={`chat-bubble-text ${isError ? 'error-text' : ''}`}>{msg.text}</div>
                      <div className="chat-bubble-meta flex-between">
                        <span className="chat-time">{msg.date}</span>
                        {msg.sender === 'bot' && !isError && (
                          <div className="bubble-actions flex-center" style={{ gap: '0.75rem' }}>
                            <button 
                              className={`speak-message-btn flex-center ${speakingMsgId === uniqueId ? 'speaking' : ''}`}
                              onClick={() => handleSpeak(msg.text, uniqueId)}
                              title={speakingMsgId === uniqueId ? 'Stop Reading' : 'Read Aloud'}
                            >
                              <Volume2 size={12} /> {speakingMsgId === uniqueId ? 'Stop' : t('copilot.voiceOutput')}
                            </button>
                            <button 
                              className="bookmark-advisory-btn flex-center"
                              onClick={() => handleSaveRecommendation(msg.text)}
                              title="Bookmark Advisory"
                            >
                              <Bookmark size={12} /> Save Advisory
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="chat-bubble-row bot">
                <div className="chat-avatar flex-center">🤖</div>
                <div className="chat-bubble-content">
                  <div className="chat-bubble-text flex-center" style={{ gap: '0.5rem', background: 'var(--bg-secondary)', borderTopLeftRadius: 0 }}>
                    <span className="dot-loading"></span>
                    <span className="dot-loading" style={{ animationDelay: '0.2s' }}></span>
                    <span className="dot-loading" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef}></div>
          </div>

          <div className="chat-input-dock flex-between">
            <button 
              className={`mic-btn flex-center ${listening ? 'listening' : ''}`}
              onClick={handleToggleMic}
              title={listening ? t('copilot.voiceSpeaking') : t('copilot.voiceInput')}
            >
              <Mic size={18} />
              {listening && <span className="mic-ripple"></span>}
            </button>

            <input 
              type="text" 
              className="chat-input-field" 
              placeholder={listening ? t('copilot.voiceSpeaking') : t('copilot.placeholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputText)}
              disabled={listening}
            />

            <button 
              className="btn btn-primary send-chat-btn" 
              disabled={!inputText.trim() || loading}
              onClick={() => handleSendPrompt(inputText)}
            >
              <Send size={16} />
            </button>
          </div>
        </section>

        {/* Right sidebar: Saved Advisories & Guidelines */}
        <aside className="saved-advisories-sidebar glass-card">
          <div className="sidebar-section">
            <h3 className="flex-center" style={{ gap: '0.5rem' }}><Bookmark size={16} style={{ color: 'var(--color-primary)' }} /> Saved Advisories</h3>
            <p className="text-muted font-xs">Agronomical tips bookmarked from chat logs. Saved permanently in MongoDB.</p>
            
            <div className="saved-items-container">
              {savedRecommendations.length === 0 ? (
                <div className="empty-saved-recommendations flex-center flex-column">
                  <Bookmark size={24} className="dimmed-bookmark" />
                  <p>No advisories saved yet.</p>
                </div>
              ) : (
                savedRecommendations.map((rec) => (
                  <div key={rec._id} className="saved-rec-card">
                    <div className="rec-header flex-between">
                      <span className={`rec-badge ${rec.type}`}>{rec.type.toUpperCase()}</span>
                      <button 
                        className="delete-rec-btn flex-center"
                        onClick={(e) => handleDeleteSavedRecommendation(rec._id, e)}
                        title="Delete Advisory"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="rec-text">{rec.recommendation}</p>
                    <div className="rec-date">{rec.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section divider-top">
            <h3 className="flex-center" style={{ gap: '0.5rem' }}><HelpCircle size={16} /> User Guidelines</h3>
            <div className="guidelines-card">
              <ul>
                <li>🤖 Generates specialized agronomical advice.</li>
                <li>📝 Split fertilizations, pest schedules, soil alerts.</li>
                <li>⚠️ Verify suggestions with local chemical testing.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .copilot-page-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          height: 100%;
        }

        .copilot-header-card {
          background-color: var(--bg-primary);
          padding: 1.25rem 1.5rem;
        }

        .copilot-header-card h2 {
          font-size: 1.4rem;
          font-weight: 800;
        }

        .bot-primary-badge {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background-color: var(--color-light-green);
          color: var(--color-primary);
        }

        .voice-toggle-label {
          gap: 0.5rem;
          font-size: 0.85rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .voice-toggle-label input {
          width: 16px;
          height: 16px;
          accent-color: var(--color-primary);
          cursor: pointer;
        }

        /* 3-Column Layout */
        .copilot-chat-layout-grid {
          display: grid;
          grid-template-columns: 280px 1fr 300px;
          gap: 1.5rem;
          height: 70vh;
        }

        /* Left Sidebar styling */
        .chatbot-left-sidebar {
          background-color: var(--bg-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 1rem;
        }

        .sidebar-action-header {
          margin-bottom: 1rem;
        }

        .new-chat-btn {
          width: 100%;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          padding: 0.65rem;
        }

        .sidebar-search-box {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .sidebar-search-box input {
          border: none;
          background: transparent;
          color: var(--text-primary);
          width: 100%;
          outline: none;
          font-size: 0.85rem;
        }

        .search-icon {
          color: var(--text-muted);
        }

        .conversations-list-scroller {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .no-items-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
          padding: 1rem 0;
        }

        .conv-list-item {
          padding: 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-bottom: 0.5rem;
          background-color: transparent;
        }

        .conv-list-item:hover {
          background-color: var(--bg-secondary);
          border-color: var(--border-color);
        }

        .conv-list-item.active {
          background-color: var(--color-light-green);
          border-color: rgba(22, 163, 74, 0.2);
        }

        html[data-theme='dark'] .conv-list-item.active {
          background-color: rgba(22, 163, 74, 0.15);
          border-color: rgba(22, 163, 74, 0.3);
        }

        .item-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .conv-list-item.active .item-title {
          color: var(--color-primary-dark);
        }

        .bot-dimmed-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .delete-conv-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .conv-list-item:hover .delete-conv-btn {
          opacity: 1;
        }

        .delete-conv-btn:hover {
          color: var(--color-danger);
        }

        .item-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .search-match-snippet {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          font-style: italic;
        }

        .sidebar-skeleton-loader {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sk-item {
          height: 50px;
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          animation: skPulse 1.5s infinite alternate;
        }

        @keyframes skPulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        /* Center Chat Window styling */
        .chat-window-pane {
          background-color: var(--bg-primary);
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100%;
        }

        .chat-messages-container {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chat-welcome-state {
          height: 100%;
          text-align: center;
          padding: 2rem;
          max-width: 550px;
          margin: auto;
        }

        .welcome-avatar {
          width: 70px;
          height: 70px;
          border-radius: var(--radius-full);
          background-color: var(--color-light-green);
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }

        .chat-welcome-state h3 {
          font-size: 1.3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .chat-welcome-state p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 2rem;
        }

        .quick-suggestions-box {
          width: 100%;
          text-align: left;
        }

        .suggest-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .suggest-chips {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggest-chip {
          padding: 0.65rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          font-size: 0.85rem;
          text-align: left;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .suggest-chip:hover {
          color: var(--color-primary);
          border-color: var(--color-primary);
          background-color: var(--color-light-green);
        }

        .chat-bubble-row {
          display: flex;
          gap: 1rem;
          max-width: 85%;
        }

        .chat-bubble-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-bubble-row.bot {
          align-self: flex-start;
        }

        .chat-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background-color: var(--bg-secondary);
          flex-shrink: 0;
          font-size: 1.1rem;
          border: 1px solid var(--border-color);
        }

        .chat-bubble-row.bot .chat-avatar {
          background-color: var(--color-light-green);
        }

        .chat-bubble-content {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .chat-bubble-text {
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--text-primary);
          background-color: var(--bg-secondary);
          border-top-left-radius: 0;
          white-space: pre-wrap;
        }

        .chat-bubble-row.user .chat-bubble-text {
          background-color: var(--color-primary);
          color: #FFFFFF;
          border-top-left-radius: var(--radius-md);
          border-top-right-radius: 0;
        }

        .chat-bubble-row.bot.error-row .chat-bubble-text {
          background-color: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-danger);
        }

        .chat-bubble-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          gap: 1.5rem;
        }

        .speak-message-btn, .bookmark-advisory-btn {
          background: transparent;
          border: none;
          color: var(--color-primary);
          cursor: pointer;
          font-weight: 700;
          font-size: 0.75rem;
          gap: 0.25rem;
          padding: 0;
        }

        .speak-message-btn.speaking {
          color: var(--color-danger);
        }

        /* Input Dock */
        .chat-input-dock {
          border-top: 1px solid var(--border-color);
          padding: 0.75rem 1.25rem;
          background-color: var(--bg-primary);
          gap: 0.75rem;
        }

        .chat-input-field {
          flex-grow: 1;
          padding: 0.65rem 1.25rem;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--border-color);
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          font-size: 0.9rem;
        }

        .chat-input-field:focus {
          border-color: var(--color-primary);
        }

        .send-chat-btn {
          border-radius: var(--radius-full);
          width: 40px;
          height: 40px;
          padding: 0;
        }

        .mic-btn {
          background-color: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }

        .mic-btn:hover {
          color: var(--color-primary);
          border-color: var(--color-primary);
        }

        .mic-btn.listening {
          background-color: var(--color-danger);
          border-color: var(--color-danger);
          color: #FFFFFF;
        }

        .mic-ripple {
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          border: 2px solid var(--color-danger);
          border-radius: var(--radius-full);
          animation: micRippleAnim 1.5s infinite ease-out;
        }

        @keyframes micRippleAnim {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        /* Right sidebar: Saved advisories */
        .saved-advisories-sidebar {
          background-color: var(--bg-primary);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-y: auto;
        }

        .sidebar-section h3 {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .font-xs {
          font-size: 0.75rem;
        }

        .divider-top {
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }

        .saved-items-container {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .empty-saved-recommendations {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-color);
        }

        .dimmed-bookmark {
          color: var(--text-muted);
          opacity: 0.4;
          margin-bottom: 0.5rem;
        }

        .saved-rec-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          position: relative;
        }

        .rec-header {
          margin-bottom: 0.5rem;
        }

        .rec-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-sm);
        }

        .rec-badge.irrigation {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .rec-badge.spray {
          background-color: rgba(168, 85, 247, 0.1);
          color: #a855f7;
        }

        .rec-badge.harvest {
          background-color: rgba(234, 179, 8, 0.1);
          color: #eab308;
        }

        .rec-badge.general {
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }

        .delete-rec-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .delete-rec-btn:hover {
          color: var(--color-danger);
        }

        .rec-text {
          font-size: 0.8rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          word-break: break-word;
        }

        .rec-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-align: right;
        }

        .guidelines-card ul {
          margin: 0.75rem 0 0 1rem;
          padding: 0;
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Voice Assistant Alexa Style Visualizer Animations & Styling */
        .alexa-device-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0.5rem 0;
          position: relative;
          width: 160px;
          height: 160px;
        }

        .alexa-outer-shadow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          background: transparent;
          transition: all 0.5s ease;
          pointer-events: none;
        }

        .alexa-outer-shadow.idle {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
        }
        .alexa-outer-shadow.listening {
          box-shadow: 0 0 35px rgba(16, 185, 129, 0.35);
        }
        .alexa-outer-shadow.processing {
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.25);
        }
        .alexa-outer-shadow.speaking {
          box-shadow: 0 0 40px rgba(6, 182, 212, 0.45);
        }

        .alexa-light-ring {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 5px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: #111827;
        }

        .alexa-light-ring.idle {
          background: radial-gradient(circle, #1f2937 70%, #1d4ed8 100%);
          animation: alexa-idle 4s infinite ease-in-out;
        }

        .alexa-light-ring.listening {
          background: radial-gradient(circle, #1f2937 60%, #10b981 90%, #06b6d4 100%);
          animation: alexa-listening 1.4s infinite ease-in-out;
        }

        .alexa-light-ring.processing::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          padding: 5px;
          background: conic-gradient(from 0deg, transparent 20%, #6366f1 50%, #06b6d4 80%, #10b981 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: alexa-processing 1.2s infinite linear;
        }

        .alexa-light-ring.speaking {
          background: radial-gradient(circle, #1f2937 65%, #3b82f6 90%, #6366f1 100%);
          animation: alexa-speaking 0.8s infinite alternate ease-in-out;
        }

        .alexa-center-core {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #374151 0%, #111827 80%, #030712 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #ffffff;
          cursor: pointer;
          z-index: 10;
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 4px 8px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .alexa-center-core:hover {
          transform: scale(1.02);
        }

        .alexa-center-core.listening {
          color: #10b981;
        }

        .alexa-center-core.speaking {
          color: #3b82f6;
        }

        .alexa-ripple-ring {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
        }

        .alexa-ripple-ring.r1 {
          border: 2px solid rgba(16, 185, 129, 0.3);
          animation: alexa-ripple 2.5s infinite linear;
        }

        .alexa-ripple-ring.r2 {
          border: 2px solid rgba(6, 182, 212, 0.2);
          animation: alexa-ripple 2.5s infinite linear;
          animation-delay: 1.25s;
        }

        .alexa-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--text-muted);
        }

        .status-dot.listening {
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .status-dot.processing {
          background-color: #6366f1;
          box-shadow: 0 0 8px #6366f1;
        }

        .status-dot.speaking {
          background-color: #3b82f6;
          box-shadow: 0 0 8px #3b82f6;
        }

        .alexa-waveform {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 20px;
        }

        .alexa-wave-bar {
          width: 3px;
          height: 6px;
          background-color: #3b82f6;
          border-radius: 2px;
          animation: alexa-wave-bounce 0.8s infinite ease-in-out alternate;
        }

        .alexa-wave-bar:nth-child(2) { animation-delay: 0.15s; background-color: #60a5fa; }
        .alexa-wave-bar:nth-child(3) { animation-delay: 0.3s; background-color: #93c5fd; }
        .alexa-wave-bar:nth-child(4) { animation-delay: 0.45s; background-color: #60a5fa; }
        .alexa-wave-bar:nth-child(5) { animation-delay: 0.6s; background-color: #3b82f6; }

        .dot-loading-swirl {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: #ffffff;
          animation: alexa-processing 1s infinite linear;
        }

        /* Voice Chat Dialogue Bubble overrides */
        .voice-bubble.user {
          border-top-right-radius: 2px !important;
        }

        .voice-bubble.bot {
          border-top-left-radius: 2px !important;
        }

        /* Animations keyframes */
        @keyframes alexa-idle {
          0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 10px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.2); }
        }

        @keyframes alexa-listening {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(6, 182, 212, 0.2); }
          50% { box-shadow: 0 0 35px rgba(16, 185, 129, 0.7), 0 0 0 6px rgba(6, 182, 212, 0.4); }
        }

        @keyframes alexa-processing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes alexa-speaking {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 0 2px rgba(99, 102, 241, 0.2); transform: scale(1); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.75), 0 0 0 6px rgba(99, 102, 241, 0.4); transform: scale(1.02); }
        }

        @keyframes alexa-ripple {
          0% { transform: scale(0.85); opacity: 1; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        @keyframes alexa-wave-bounce {
          0% { height: 6px; }
          100% { height: 20px; }
        }

        /* Dot Loading anim */
        .dot-loading {
          width: 6px;
          height: 6px;
          background-color: var(--text-muted);
          border-radius: var(--radius-full);
          animation: dotLoading 1s infinite alternate;
        }

        @keyframes dotLoading {
          0% { opacity: 0.2; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(-4px); }
        }

        @media (max-width: 1200px) {
          .copilot-chat-layout-grid {
            grid-template-columns: 240px 1fr;
          }
          .saved-advisories-sidebar {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .copilot-chat-layout-grid {
            grid-template-columns: 1fr;
            height: 60vh;
          }
          .chatbot-left-sidebar {
            display: none;
          }
        }
      `}</style>

      {/* Alexa Style Kisan Voice AI Modal */}
      <AnimatePresence>
        {showVoiceAssistant && (
          <motion.div 
            className="voice-assistant-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <motion.div 
              className="voice-assistant-card glass-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                gap: '2rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowVoiceAssistant(false);
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  if (assistantRecognitionRef.current) assistantRecognitionRef.current.stop();
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  border: 'none',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <div className="voice-title-header">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Kisan Voice AI</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Hands-Free Agri Assistant</p>
              </div>

              {/* Alexa Ring Visualizer */}
              <div className="alexa-device-container">
                <div className={`alexa-outer-shadow ${voiceStatus}`}></div>
                
                {/* Ripples for listening and speaking */}
                {voiceStatus === 'listening' && (
                  <>
                    <div className="alexa-ripple-ring r1"></div>
                    <div className="alexa-ripple-ring r2"></div>
                  </>
                )}
                {voiceStatus === 'speaking' && (
                  <>
                    <div className="alexa-ripple-ring r1" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}></div>
                    <div className="alexa-ripple-ring r2" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}></div>
                  </>
                )}
                
                <div className={`alexa-light-ring ${voiceStatus}`}>
                  <div 
                    className={`alexa-center-core ${voiceStatus}`}
                    onClick={() => {
                      if (voiceStatus === 'idle') startAssistantListening();
                      else if (voiceStatus === 'listening') {
                        if (assistantRecognitionRef.current) assistantRecognitionRef.current.stop();
                      } else {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        setVoiceStatus('idle');
                      }
                    }}
                  >
                    {voiceStatus === 'listening' && <Mic size={32} className="animate-pulse" />}
                    {voiceStatus === 'processing' && <span className="dot-loading-swirl"></span>}
                    {voiceStatus === 'speaking' && (
                      <div className="alexa-waveform">
                        <span className="alexa-wave-bar"></span>
                        <span className="alexa-wave-bar"></span>
                        <span className="alexa-wave-bar"></span>
                        <span className="alexa-wave-bar"></span>
                        <span className="alexa-wave-bar"></span>
                      </div>
                    )}
                    {voiceStatus === 'idle' && <Mic size={32} style={{ opacity: 0.6 }} />}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="alexa-status-badge">
                <span className={`status-dot ${voiceStatus}`}></span>
                <span className="status-label">
                  {voiceStatus === 'listening' ? 'Listening...' : 
                   voiceStatus === 'processing' ? 'Thinking...' : 
                   voiceStatus === 'speaking' ? 'Responding...' : 'Tap to talk'}
                </span>
              </div>

              {/* Voice Subtitles Caption */}
              <div className="voice-subtitle-caption" style={{ minHeight: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {voiceStatus === 'listening' && <span>"Speak now..."</span>}
                {voiceStatus === 'processing' && <span>Gemini is composing response...</span>}
                {voiceStatus === 'speaking' && <span className="truncate" style={{ maxWidth: '350px', display: 'inline-block' }}>Reading reply aloud...</span>}
                {voiceStatus === 'idle' && <span>Tap the mic to start speaking</span>}
              </div>

              {/* Live Dialogue stream inside Voice Assistant Modal */}
              <div 
                className="voice-dialogue-scroller" 
                ref={voiceScrollRef}
                style={{
                  width: '100%',
                  height: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  textAlign: 'left'
                }}
              >
                {voiceChatHistory.length === 0 ? (
                  <div className="flex-center flex-column" style={{ margin: 'auto', gap: '0.5rem', opacity: 0.5 }}>
                    <Bot size={28} />
                    <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      How can I help you today?
                    </p>
                  </div>
                ) : (
                  voiceChatHistory.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`voice-bubble ${item.sender}`} 
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        maxWidth: '85%',
                        alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: item.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-primary)',
                        color: item.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                        border: item.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.15rem', opacity: 0.8 }}>
                        {item.sender === 'user' ? 'You' : 'Kisan AI'}
                      </strong>
                      <span>{item.text}</span>
                    </div>
                  ))
                )}
                {voiceStatus === 'processing' && (
                  <div 
                    className="voice-bubble bot" 
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      alignSelf: 'flex-start',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.8 }}>
                      Kisan AI
                    </strong>
                    <div className="flex-center" style={{ gap: '0.25rem', width: '30px', height: '10px' }}>
                      <span className="dot-loading"></span>
                      <span className="dot-loading" style={{ animationDelay: '0.2s' }}></span>
                      <span className="dot-loading" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls bar */}
              <div className="voice-controls-panel flex-column" style={{ width: '100%', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div className="flex-between" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <label className="voice-toggle-label flex-center" style={{ gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={continuousVoice} 
                      onChange={(e) => setContinuousVoice(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                    />
                    <span>🔄 Continuous Conversation</span>
                  </label>

                  <div className="flex-center" style={{ gap: '0.25rem' }}>
                    <span className="text-muted">Lang:</span>
                    <strong style={{ color: 'var(--color-primary)', textTransform: 'uppercase' }}>{language}</strong>
                  </div>
                </div>

                <div className="voice-tips-box" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <strong>Commands you can speak:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                    <li>"Show today's weather"</li>
                    <li>"Scan crop disease"</li>
                    <li>"Open my farms"</li>
                    <li>"What crop should I grow?"</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

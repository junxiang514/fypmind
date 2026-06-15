import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.1-flash-lite';

const SYSTEM_PROMPT = `You are Lumi, a supportive, warm, and highly empathetic mental health chatbot for the MIND mobile application.

Goal:
Provide emotionally supportive, practical, and safe mental health guidance.

Behavior rules:
1) Always identify yourself as Lumi when asked about your name.
2) Only respond to messages related to mental health, emotional wellbeing, stress, anxiety, depression, burnout, grief, relationships, sleep, coping skills, and self-care.
3) If a message is not related to mental health, give a brief polite redirection and invite the user to ask about wellbeing or emotional support.
4) Never diagnose illnesses, prescribe medication, or provide legal/financial advice.
5) If user may be at risk of self-harm/suicide, respond with empathy first, urge immediate real-world help, and suggest contacting local emergency services now.
6) Keep tone warm, non-judgmental, and culturally respectful.
7) Use plain text only.

Response format (important):
- Start with 1 sentence of empathy/validation.
- Then give 1-4 concrete, actionable suggestions.
- End with 1 gentle follow-up question if needed.

Quality requirements:
- Be specific, not generic.
- Prefer short coping exercises (breathing, grounding, journaling prompts, sleep routine, micro-steps).
- If user asks for a plan, provide a simple step-by-step plan.
- Keep answers concise (about 90-180 words unless user asks for detail).`;

function isCrisisText(text = '') {
  const normalized = text.toLowerCase();
  return /(suicide|kill myself|end my life|self-harm|hurt myself|tak nak hidup|bunuh diri|mati)/i.test(normalized);
}

function toGeminiRole(sender) {
  return sender === 'user' ? 'user' : 'model';
}

function getGeminiReplyText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part?.text || '')
    .join('')
    .trim();
  return text || "I'm here to support your mental wellbeing. Could you share more about how you're feeling?";
}

function getFinishReason(payload) {
  return payload?.candidates?.[0]?.finishReason || '';
}

function TypingIndicator() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => {
      anim.stop();
      progress.setValue(0);
    };
  }, []);

  const dot1Opacity = progress.interpolate({
    inputRange: [0, 0.33, 0.34, 1],
    outputRange: [1, 1, 0.25, 0.25],
  });
  const dot2Opacity = progress.interpolate({
    inputRange: [0, 0.33, 0.66, 0.67, 1],
    outputRange: [0.25, 0.25, 1, 0.25, 0.25],
  });
  const dot3Opacity = progress.interpolate({
    inputRange: [0, 0.66, 1],
    outputRange: [0.25, 0.25, 1],
  });

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
    </View>
  );
}

export default function AIChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hi, I'm Lumi, your mental wellbeing guide. Whether you're feeling stressed, anxious, or just need a safe space to share, I'm here for you. How are you feeling today?",
      sender: 'ai'
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Customize Navigation Header with Lumi's details
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image
            source={require('../../../assets/LumiAvatar.png')}
            style={styles.avatarHeaderImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.botName}>Lumi</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.botStatus}>Online Assistant</Text>
            </View>
          </View>
        </View>
      ),
      headerTitleAlign: 'left',
    });
  }, [navigation]);

  const endpoint = useMemo(() => {
    if (!GEMINI_API_KEY) return null;
    return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  }, [GEMINI_API_KEY, GEMINI_MODEL]);

  const fetchGeminiReply = async (history) => {
    if (!endpoint) {
      return 'Gemini API key missing. Please set EXPO_PUBLIC_GEMINI_API_KEY in .env.local and restart Expo.';
    }

    const runGemini = async (contents) => {
      const body = {
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 900,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await response.json();
      if (!response.ok || json?.error) {
        throw new Error(json?.error?.message || 'Failed to get AI response.');
      }

      return json;
    };

    const baseContents = history.map((msg) => ({
      role: toGeminiRole(msg.sender),
      parts: [{ text: msg.text }],
    }));

    const firstPayload = await runGemini(baseContents);
    let combinedText = getGeminiReplyText(firstPayload);
    const finishReason = getFinishReason(firstPayload);

    if (finishReason === 'MAX_TOKENS') {
      const continuationContents = [
        ...baseContents,
        { role: 'model', parts: [{ text: combinedText }] },
        {
          role: 'user',
          parts: [{ text: 'Continue from exactly where you stopped. No repetition.' }],
        },
      ];

      const continuationPayload = await runGemini(continuationContents);
      const continuationText = getGeminiReplyText(continuationPayload);
      if (continuationText) {
        combinedText = `${combinedText}\n\n${continuationText}`.trim();
      }
    }

    return combinedText;
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    const userMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      sender: 'user',
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setSending(true);
    const typingId = `typing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const typingMessage = { id: typingId, text: '', sender: 'ai', typing: true };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const aiText = await fetchGeminiReply(nextMessages);
      const safetyFooter = isCrisisText(trimmed)
        ? '\n\nIf you might act on these thoughts now, please call emergency services immediately (Malaysia: 999), or contact Befrienders KL at 03-7627 2929.'
        : '';
      const aiResponse = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `${aiText}${safetyFooter}`,
        sender: 'ai',
      };
      setMessages((prev) => [...prev.filter((m) => !m.typing), aiResponse]);
    } catch (error) {
      const fallback = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `Sorry, I couldn't respond right now. ${error?.message || ''}`.trim(),
        sender: 'ai',
      };
      setMessages((prev) => [...prev.filter((m) => !m.typing), fallback]);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <Image
            source={require('../../../assets/LumiAvatar.png')}
            style={styles.messageAvatarImage}
          />
        )}
        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          {item.typing ? (
            <View style={styles.typingContainer}>
              <TypingIndicator />
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText
            ]}>{item.text}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
        />
        
        <View style={styles.inputContainer}>
          <Text style={styles.disclaimerText}>Disclaimer: AI provides suggestions only and does not replace professional diagnosis or treatment.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              editable={!sending}
            />
            <TouchableOpacity style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={sendMessage} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Sleek slate 50 background
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarHeaderImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  avatarHeaderContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1', // Indigo bot color
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  botName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981', // green online dot
    marginRight: 4,
  },
  botStatus: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  messageAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 2,
    backgroundColor: '#F1F5F9',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6366F1', // indigo user bubble
    borderBottomRightRadius: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: {
    fontSize: 15.5,
    lineHeight: 22,
    flexShrink: 1,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1E293B', // Dark slate text for AI
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: '#64748B',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'left',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 12,
    color: '#1E293B',
  },
  sendButton: {
    backgroundColor: '#6366F1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
});

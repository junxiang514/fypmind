import React, { useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a supportive mental health assistant for a mobile app.

Goal:
Provide emotionally supportive, practical, and safe mental health guidance.

Behavior rules:
1) Focus on mental health, emotional wellbeing, stress, anxiety, depression, burnout, grief, relationships, sleep, coping skills, and self-care.
2) If a message is not clearly mental-health related, do NOT hard-refuse immediately. Gently connect it to emotions/wellbeing and offer support.
3) Never diagnose illnesses, prescribe medication, or provide legal/financial advice.
4) If user may be at risk of self-harm/suicide, respond with empathy first, urge immediate real-world help, and suggest contacting local emergency services now.
5) Keep tone warm, non-judgmental, and culturally respectful.
6) Use plain text only.

Response format (important):
- Start with 1 sentence of empathy/validation.
- Then give 1-4 concrete, actionable suggestions ( if the user asks for them or if the situation warrants it ).
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

export default function AIChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am your AI mental health assistant. How can I help you today?', sender: 'ai' },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const endpoint = useMemo(() => {
    if (!GEMINI_API_KEY) return null;
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;
  }, []);

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

    // If the model stopped due to token cap, request one continuation chunk.
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
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const fallback = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `Sorry, I couldn't respond right now. ${error?.message || ''}`.trim(),
        sender: 'ai',
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.messageBubble, 
      item.sender === 'user' ? styles.userBubble : styles.aiBubble
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'user' ? styles.userText : styles.aiText
      ]}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={100}
        style={styles.inputContainer}
      >
        <Text style={styles.disclaimerText}>Disclaimer: AI provides suggestions only and does not replace professional diagnosis or treatment.</Text>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          editable={!sending}
        />
        <TouchableOpacity style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={sendMessage} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={24} color="#fff" />}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  disclaimerText: {
    width: '100%',
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
});

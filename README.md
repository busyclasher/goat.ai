# 🐐 GOAT.ai - Digital Minds That Actually Talk

> **The future of AI conversation is here.** Chat with AI personas that don't just text back—they speak, listen, and remember. Built for the next generation of human-AI interaction.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-00D4AA?style=for-the-badge&logo=elevenlabs&logoColor=white)](https://elevenlabs.io/)
[![Groq](https://img.shields.io/badge/Groq-FF6B35?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)

---

## 🎭 What Makes GOAT.ai Special?

### 🗣️ **Real Voice Conversations**
- **Speech-to-Text**: Talk naturally, AI listens
- **Text-to-Speech**: AI responds with actual voice
- **Emotion Tags**: AI uses `[excitedly]`, `[thoughtfully]`, `[chuckles]` for natural speech
- **Custom Voices**: Each persona has their unique voice

### 🧠 **Intelligent Personas**
- **Auto-Creation**: Type `@elonmusk` and watch magic happen
- **Real Research**: Uses Exa.ai to scrape real personality data
- **Style & Taboos**: Each persona has communication style and boundaries
- **Memory**: Conversations persist and build context

### 🎯 **Multi-Persona Chats**
- **Seamless Switching**: `@warrenbuffett` then `@elonmusk` in the same conversation
- **Group Dynamics**: Multiple AI personas can join one chat
- **Context Awareness**: Each persona remembers the full conversation

---

## 🚀 Quick Start (5 Minutes)

### 1. **Clone & Install**
```bash
git clone https://github.com/yourusername/goat.ai.git
cd goat.ai/goat-ai
npm install
```

### 2. **Set Up Supabase**
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/seed.sql` for sample personas
4. Get your URL & anon key from Settings > API

### 3. **Configure Environment**
```bash
npm run setup
# Edit .env.local with your keys:
```

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for full features)
GROQ_API_KEY=gsk_...          # Get from console.groq.com
ELEVEN_API_KEY=...            # Get from elevenlabs.io  
EXA_API_KEY=...               # Get from exa.ai

# Demo mode (works without API keys)
NEXT_PUBLIC_DEMO_MODE=true
```

### 4. **Launch**
```bash
npm run dev
# Visit http://localhost:3000
```

## 🎪 Live Demo

**Try it now:** [goat.ai](https://goat.ai) *(if deployed)*

**📺 Watch the Demo:** [YouTube Demo Video](https://youtu.be/OMuJ75y7fO0) - See GOAT.ai in action with voice interactions and persona switching!

> **Note:** We recently moved our demo video to YouTube to avoid hosting large MP4 files in this public repository, which helps keep the repository lightweight and secure.

**Sample Personas:**
- 🧠 **@warrenbuffett** - Investment wisdom & long-term thinking
- 🚀 **@elonmusk** - Innovation & bold vision  
- 🎭 **@morganfreeman** - Deep, thoughtful insights
- 👨‍💼 **@mentor** - Practical life advice

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 + TypeScript + Tailwind | Modern, responsive UI |
| **Backend** | Supabase | Real-time database + auth |
| **AI Engine** | Groq (Llama 3.1) | Lightning-fast responses |
| **Voice** | ElevenLabs | Speech-to-text + text-to-speech |
| **Research** | Exa.ai | Personality data scraping |
| **Testing** | Playwright | End-to-end testing |

---

## 🎯 Key Features

### 🎤 **Voice-First Design**
```typescript
// Natural voice interaction
const response = await handleVoiceMessage("Tell me about investing");
// AI responds with both text AND audio
```

### 🧩 **Smart Persona Creation**
```typescript
// Auto-generate from real people
const persona = await buildPersona("Tim Ferriss", "productivity expert");
// Creates: system prompt, style bullets, taboo topics, custom voice
```

### 🔄 **Real-time Multi-Persona**
```typescript
// Seamless persona switching
await handlePersonaSwitch("elonmusk", "What about Mars?");
// Elon joins the conversation with full context
```

### 🎭 **Emotion-Aware Responses**
```typescript
// AI generates expressive text
"That's fascinating! [excitedly] I've been thinking about this... [thoughtfully]"
// UI shows clean text, TTS gets emotion tags
```

---

## 📁 Project Structure

```
goat-ai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API endpoints
│   │   │   ├── chat/          # Groq integration
│   │   │   ├── tts/           # ElevenLabs TTS
│   │   │   ├── stt/           # ElevenLabs STT
│   │   │   └── personas/      # Persona management
│   │   ├── chat/              # Main chat interface
│   │   └── landing/           # Persona selection
│   ├── components/            # React components
│   │   ├── ChatList.tsx       # Message display
│   │   ├── Composer.tsx       # Input interface
│   │   ├── MicButton.tsx      # Voice recording
│   │   └── CreatePersonaModal.tsx
│   └── lib/                   # Utilities
│       ├── groq.ts           # AI integration
│       ├── personas.ts       # Persona logic
│       └── supabase.ts       # Database client
├── supabase/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Sample data
└── tests/                    # Playwright tests
```

---

## 🎮 How to Use

### **Basic Chat**
1. Choose a persona from the landing page
2. Type your message or click the mic to speak
3. AI responds with text + voice

### **Persona Switching**
```
You: @elonmusk What about Mars colonization?
Elon: [excitedly] Mars is the next frontier! We need to...

You: @warrenbuffett What's your take on this?
Warren: [thoughtfully] Well, I focus on businesses I understand...
```

### **Creating New Personas**
1. Click "Create Persona" on landing page
2. Enter name (e.g., "Marie Curie")
3. Add context (e.g., "scientist, radioactivity")
4. Choose gender for voice
5. AI researches and creates custom persona!

---

## 🔧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Chat completion with Groq |
| `/api/tts` | POST | Text-to-speech with ElevenLabs |
| `/api/stt` | POST | Speech-to-text with ElevenLabs |
| `/api/personas/create` | POST | Create new persona |
| `/api/persona/switch` | POST | Switch active persona |

---

## 🧪 Testing

```bash
# Run end-to-end tests
npm run test:e2e

# Test specific features
npm run test:voice
npm run test:personas
```

**Test Coverage:**
- ✅ Voice recording & playback
- ✅ Persona creation & switching  
- ✅ Real-time chat updates
- ✅ Error handling & fallbacks
- ✅ Mobile responsiveness

---

## 🎨 Demo Mode

Perfect for development and demos:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

**Features:**
- ✅ Works without API keys
- ✅ Canned responses for testing
- ✅ Full UI functionality
- ✅ Voice generation still works
- ✅ No external API costs

---

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Deploy to Vercel
npx vercel

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...
ELEVEN_API_KEY=...
EXA_API_KEY=...
```

### **Other Platforms**
- **Netlify**: Works with static export
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment

---

## 🤝 Contributing

We love contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

**Areas we need help:**
- 🎨 UI/UX improvements
- 🧪 More test coverage
- 📱 Mobile optimization
- 🌍 Internationalization
- 🎭 New persona templates

---

## 📊 Performance

- **Response Time**: <200ms (Groq)
- **Voice Generation**: <3s (ElevenLabs)
- **Persona Creation**: <15s (Exa + Groq + ElevenLabs)
- **Real-time Updates**: <100ms (Supabase)

---

## 🔒 Privacy & Ethics

- **No Data Mining**: Conversations stay in your Supabase
- **Consent-First**: Generic voices unless explicit consent
- **Transparent AI**: Clear persona boundaries and taboos
- **User Control**: Delete conversations anytime

---

## 🐛 Troubleshooting

### **Common Issues**

**"Persona not found"**
```bash
# Make sure you ran the seed script
# Check Supabase connection in .env.local
```

**"Voice not working"**
```bash
# Check ElevenLabs API key
# Ensure HTTPS or localhost
# Check browser autoplay policies
```

**"API errors"**
```bash
# Verify all API keys in .env.local
# Check API quotas and limits
# Use demo mode for testing
```

### **Debug Mode**
```bash
# Enable detailed logging
NODE_ENV=development npm run dev
```

---

## 📚 Documentation

- 📖 [Quick Start Guide](goat-ai/docs/QUICK_START.md)
- 🎭 [Persona Creation](goat-ai/docs/PERSONA_CREATION_FEATURE.md)
- 🎤 [Voice Setup](goat-ai/docs/VOICE_SETUP_QUICKREF.md)
- 🧪 [Testing Guide](goat-ai/docs/EMOTION_TAGS_TESTING.md)
- 🔧 [Troubleshooting](goat-ai/docs/TROUBLESHOOTING_AVATARS.md)

---

## 🎉 What's Next?

### **Coming Soon**
- 🎨 **Custom Avatars**: Upload persona images
- 🌍 **Multi-language**: Support for 10+ languages  
- 📱 **Mobile App**: React Native version
- 🎭 **Persona Marketplace**: Share & discover personas
- 🧠 **Memory System**: Long-term conversation memory
- 🎪 **Group Chats**: Multiple personas in one room

### **Roadmap**
- Q1 2025: Mobile app launch
- Q2 2025: Enterprise features
- Q3 2025: API for developers
- Q4 2025: AI marketplace

---

## 💡 Inspiration

GOAT.ai was born from a simple question: *"What if AI could actually talk like real people?"*

We're building the future where:
- 🎭 **AI has personality** - not just intelligence
- 🗣️ **Conversations feel natural** - voice, emotion, context
- 🧠 **AI remembers** - builds relationships over time
- 🎪 **Multiple perspectives** - get advice from different experts

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** - Lightning-fast AI inference
- **ElevenLabs** - Incredible voice synthesis
- **Supabase** - Real-time database magic
- **Exa.ai** - Smart web research
- **Next.js** - Amazing React framework
- **Tailwind** - Beautiful, utility-first CSS

---

<div align="center">

**Built with ❤️ by the GOAT.ai team formed during Cursor's first 24 hours hackathon in Singapore**


*"The future of AI conversation is here. Are you ready to talk to the GOATs?"*

</div>

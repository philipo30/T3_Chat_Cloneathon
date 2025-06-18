# ChadLLM (T3 Chat Cloneathon)

> **A premium AI chat experience built for the T3 Chat Cloneathon competition**

ChadLLM is a sophisticated AI chat application that goes far beyond basic chat functionality. Built with the T3 Stack and featuring a modern dark purple theme, it delivers a premium desktop-app-like experience with advanced features and smooth performance.

![ChadLLM Screenshot](https://via.placeholder.com/800x400/8B5CF6/FFFFFF?text=ChadLLM+Premium+Chat+Interface)

## ✨ Key Features

### 🤖 **Multi-Model AI Support**
- **100+ AI Models** via OpenRouter API
- Support for GPT-4, Claude, Gemini, DeepSeek, and more
- Model-specific capabilities (reasoning, web search, file support)
- Intelligent model selection and fallbacks

### 🔍 **Advanced Web Search**
- Real-time web search integration
- Automatic citation generation with markdown links
- Configurable search results and context
- Smart search query generation

### 📁 **Hierarchical Organization**
- **Workspaces** → **Folders** → **Chats** structure
- Drag-and-drop organization with visual feedback
- Pinned chats and smart sorting
- Search across all conversations

### 📎 **File Attachments**
- Drag-and-drop file uploads
- Image and PDF support with previews
- Base64 encoding for database storage
- Copy-paste image support

### 🎤 **Voice Input**
- Web Speech API integration
- Real-time transcription with visual feedback
- Hands-free interaction
- Cross-browser compatibility

### 🎨 **Premium UI/UX**
- Custom dark purple theme with smooth animations
- GPU-accelerated streaming performance
- Accessibility-first approach

### 🔗 **Chat Sharing**
- Public/private chat sharing
- Password protection and expiration dates
- View count tracking
- SEO-friendly shared URLs

### ⚡ **Performance Optimized**
- Streaming responses with minimal re-renders
- Intelligent prompt caching
- Optimized database queries
- Real-time synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- OpenRouter API key

### 1. Clone & Install
```bash
git clone https://github.com/philipo30/T3_Chat_Cloneathon.git
cd T3_Chat_Cloneathon
npm install
```

### 2. Database Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" to execute the setup script

### 3. Environment Configuration
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Launch the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Get Started
1. **Sign up** with email/password
2. **Add your OpenRouter API key** in Settings
3. **Start chatting** with AI models
4. **Try advanced features**: file uploads, voice input, web search
5. **Organize your chats** with workspaces and folders

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: OpenRouter API
- **State Management**: Zustand + React Query
- **UI Components**: Radix UI + Custom components
- **File Handling**: Base64 encoding with drag-and-drop
- **Voice Input**: Web Speech API
- **Animations**: Framer Motion + CSS transitions

## 📱 Features Overview

### Chat Interface
- **Streaming responses** with optimized performance
- **Message utility bar** with copy, retry, and delete actions
- **Reasoning display** for supported models
- **Auto-scroll** with smart behavior
- **Mobile-optimized** touch interactions

### Organization System
- **Workspaces** for different projects/contexts
- **Folders** within workspaces for grouping
- **Drag-and-drop** reordering and organization
- **Search functionality** across all chats
- **Pinned chats** for quick access

### Advanced Capabilities
- **Web search integration** with citation support
- **File attachments** (images, PDFs) with previews
- **Voice input** with real-time transcription
- **Chat sharing** with privacy controls
- **Model switching** mid-conversation
- **Prompt caching** for improved performance

## 🎨 Design Philosophy

ChadLLM prioritizes **user experience** and **performance**:

- **Instant responsiveness** with optimistic UI updates
- **Smooth animations** (200-300ms transitions)
- **Premium aesthetics** with custom dark purple theme
- **Desktop-app feel** in a web interface
- **Accessibility-first** design principles
- **Mobile-responsive** without compromise

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript checks
npm run format.fix   # Format code with Prettier
```

### Project Structure
```
src/
├── app/             # Next.js App Router pages
├── components/      # React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
├── contexts/        # React contexts
└── stores/          # Zustand stores
```

## 🤝 Contributing

This project was built for the T3 Chat Cloneathon competition. While the competition is ongoing, feel free to:

1. **Report bugs** via GitHub issues
2. **Suggest features** for post-competition development
3. **Star the repo** if you find it useful
4. **Share feedback** on the implementation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🏆 Competition Info

Built for the [T3 Chat Cloneathon](https://cloneathon.t3.chat/) - a competition to build the best T3 Chat clone with creative features and excellent execution.

**What makes ChadLLM special:**
- Goes beyond basic requirements with advanced features
- Premium UX that feels like native desktop software
- Performance-optimized for smooth interactions
- Unique workspace organization system
- Comprehensive file and voice support

---

**ChadLLM** - Where AI conversations meet premium user experience. 🚀

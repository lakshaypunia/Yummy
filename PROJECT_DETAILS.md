# Pathly: The AI-Native Learning IDE

Pathly is an advanced, AI-powered platform designed to transform how individuals and teams learn complex subjects. It combines a structured learning roadmap with a rich, collaborative document editor and integrated AI capabilities.

## 🚀 Key Features

### 1. Dynamic AI Roadmaps
- **Structured Learning**: Generates comprehensive, hierarchical roadmaps based on a user's goal, skill level, and learning style.
- **Visual Progression**: Uses interactive flowcharts (React Flow) to visualize the learning journey.
- **Adaptive Paths**: Roadmaps can be adjusted and refined as the learner progresses.

### 2. AI-Native Collaborative Editor
- **Block-Based Editing**: A Notion-like experience powered by BlockNote.
- **AI Suggestions (`@update`)**: Users can tag the AI to suggest content edits, structural changes, or styling updates directly within blocks.
- **Real-time Collaboration**: Seamless multi-user editing with Yjs and WebSocket synchronization.

### 3. Interactive Educational Tools
- **Creative Coding (`@p5`, `@animation`)**: Instantly generates interactive p5.js sketches for visual learning and experimentation.
- **Educational Videos (`@video`)**: Leverages Manim (Python) to create high-quality, professional mathematical and technical animations.
- **Diagrams (`@diagram`)**: Automatically generates Mermaid.js flowcharts and diagrams to explain complex systems.

### 4. Smart Knowledge Base (RAG)
- **PDF Interaction (`@rag`)**: Users can upload PDF resources and query them using AI.
- **Context-Aware AI**: Utilizes Gemini's large context window and caching to provide accurate answers based solely on the provided documents.
- **File Management**: Integrated file uploads via UploadThing.

### 5. Multi-User Spaces & Collaboration
- **Learning Spaces**: Organized hubs for specific goals with shared documents, chats, and whiteboards.
- **Shared Whiteboards**: Integrated Excalidraw for visual brainstorming.
- **Real-time Audio/Video**: LiveKit integration for collaborative learning sessions.

---

## 🛠 Technical Architecture

### Core Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) for a high-performance, SEO-friendly React application.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for end-to-end type safety.
- **Authentication**: [Clerk](https://clerk.com/) for secure, scalable user management and social auth.
- **Database**: [PostgreSQL](https://www.postgresql.org/) managed via [Prisma ORM](https://www.prisma.io/).

### AI Engine (Google Gemini)
- **Model Orchestration**: Leverages `gemini-2.0-flash` and `gemini-2.5-flash` for low-latency, high-intelligence responses.
- **Intent Identification**: A "Supervisor Brain" classifies user requests into specific actions (video creation, page updates, etc.).
- **Content Caching**: Uses Gemini's caching API to optimize performance and reduce costs for long-document RAG.

### Real-time & Collaboration
- **State Sync**: [Yjs](https://yjs.dev/) for Conflict-free Replicated Data Types (CRDTs).
- **Communication**: Custom WebSocket sync-server for broadcasting AI updates and editor state.
- **Media**: [LiveKit](https://livekit.io/) for real-time engagement and collaboration components.

### Implementation Details
- **Editor Implementation**: Custom BlockNote integration with specialized `ai_update_suggestion` blocks for seamless AI-human collaboration.
- **Visualization Engines**:
  - **Manim Engine**: Generates Python scripts for mathematical animations.
  - **P5.js Engine**: Generates self-contained HTML/JS sketches for browser embedding.
  - **React Flow**: Renders the core "project_roadmap" JSON structure into an interactive canvas.
- **Styling**: Modern, premium UI built with [Tailwind CSS v4](https://tailwindcss.com/) and [Framer Motion](https://www.framer.com/motion/) for fluid animations.

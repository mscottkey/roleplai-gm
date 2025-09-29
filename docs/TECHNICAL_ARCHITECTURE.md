# Technical Architecture

This document provides a high-level overview of the technical architecture for the RoleplAI GM application.

## Core Technologies

The application is built on a modern, serverless technology stack designed for performance, scalability, and rapid development.

*   **Frontend**: A Next.js 15 application using the **App Router**.
    *   **Language**: TypeScript
    *   **UI Framework**: React
    *   **UI Components**: ShadCN UI for a consistent, modern design system.
    *   **Styling**: Tailwind CSS for utility-first styling.
    *   **State Management**: Primarily relies on React hooks (`useState`, `useEffect`, `useContext`) and server state management via Next.js Server Actions and Firestore listeners.

*   **Backend & Database**:
    *   **Hosting**: Firebase App Hosting.
    *   **Database**: Google Firestore is used as the primary NoSQL database for storing all game sessions, user data, and world states. Real-time updates are achieved using Firestore's `onSnapshot` listeners.
    *   **Authentication**: Firebase Authentication handles user management, supporting both email/password and federated providers (Google).
    *   **Server Logic**: Next.js Server Actions are the primary mechanism for client-server communication. They are used to trigger AI flows, update the database, and perform other server-side tasks without requiring traditional API endpoints.

*   **Generative AI**:
    *   **Framework**: Genkit, a framework from Google for building production-ready AI-powered features.
    *   **Models**: The application leverages Google's Gemini family of models (e.g., `gemini-2.5-flash`) for all generative tasks, from world-building to in-game narration.
    *   **Flows**: Genkit "flows" are defined to encapsulate specific AI tasks. These flows are implemented as server-side TypeScript functions and are invoked via Server Actions.

## Directory Structure Overview

The project follows a standard Next.js App Router structure with some key additions for this specific application.

*   `src/app/`
    *   This is the heart of the Next.js application.
    *   `layout.tsx`: The root layout, which includes providers for theming, Firebase, and authentication.
    *   `page.tsx`: The public marketing/landing page.
    *   `play/page.tsx`: The main application page where all gameplay occurs. This is a client component that manages the majority of the application's state and orchestrates calls to server actions.
    *   `login/page.tsx`: The user authentication page.
    *   `admin/`: Contains pages for the admin dashboard.
    *   `actions.ts`: The central file defining most of the application's **Next.js Server Actions**. It acts as the bridge between client-side components and server-side logic, including AI flows and database operations.

*   `src/ai/`
    *   This directory contains all Genkit-related code.
    *   `flows/`: Each file defines a specific, self-contained AI task (e.g., `generate-new-game.ts`, `update-world-state.ts`). These are the core generative logic units of the application.
    *   `prompts/`: Contains the text of the prompts used by the AI flows. Separating prompts makes them easier to manage and refine.
    *   `schemas/`: Contains Zod schemas that define the expected input and output structures for the AI flows. This ensures type safety and predictable AI responses.
    *   `genkit.ts`: The main Genkit configuration file.

*   `src/components/`
    *   Contains all reusable React components.
    *   `ui/`: Base components provided by ShadCN UI (Button, Card, etc.).
    *   `game-view.tsx`: The main component that lays out the storyboard and the chat/controls interface.
    *   `character-creation-form.tsx`: The component that manages the party-building UI and logic.
    *   `app-shell.tsx`: The main application shell, including the sidebar for game navigation.

*   `src/hooks/`
    *   `use-auth.tsx`: A custom React hook that provides authentication state (user, loading status, admin status) to components throughout the app.
    *   `use-speech-synthesis.ts`: A hook that abstracts the browser's Web Speech API for Text-to-Speech functionality.

*   `src/lib/`
    *   Contains utility functions and type definitions.
    *   `firebase.ts`: Initializes the Firebase client SDK.
    *   `types.ts`: Core TypeScript type definitions used across the application (e.g., `GameSession`, `Character`).

## Data Flow Example: A Player Takes an Action

1.  **UI**: The user types "I attack the goblin" into the `ChatInterface` component in `src/components/chat-interface.tsx`.
2.  **Client State**: The `onSendMessage` handler in `src/app/play/page.tsx` is called.
3.  **Server Action**: `play/page.tsx` invokes the `continueStory` server action from `src/app/actions.ts`, passing the action description and the current world state.
4.  **AI Flow**: The `continueStory` action calls the `resolveAction` Genkit flow (`src/ai/flows/integrate-rules-adapter.ts`).
5.  **AI Generation**: The `resolveAction` flow uses a Gemini model to generate a narrative outcome for the player's action, based on the provided world state and character data.
6.  **World State Update**: The result is returned to `play/page.tsx`, which then calls another server action, `updateWorldState`. This action uses another AI flow (`update-world-state.ts`) to intelligently update the game's summary and recent events based on the action's outcome.
7.  **Database**: The `updateWorldState` action saves the new world state and the new messages to the game's document in Firestore.
8.  **Real-time Update**: The `onSnapshot` listener in `src/app/play/page.tsx` detects the change in the Firestore document and automatically updates the client-side state, causing the UI to re-render with the new narration and game state.

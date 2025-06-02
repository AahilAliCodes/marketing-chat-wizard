
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Research from "./pages/Research";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SharedChat from "./pages/SharedChat";
import AnalysisError from "./pages/AnalysisError";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ChatProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/research" element={<Research />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/shared-chat/:chatId" element={<SharedChat />} />
                <Route path="/analysis-error" element={<AnalysisError />} />
                {/* Redirect old routes to new ones */}
                <Route path="/reddit-generator" element={<Navigate to="/research" replace />} />
                <Route path="/runs" element={<Navigate to="/dashboard" replace />} />
                {/* Catch-all route for 404 - MUST be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Analytics />
          </ChatProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

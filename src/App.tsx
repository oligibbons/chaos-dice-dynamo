import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NavBar from "@/components/NavBar";
import SoundManagerComponent from "@/components/SoundManager";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lobby from "./pages/Lobby";
import JoinGame from "./pages/JoinGame";
import GameSetup from "./pages/GameSetup";
import Game from "./pages/Game";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Friends from "./pages/Friends";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SoundManagerComponent />
        <BrowserRouter>
          <NavBar />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/lobby" element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              } />
              <Route path="/join-game" element={
                <ProtectedRoute>
                  <JoinGame />
                </ProtectedRoute>
              } />
              <Route path="/game/:gameId/setup" element={
                <ProtectedRoute>
                  <GameSetup />
                </ProtectedRoute>
              } />
              <Route path="/game/:gameId" element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/friends" element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              } />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

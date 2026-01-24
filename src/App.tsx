import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Project from "./pages/Project";
import Upload from "./pages/Upload";
import MyProjects from "./pages/MyProjects";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Moderation from "./pages/Moderation";
import ModerationLogs from "./pages/ModerationLogs";
import Leaderboards from "./pages/Leaderboards";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
import Donate from "./pages/Donate";
import Forum from "./pages/Forum";
import ForumQuestion from "./pages/ForumQuestion";
import SellerRequests from "./pages/SellerRequests";
import OrderChat from "./pages/OrderChat";
import GlobalChat from "./pages/GlobalChat";
import ChatModeration from "./pages/ChatModeration";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/project/:slug" element={<Project />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/my-projects" element={<MyProjects />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/moderation/logs" element={<ModerationLogs />} />
                <Route path="/leaderboards" element={<Leaderboards />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:recipientId" element={<Messages />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/support" element={<Support />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/forum/:questionId" element={<ForumQuestion />} />
                <Route path="/seller-requests" element={<SellerRequests />} />
                <Route path="/order/:requestId" element={<OrderChat />} />
                <Route path="/chat" element={<GlobalChat />} />
                <Route path="/chat/moderation" element={<ChatModeration />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

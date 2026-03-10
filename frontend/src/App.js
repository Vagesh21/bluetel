import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Podcasts from "@/pages/Podcasts";
import PodcastShow from "@/pages/PodcastShow";
import WhereToListen from "@/pages/WhereToListen";
import Events from "@/pages/Events";
import SubmitMusic from "@/pages/SubmitMusic";
import ShareStory from "@/pages/ShareStory";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminEpisodes from "@/pages/admin/AdminEpisodes";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminSubmissions from "@/pages/admin/AdminSubmissions";
import AdminSubscribers from "@/pages/admin/AdminSubscribers";
import AdminSettings from "@/pages/admin/AdminSettings";

function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" theme="dark" />
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/podcasts/where-to-listen" element={<WhereToListen />} />
            <Route path="/podcasts/:slug" element={<PodcastShow />} />
            <Route path="/events" element={<Events />} />
            <Route path="/community/submit-music" element={<SubmitMusic />} />
            <Route path="/community/share-a-story" element={<ShareStory />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="episodes" element={<AdminEpisodes />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="subscribers" element={<AdminSubscribers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PlayerProvider>
  );
}

export default App;

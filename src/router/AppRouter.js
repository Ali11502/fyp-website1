import React from "react";
import {BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "../pages/dashboard";
import FeatureCardsGrid from "../components/FeatureCard";
import ChatBot from '../pages/chatbot';
import Transcript from '../pages/transcript';
import StudyGuide from "../pages/studyguide";
import HighlightsReel from '../pages/highlights_reels';
import MeetingMinutes from '../pages/meetingminutes';
import EnglishDub from '../pages/englishdub'; // Add this import
import EnglishSub from '../pages/englishsub'; // Add this import
import Podcasts from '../pages/podcasts';
import Layout from '../components/layout';
import InteractiveChatBot from '../pages/interactivechatbot';
import FlashcardsGenerator from "../pages/flashcard";




const AppRouter = () => {
    return (
      <Router>
        <Layout>
        <Routes>
        <Route path="/" element={<Dashboard />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/interactivechatbot" element={<InteractiveChatBot />} />
          <Route path="/featuregrid" element={<FeatureCardsGrid/>}/>
          <Route path="/transcript" element={<Transcript />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/meetingminutes" element={<MeetingMinutes />}/>
          <Route path="/flashcard" element={<FlashcardsGenerator />}/>
          <Route path="/studyguide" element={<StudyGuide/>}/>
          <Route path="/englishdub" element={<EnglishDub />}/> {/* Add this route */}
          <Route path="/englishsub" element={<EnglishSub />}/> You'll need this route too
          <Route path="/highlights_reel" element={<HighlightsReel/>}/>
          
        </Routes>
        </Layout>
      </Router>
    );
  };
  
  export default AppRouter;
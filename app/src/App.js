import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import ChannelList from './ChannelList';
import MessageList from './MessageList';
import ReplyList from './ReplyList';
import ProfilePage from './Profile';
import LoginPage from './LoginPage';
import ProtectedRoute from './ProtectedRoute';
import { useParams } from 'react-router-dom';
import './App.css'


function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth]);

  useEffect(() => {
    const handleResize = () => {
    setSize([window.innerWidth]);
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

function ChannelAndMessages() {
  let { channelId, messageId } = useParams();
  const [width] = useWindowSize();
  const isNarrowScreen = width < 768;
  const navigate = useNavigate();

  useEffect(() => {
    if (!channelId && isNarrowScreen) {
      navigate('/channels'); 
    }
  }, [channelId, isNarrowScreen, navigate]);

  const renderContent = () => {
  // Logic to display ChannelList by default on narrow screens
  if (isNarrowScreen && !channelId && !messageId) {
    return <ChannelList />;
  }

  if (isNarrowScreen) {
    if (messageId) {
      return <ReplyList messageId={messageId} onClose={() => navigate(`/channels/${channelId}`)} />;
    } else if (channelId) {
      return <MessageList currentChannel={channelId} />;
    } 
  } else {
    return (
      <>
      <ChannelList />
      <MessageList currentChannel={channelId} />
      {messageId && <ReplyList messageId={messageId} onClose={() => navigate(`/channels/${channelId}`)} />}
      </>
    );
  }
};

return <div className="channel-content">{renderContent()}</div>;
}

function App() {
  return (
    <Router>
      <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/channels" element={<ProtectedRoute><ChannelAndMessages /></ProtectedRoute>} />
        <Route path="/channels/:channelId" element={<ProtectedRoute><ChannelAndMessages /></ProtectedRoute>} />
        <Route path="/channels/:channelId/replies/:messageId" element={<ProtectedRoute><ChannelAndMessages /></ProtectedRoute>} />
        <Route path="/" element={<Navigate replace to="/channels/1" />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;



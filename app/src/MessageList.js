import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MessageList({ currentChannel, setSelectedMessageId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [showReactionMenuForMessageId, setShowReactionMenuForMessageId] = useState(null);

    const navigate = useNavigate();
        
    const apiKey = localStorage.getItem('api_key'); 

    // Function to fetch messages
    const fetchMessages = () => {
        if (!currentChannel) return;

        fetch(`/api/channels/${currentChannel}/messages`, {
        method: 'GET',
        headers: {
            'API-Key': apiKey
        },
        })
        .then(response => response.json())
        .then(data => {
        setMessages(data);
        })
        .catch(error => console.error('Error fetching messages:', error));
    };

    useEffect(() => {
        fetchMessages(); // Fetch messages initially

        const intervalId = setInterval(() => {
        fetchMessages(); // Fetch messages every 5000 ms
        }, 500);

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [currentChannel, apiKey]); // Re-run effect if currentChannel changes


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return; 

        try {
        const response = await fetch(`/api/channels/${currentChannel}/messages`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey 
            },
            body: JSON.stringify({ message: newMessage }),
        });

        if (!response.ok) {
            throw new Error('Failed to post message');
        }

        setNewMessage(''); 

        } catch (error) {
        console.error('Error posting message:', error);
        }
    };

    const handleReplyClick = (messageId) => {
        navigate(`/channels/${currentChannel}/replies/${messageId}`);
        setSelectedMessageId(messageId);
    };

    const handleAddReaction = async (messageId, emoji) => {
        const apiKey = localStorage.getItem('api_key'); 
    
        try {
        const response = await fetch(`/api/messages/${messageId}/reactions`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey 
            },
            body: JSON.stringify({ emoji: emoji }), 
        });
    
        if (!response.ok) {
            
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add reaction');
        }
    
        console.log('Reaction added successfully');
        } catch (error) {
        console.error('Error adding reaction:', error);
        } finally {
        setShowReactionMenuForMessageId(null);
        }
    };

    function parseMessageAndDisplayImages(message) {
        // Regular expression to match image URLs (basic version, consider enhancing for more formats)
        const imageUrlPattern = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
        // Split the message by the image URL
        const parts = message.split(imageUrlPattern);
    
        return parts.map((part, index) => {
        // Check if the part is an image URL
        if (part.match(imageUrlPattern)) {
            // Return an img element for the image URL
            return <img key={index} src={part} alt="Message Attachment" style={{maxWidth: '100px', maxHeight: '100px'}} />;
        } else {
            // Return a span for text
            return <span key={index}>{part}</span>;
        }
        });
    }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="message-item"
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
           <strong>{msg.name}:</strong> {parseMessageAndDisplayImages(msg.body)}
          {msg.num_replies > 0 && (
            <div onClick={() => handleReplyClick(msg.id)}>
              {msg.num_replies} of replies
            </div>
          )}
          {/* Display reactions */}
          <div className="reactions">
            {msg.reactions.map((reaction, index) => (
              <div key={index} className="reaction" title={reaction.userNames.join(', ')}>
                {reaction.emoji}
              </div>
            ))}
          </div>
          {hoveredMessageId === msg.id && (
            <div className="message-actions">
              <button onClick={() => handleReplyClick(msg.id)}>Reply to Thread</button>
              {/* Adjusted "Add Reaction" button */}
              <button onClick={() => setShowReactionMenuForMessageId(showReactionMenuForMessageId === msg.id ? null : msg.id)}>Add Reaction</button>
              {showReactionMenuForMessageId === msg.id && (
                <div className="reaction-menu">
                  <button onClick={() => handleAddReaction(msg.id, '❤️')}>❤️</button>
                  <button onClick={() => handleAddReaction(msg.id, '😊')}>😊</button>
                  <button onClick={() => handleAddReaction(msg.id, '😢')}>😢</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}


export default MessageList;
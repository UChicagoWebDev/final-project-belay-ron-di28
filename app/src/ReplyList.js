import React, { useState, useEffect } from 'react';

function ReplyList({ messageId, onClose }) {
  const [parentMessage, setParentMessage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');

  const apiKey = localStorage.getItem('api_key');

  // Define a function to fetch replies
  const fetchReplies = () => {
      if (!messageId) return;

      fetch(`/api/messages/${messageId}/replies`, {
          headers: {
              'API-Key': apiKey
          },
      })
      .then(response => response.json())
      .then(data => {
          setParentMessage(data.parentMessage);
          setReplies(data.replies);
      })
      .catch(error => console.error('Error fetching replies:', error));
  };

  useEffect(() => {
      fetchReplies(); // Fetch replies initially

      const intervalId = setInterval(fetchReplies, 500); // Poll for new replies every 5000 ms

      return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [messageId, apiKey]); // Re-run effect if messageId or apiKey changes

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!newReply.trim()) return;

      try {
          const response = await fetch(`/api/messages/${messageId}/replies`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'API-Key': apiKey
              },
              body: JSON.stringify({ message: newReply }),
          });

          if (!response.ok) {
              throw new Error('Failed to post reply');
          }

          setNewReply(''); // Clear the reply input field
          fetchReplies(); // Fetch the latest replies after posting a new one

      } catch (error) {
          console.error('Error posting reply:', error);
      }
  };

    return (
      <div className="reply-list">
        <button className="close-btn" onClick={onClose}>X</button>
        <div className="parent-message">
          <strong>{parentMessage?.name}:</strong> {parentMessage?.body}
        </div>
        <div className="replies">
          {replies.length > 0 ? (
            replies.map((reply, index) => (
              <div key={index} className="reply">
                <strong>{reply.name}:</strong> {reply.body}
              </div>
            ))
          ) : (
            <p>No replies yet</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="reply-form">
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Write a reply..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    );
}

export default ReplyList;
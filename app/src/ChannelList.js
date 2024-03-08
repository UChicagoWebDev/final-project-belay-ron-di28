import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ChannelList({}) {
    let navigate = useNavigate();
  
    const [channels, setChannels] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [selectedChannelId, setSelectedChannelId] = useState(null);
  
    const apiKey = localStorage.getItem('api_key');
    
    const goToProfile = () => {navigate('/profile');};
    const fetchChannelsAndUnreadCounts = () => {
        fetch('/api/channels', {
            method: 'GET', 
            headers: {
                'API-Key': apiKey
            }
        })
        .then(response => response.json())
        .then(data => {
            setChannels(data);
            // After channels are fetched, fetch unread message counts
            fetch('/api/channels/access', {
                method: 'GET',
                headers: {
                    'API-Key': apiKey
                },
            })
            .then(response => response.json())
            .then(data => {
                const unreadCounts = {};
                data.forEach(channel => {
                    unreadCounts[channel.channel_id] = channel.unread_messages;
                });
                setUnreadMessages(unreadCounts);
            })
            .catch(error => console.error('Error fetching unread messages:', error));
        })
        .catch(error => console.error('Error fetching channels:', error));
    };

    useEffect(() => {
        fetchChannelsAndUnreadCounts(); // Initial fetch

        const intervalId = setInterval(fetchChannelsAndUnreadCounts, 1000);

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []); // Dependencies array is empty, so this effect runs once on mount


    const selectChannel = async (channelId) => {
        setSelectedChannelId(channelId);
        navigate(`/channels/${channelId}`);
    
        try {
        const response = await fetch(`/api/channels/${channelId}/access`, {
            method: 'POST',
            headers: {
                'API-Key': apiKey
            }
        });
    
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
        console.log(data); 
        } catch (error) {
            console.error('Error updating last message seen:', error);
        }
    };

    const fetchChannels = () => {
        fetch('/api/channels', {
            method: 'GET', 
            headers: {
                'API-Key': apiKey
            },
        })
        .then(response => response.json())
        .then(data => setChannels(data))
        .catch(error => console.error('Error fetching channels:', error));
    };

    const handleCreateChannel = async () => {
        const channelName = prompt('Enter new channel name:');
        if (!channelName) return; 

        try {
        const response = await fetch('/api/channels/new', { 
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey
            },
            body: JSON.stringify({ name: channelName }),
        });

        if (!response.ok) {
            throw new Error('Failed to create channel');
        }
        fetchChannels();
        } catch (error) {
        console.error('Error creating channel:', error);
        }
    };

    return (
        <div className="channel-list">
        <h2 className="channel-header">Channels</h2>
        {channels.map(channel => (
            <div className={`channel-item ${channel.id === selectedChannelId ? 'active' : ''}`} key={channel.id} onClick={() => selectChannel(channel.id)}>
            {channel.name}
            {unreadMessages[channel.id] ? ` (${unreadMessages[channel.id]} unread)` : ''}
            </div>
        ))}
        <button onClick={handleCreateChannel}>Create New Channel</button>
        <button onClick={goToProfile}>Go to Profile</button>
        </div>
    );
}

export default ChannelList;
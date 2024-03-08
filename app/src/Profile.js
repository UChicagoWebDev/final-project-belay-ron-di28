import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
    const navigate = useNavigate();
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const apiKey = localStorage.getItem('api_key');
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');

    const handleLogout = () => {
        // Clear sessionStorage and localStorage on logout
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('password');
        localStorage.removeItem('api_key');
    
        // Redirect to login page
        navigate('/login');
    };

    const handleGoHome = () => {
        navigate('/'); 
    };

    const handleChangeUsername = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': apiKey
                }, 
                body: JSON.stringify({ new_username: newUsername }),
            });

            if (!response.ok) {
                throw new Error('Failed to update username');
            }

            const data = await response.json();
            console.log(data.message);
            sessionStorage.setItem('username', newUsername);
        } catch (error) {
            console.error('Error updating username:', error);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': apiKey
                }, 
                body: JSON.stringify({ new_password: newPassword }),
            });

            if (!response.ok) {
                throw new Error('Failed to update password');
            }

            const data = await response.json();
            console.log(data.message);
            sessionStorage.setItem('password', newPassword);
        } catch (error) {
            console.error('Error updating password:', error);
        }
    };

    return (
        <div>
        <h2>Profile Page</h2>
        <form onSubmit={handleChangeUsername}>
            <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={username}
            required
            />
            <button type="submit">Change Username</button>
        </form>

        <form onSubmit={handleChangePassword}>
            <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={password}
            required
            />
            <button type="submit">Change Password</button>
        </form>
        <button onClick={handleLogout}>Log Out</button>
        <button onClick={handleGoHome}>Let's Go</button> 
        </div>
    );
}

export default ProfilePage;
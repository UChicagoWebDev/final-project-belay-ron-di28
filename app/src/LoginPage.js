import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    let navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
        const response = await fetch('/api/login', {
            method: 'GET',
            headers: {
            'Username': username,
            'Password': password,
            },
        });
        
        if (!response.ok) {
            throw new Error('User not found');
        }

        const { api_key } = await response.json();
        localStorage.setItem('api_key', api_key); 
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('password', password);

        console.log('Login successful:', api_key);
        navigate('/profile');
        } catch (error) {
        console.error('Error during login:', error);
        }
    };

    const handleCreateAccountSubmit = async (e) => {
        e.preventDefault();
        try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to create account');

        const data = await response.json();
        localStorage.setItem('api_key', data.api_key); 
        sessionStorage.setItem('username', data.username); 
        sessionStorage.setItem('password', data.password); 
        console.log('Account created:', data);
        navigate('/profile'); 
        } catch (error) {
        console.error('Error creating account:', error);
        }
    };

    return (
        <div>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
        </form>
        <h2>Or</h2>
        <button onClick={handleCreateAccountSubmit}>Create an Account</button>
        </div>
    );
}

export default LoginPage;
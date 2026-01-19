import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCol,
  MDBRow,
  MDBInput,
  MDBIcon
} from 'mdb-react-ui-kit';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store JWT token and username
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('username', username);

      // Clear form and redirect to events page
      setUsername('');
      setPassword('');
      setLoading(false);
      navigate('/events');
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <MDBContainer fluid>

      <div className="p-5 bg-image" style={{backgroundImage: 'url(https://mdbootstrap.com/img/new/textures/full/171.jpg)', height: '300px'}}></div>

      <MDBCard className='mx-5 mb-5 p-5 shadow-5' style={{marginTop: '-100px', background: '#9E58C6', backdropFilter: 'blur(30px)'}}>
        <MDBCardBody className='p-5 text-center'>

          <h2 className="fw-bold mb-5">Welcome back!</h2>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <form onSubmit={handleLogin}>
            <MDBInput 
              wrapperClass='mb-4' 
              label='Username' 
              id='username' 
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <MDBInput 
              wrapperClass='mb-4' 
              label='Password' 
              id='password' 
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <MDBBtn className='w-100 mb-4' size='md' type='submit' disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </MDBBtn>
          </form>

          <div className="text-center">
            <p>Don't have an account? <a href="/signup" style={{ color: '#ffffff', textDecoration: 'underline' }}>Sign up</a></p>
          </div>

        </MDBCardBody>
      </MDBCard>

    </MDBContainer>
  );
}

export default Login;

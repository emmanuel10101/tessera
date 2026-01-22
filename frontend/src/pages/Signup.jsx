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

function App() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_BASE_URL;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      // Create user in database
      const createUserResponse = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      });

      const createUserData = await createUserResponse.json();

      if (!createUserResponse.ok) {
        setError(createUserData.error || 'Sign up failed');
        setLoading(false);
        return;
      }

      // Automatically login the user
      const loginResponse = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setError(loginData.error || 'Auto-login failed');
        setLoading(false);
        return;
      }

      // Store JWT token and username
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('username', username);

      // Clear form and redirect to events page
      setUsername('');
      setEmail('');
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

          <h2 className="fw-bold mb-5">Sign up now!</h2>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <form onSubmit={handleSignUp}>
            <MDBRow>
              <MDBCol col='6'>
                <MDBInput 
                  wrapperClass='mb-4' 
                  label='Username' 
                  id='username' 
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </MDBCol>
            </MDBRow>

            <MDBInput 
              wrapperClass='mb-4' 
              label='Email' 
              id='email' 
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Signing up...' : 'Sign up'}
            </MDBBtn>
          </form>
        </MDBCardBody>
      </MDBCard>

    </MDBContainer>
  );
}

export default App;
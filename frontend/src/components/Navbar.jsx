import React from 'react';
import { Box, Flex, Text, Button, Spacer } from '@chakra-ui/react';
import { MoonIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState(null);

  React.useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername);

    // Listen for logout event
    const handleLogout = () => {
      setUsername(null);
    };

    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);

  const handleProfileClick = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <Flex bg="#9E58C6" color="blackAlpa" p='11' alignItems="center">
      <Button colorScheme="blackAlpha" variant='ghost'
              onClick={() => navigate('/events')} p='2' pt='5' cursor="pointer">
        <Text fontSize="xl" fontWeight="bold">Tessera Events</Text>
      </Button>
      <Spacer />
      <Button colorScheme="blackAlpha" variant='ghost'> <MoonIcon color='blackAlpha'/> </Button>
      <Box>
        <Button colorScheme="blackAlpha" variant='ghost' onClick={handleProfileClick}>
          {username ? username : 'Profile'}
        </Button>
      </Box>
    </Flex>
  );
}

export default Navbar;
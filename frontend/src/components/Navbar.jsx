import React from 'react';
import { Box, Flex, Text, Button, Spacer, useColorMode } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState(null);
  const { colorMode, toggleColorMode } = useColorMode();

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
    <Flex bg="teal" color="blackAlpa" p='11' alignItems="center">
      <Button colorScheme="black" variant='ghost'
              onClick={() => navigate('/events')} p='2' pt='5' cursor="pointer">
        <Text fontSize="xl" fontWeight="bold">Tessera Events</Text>
      </Button>
      <Spacer />
      <Button 
        colorScheme="blackAlpha"
        variant='ghost'
        onClick={toggleColorMode}
        p={2}
      > 
        {colorMode === 'light' ? <MoonIcon color='black' w={5} h={5} /> : <SunIcon color='white' w={5} h={5} />}
      </Button>
      <Box>
        <Button colorScheme="black" variant='ghost' onClick={handleProfileClick}>
          {username ? username : 'Sign in'}
        </Button>
      </Box>
    </Flex>
  );
}

export default Navbar;
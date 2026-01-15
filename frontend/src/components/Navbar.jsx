import React from 'react';
import { Box, Flex, Text, Button, Spacer } from '@chakra-ui/react';
import { MoonIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  return (
    <Flex bg="#9E58C6" color="blackAlpa" p='11' alignItems="center">
      <Button colorScheme="blackAlpha" variant='ghost'
              onClick={() => navigate('/events')} p='2' pt='5' cursor="pointer">
        <Text fontSize="xl" fontWeight="bold">Tessera Events</Text>
      </Button>
      <Spacer />
      <Button colorScheme="blackAlpha" variant='ghost'> <MoonIcon color='blackAlpha'/> </Button>
      <Box>
        <Button colorScheme="blackAlpha" variant='ghost'>Profile</Button>
      </Box>
    </Flex>
  );
}

export default Navbar;
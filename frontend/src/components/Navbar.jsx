import React from 'react';
import { Box, Flex, Text, Button, Spacer } from '@chakra-ui/react';
import { MoonIcon } from '@chakra-ui/icons'

function Navbar() {
  return (
    <Flex bg="purple.500" color="white" p="4" alignItems="center">
      <Box p="2">
        <Text fontSize="xl" fontWeight="bold">Tessera Events</Text>
      </Box>
      <Spacer />
      <Button variant='outline'> <MoonIcon color='white'/> </Button>
      <Box>
        <Button colorScheme="white" variant="outline">Profile</Button>
      </Box>
    </Flex>
  );
}

export default Navbar;
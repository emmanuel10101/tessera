import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, SimpleGrid, Box, Text, Button, Heading, Spinner, VStack } from '@chakra-ui/react';
import EventCard from '../components/EventCard';

function Profile() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('access_token');
            navigate('/login');
            return;
          }
          const data = await response.json();
          setError(data.error || 'Failed to fetch tickets');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setTickets(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to connect to server. Please try again.');
        setLoading(false);
      }
    };

    fetchTickets();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('logout'));
    navigate('/events');
  };

  if (loading) {
    return (
      <Container maxW="container.xl" centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" centerContent py={5}>
      <VStack spacing={6} width="100%">
        <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl">My Tickets</Heading>
          <Button colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        {error && (
          <Box bg="red.100" p={4} borderRadius="md" width="100%">
            <Text color="red.800">{error}</Text>
          </Box>
        )}

        {tickets.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Heading as="h2" size="lg" mb={4}>No tickets yet</Heading>
            <Text mb={6}>You haven't purchased any tickets yet.</Text>
            <Button colorScheme="purple" onClick={() => navigate('/events')}>
              Browse Events
            </Button>
          </Box>
        ) : (
          <VStack spacing={3} width="100%">
            {tickets.map(ticket => (
              <Box key={ticket.id} borderWidth="1px" borderRadius="md" p={3} width="100%">
                {ticket.imageUrl && (
                  <Box mb={2} width="100%" maxHeight="120px" overflow="hidden" borderRadius="md">
                    <img src={ticket.imageUrl} alt={ticket.name} style={{ width: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
                <Heading size="sm" mb={2}>{ticket.name}</Heading>
                
                <VStack align="start" spacing={1} mb={2} fontSize="sm">
                  <Text><strong>Date:</strong> {ticket.date}</Text>
                  <Text><strong>Time:</strong> {ticket.time}</Text>
                  <Text><strong>Location:</strong> {ticket.location}</Text>
                </VStack>

                <Box bg="gray.100" p={2} borderRadius="md" mb={2}>
                  <Heading size="xs" mb={1}>Your Seat</Heading>
                  <Text fontSize="sm"><strong>Row {ticket.rowName}, Seat {ticket.seatNumber}</strong></Text>
                  <Text fontSize="xs" color="gray.600">Barcode: {ticket.barcode}</Text>
                  <Text fontSize="xs" color="gray.600">Purchased: {new Date(ticket.purchasedAt).toLocaleDateString()}</Text>
                </Box>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}

export default Profile;

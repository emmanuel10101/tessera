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
          <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={10} width="100%">
            {tickets.map(ticket => (
              <EventCard
                key={ticket.ticket_id}
                id={ticket.event_id}
                name={ticket.name}
                date={ticket.date}
                time={ticket.time}
                location={ticket.location}
                imageUrl={ticket.imageUrl}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
}

export default Profile;

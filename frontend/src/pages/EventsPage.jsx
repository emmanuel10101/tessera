import React, { useEffect, useState } from 'react';
import { SimpleGrid, Container } from '@chakra-ui/react';
import { Box, Flex, Text, Button, Spacer, Input } from '@chakra-ui/react';
import EventCard from '../components/EventCard';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const BASE_URL = process.env.REACT_APP_BASE_URL;

  // Fill the events array with events from the backend
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`${BASE_URL}/events?afterDate=${today}`)
      .then(response => response.json())
      .then(setEvents)
      .catch(error => console.error('Error fetching events:', error));
  }, []);

  // Filter events based on search input
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <Container maxW="container.xl" centerContent>
      <Input 
        placeholder='Search Events' 
        htmlSize={40}
        width='auto'
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        mb={5}
      />
      <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={10} py={5}>
        {filteredEvents.map(event => (
          <EventCard
            id={event.event_id}
            name={event.name}
            date={event.date}
            time={event.time}
            location={event.location}
            imageUrl={event.imageUrl} 
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}

export default EventsPage;
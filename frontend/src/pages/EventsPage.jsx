import React, { useEffect, useState } from 'react';
import { SimpleGrid, Container } from '@chakra-ui/react';
import { Box, Flex, Text, Button, Spacer, Input } from '@chakra-ui/react';
import EventCard from '../components/EventCard';

function EventsPage() {
  const [events, setEvents] = useState([]);

  // Fill the events array with events from the backend
  useEffect(() => {
    fetch('http://localhost:5000/events')
      .then(response => response.json())
      .then(setEvents)
      .catch(error => console.error('Error fetching events:', error));
  }, []);

  return (
    <Container maxW="container.xl" centerContent>
      <Input placeholder='Search Bar' htmlSize={40} width='auto'/>
      <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={10} py={5}>
        {events.map(event => (
          <EventCard
            key={event.event_id}
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
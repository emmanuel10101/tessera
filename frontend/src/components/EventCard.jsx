import React, { useEffect, useState } from 'react';
import { Box, Image, Text, VStack, Heading, LinkBox, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function EventCard({ id, name, date, time, location, imageUrl }) {
  const [timeLeft, setTimeLeft] = useState('');
  const navigate = useNavigate();

  const handleBuyTickets = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate(`/events/${id}`);
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const updateTimer = () => {
      const eventDate = new Date(date + " " + time).getTime();
      const now = new Date().getTime();
      const distance = eventDate - now;

      if (distance < 0) {
        setTimeLeft('Event has started');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Update the timer text
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    // Update the timer every second
    const timerId = setInterval(updateTimer, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(timerId);
  }, [date]);

  return (
    <LinkBox as="article" w="full" borderWidth="1px" rounded="md" overflow="hidden" boxShadow="md">
      <VStack align="stretch">
        {imageUrl && (
          <Image borderRadius="md" src={imageUrl} alt={`Image for ${name}`} objectFit="cover" width="full" />
        )}
        <VStack align="stretch" p="4">
        <Heading size="md" my="2">{name}</Heading>
          <Text fontSize="sm">Date: {date}</Text>
          <Text fontSize="sm">Location: {location}</Text>
          <Text fontSize="sm" color="red.500">{timeLeft}</Text>
          <Button colorScheme="teal" mt="4" onClick={handleBuyTickets}>
            Buy Tickets!
          </Button>
        </VStack>
      </VStack>
    </LinkBox>
  );
}

export default EventCard;
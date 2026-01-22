import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Text, Button, Spinner, Box } from '@chakra-ui/react';
const BASE_URL = process.env.REACT_APP_BASE_URL;

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState({});
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.REACT_APP_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const eventRes = await fetch(`${BASE_URL}/events`);
        const events = await eventRes.json();
        const eventData = events.find(e => e.event_id === parseInt(id));
        setEvent(eventData);

        const seatsRes = await fetch(`${BASE_URL}/events/${id}/seats-with-prices`);
        const seatsData = await seatsRes.json();
        setSeats(seatsData);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const toggleSeat = async (rowName, seatNumber) => {
    const seatId = `${rowName}${seatNumber}`;
    
    if (selected.includes(seatId)) {
      setSelected(selected.filter(s => s !== seatId));
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${BASE_URL}/reserve_seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: parseInt(id),
          seats: [{ rowName, seatNumber }]
        })
      });
      setSelected([...selected, seatId]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getTotalPrice = () => {
    let total = 0;
    selected.forEach(seatId => {
      const match = seatId.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const rowName = match[1];
        const seatNum = parseInt(match[2]);
        const seat = seats[rowName]?.find(s => s.seatNumber === seatNum);
        if (seat) total += seat.priceCents;
      }
    });
    return total;
  };

  const handleCheckout = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const seatsToPurchase = selected.map(seatId => {
      const match = seatId.match(/^([A-Z]+)(\d+)$/);
      return { rowName: match[1], seatNumber: parseInt(match[2]) };
    });

    try {
      const res = await fetch(`${BASE_URL}/purchase_seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event_id: parseInt(id), seats: seatsToPurchase })
      });

      if (res.ok) navigate('/profile');
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const totalPrice = getTotalPrice();
  const totalDollars = (totalPrice / 100).toFixed(2);

  return (
    <Container py={8}>
      {event && (
        <>
          <Heading>{event.name}</Heading>
          <Text>{event.description}</Text>
        </>
      )}

      <Box mt={8}>
        <Heading size="md">Select Seats</Heading>
        {Object.entries(seats).map(([rowName, rowSeats]) => (
          <Box key={rowName} mb={4}>
            <Text fontWeight="bold">{rowName}</Text>
            <Box display="flex" gap={2} flexWrap="wrap">
              {rowSeats.map(seat => (
                <Button
                  key={`${rowName}${seat.seatNumber}`}
                  onClick={() => toggleSeat(rowName, seat.seatNumber)}
                  colorScheme={
                    seat.status === 'SOLD' ? 'red' :
                    selected.includes(`${rowName}${seat.seatNumber}`) ? 'green' :
                    'blue'
                  }
                  isDisabled={seat.status === 'SOLD'}
                  size="sm"
                >
                  {seat.seatNumber}
                </Button>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      <Box mt={6}>
        <Text>Selected: {selected.join(', ') || 'None'}</Text>
        <Text fontSize="lg" fontWeight="bold">Total: ${totalDollars}</Text>
        <Button mt={4} colorScheme="green" onClick={handleCheckout} isDisabled={selected.length === 0}>
          Checkout - ${totalDollars}
        </Button>
      </Box>
    </Container>
  );
}

export default EventDetail;
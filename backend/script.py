import sqlite3
import string

DB_PATH = "../database/tessera.db"

def create_event_with_tickets(event_name, num_rows, seats_per_row):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    curr = conn.cursor()

    try:
        # 1. Create the event
        curr.execute(
            """
            INSERT INTO Events (name)
            VALUES (?);
            """,
            (event_name,)
        )

        event_id = curr.lastrowid
        print(f"Created event '{event_name}' with event_id = {event_id}")

        # 2. Create a default price tier
        curr.execute(
            """
            INSERT INTO PriceTiers (event_id, name, priceCents)
            VALUES (?, ?, ?);
            """,
            (event_id, "Middle", 10000)
        )

        price_tier_id = curr.lastrowid
        print(f"Created default price tier with id = {price_tier_id}")

        # 3. Generate tickets
        rows = string.ascii_uppercase[:num_rows]

        tickets = []
        for row in rows:
            for seat in range(1, seats_per_row + 1):
                tickets.append(
                    (event_id, row, seat, "AVAILABLE", price_tier_id)
                )

        curr.executemany(
            """
            INSERT INTO Tickets (
                event_id,
                rowName,
                seatNumber,
                status,
                priceTierId
            )
            VALUES (?, ?, ?, ?, ?);
            """,
            tickets
        )

        print(f"Created {len(tickets)} tickets")

        conn.commit()

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        conn.close()


if __name__ == "__main__":
    event_name = input("Event name: ")
    num_rows = int(input("Number of rows: "))
    seats_per_row = int(input("Seats per row: "))

    create_event_with_tickets(event_name, num_rows, seats_per_row)
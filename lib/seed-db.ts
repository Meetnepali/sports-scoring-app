import { query } from "./database"

export async function seedDatabase() {
  try {
    // Insert cricket teams
    const cricketTeam1 = await query(
      `
      INSERT INTO teams (name, sport, logo)
      VALUES ('Royal Challengers', 'cricket', NULL)
      RETURNING id
    `,
    )

    const cricketTeam2 = await query(
      `
      INSERT INTO teams (name, sport, logo)
      VALUES ('Mumbai Indians', 'cricket', NULL)
      RETURNING id
    `,
    )

    // Insert cricket players for team 1
    const cricketPlayers1 = [
      { name: "Virat Kohli", number: 18 },
      { name: "AB de Villiers", number: 17 },
      { name: "Glenn Maxwell", number: 32 },
      { name: "Mohammed Siraj", number: 73 },
      { name: "Yuzvendra Chahal", number: 3 },
      { name: "Devdutt Padikkal", number: 37 },
      { name: "Washington Sundar", number: 55 },
      { name: "Navdeep Saini", number: 96 },
      { name: "Kane Richardson", number: 12 },
      { name: "Adam Zampa", number: 88 },
      { name: "Josh Philippe", number: 22 },
    ]

    for (const player of cricketPlayers1) {
      await query(
        `
        INSERT INTO players (team_id, name, number)
        VALUES ($1, $2, $3)
      `,
        [cricketTeam1.rows[0].id, player.name, player.number],
      )
    }

    // Insert cricket players for team 2
    const cricketPlayers2 = [
      { name: "Rohit Sharma", number: 45 },
      { name: "Jasprit Bumrah", number: 93 },
      { name: "Hardik Pandya", number: 33 },
      { name: "Kieron Pollard", number: 55 },
      { name: "Quinton de Kock", number: 12 },
      { name: "Suryakumar Yadav", number: 63 },
      { name: "Ishan Kishan", number: 32 },
      { name: "Trent Boult", number: 18 },
      { name: "Krunal Pandya", number: 24 },
      { name: "Rahul Chahar", number: 1 },
      { name: "Anmolpreet Singh", number: 4 },
    ]

    for (const player of cricketPlayers2) {
      await query(
        `
        INSERT INTO players (team_id, name, number)
        VALUES ($1, $2, $3)
      `,
        [cricketTeam2.rows[0].id, player.name, player.number],
      )
    }

    // Insert volleyball teams
    const volleyballTeam1 = await query(
      `
      INSERT INTO teams (name, sport, logo)
      VALUES ('Thunderbolts', 'volleyball', NULL)
      RETURNING id
    `,
    )

    const volleyballTeam2 = await query(
      `
      INSERT INTO teams (name, sport, logo)
      VALUES ('Skyliners', 'volleyball', NULL)
      RETURNING id
    `,
    )

    // Insert volleyball players for team 1
    const volleyballPlayers1 = [
      { name: "John Smith", number: 1, position: "Setter" },
      { name: "Michael Johnson", number: 2, position: "Outside Hitter" },
      { name: "David Lee", number: 3, position: "Middle Blocker" },
      { name: "Robert Brown", number: 4, position: "Opposite" },
      { name: "James Wilson", number: 5, position: "Outside Hitter" },
      { name: "William Davis", number: 6, position: "Middle Blocker" },
      { name: "Richard Miller", number: 7, position: "Libero" },
    ]

    for (const player of volleyballPlayers1) {
      await query(
        `
        INSERT INTO players (team_id, name, number, position)
        VALUES ($1, $2, $3, $4)
      `,
        [volleyballTeam1.rows[0].id, player.name, player.number, player.position],
      )
    }

    // Insert volleyball players for team 2
    const volleyballPlayers2 = [
      { name: "Thomas Moore", number: 8, position: "Setter" },
      { name: "Charles Taylor", number: 9, position: "Outside Hitter" },
      { name: "Daniel Anderson", number: 10, position: "Middle Blocker" },
      { name: "Matthew Jackson", number: 11, position: "Opposite" },
      { name: "Anthony White", number: 12, position: "Outside Hitter" },
      { name: "Mark Harris", number: 13, position: "Middle Blocker" },
      { name: "Paul Martin", number: 14, position: "Libero" },
    ]

    for (const player of volleyballPlayers2) {
      await query(
        `
        INSERT INTO players (team_id, name, number, position)
        VALUES ($1, $2, $3, $4)
      `,
        [volleyballTeam2.rows[0].id, player.name, player.number, player.position],
      )
    }

    // Create a cricket match
    await query(
      `
      INSERT INTO matches (sport, home_team_id, away_team_id, match_date, venue, status)
      VALUES ('cricket', $1, $2, $3, $4, $5)
    `,
      [cricketTeam1.rows[0].id, cricketTeam2.rows[0].id, "2025-05-10T14:00:00", "Cricket Stadium", "scheduled"],
    )

    // Create a volleyball match
    await query(
      `
      INSERT INTO matches (sport, home_team_id, away_team_id, match_date, venue, status)
      VALUES ('volleyball', $1, $2, $3, $4, $5)
    `,
      [volleyballTeam1.rows[0].id, volleyballTeam2.rows[0].id, "2025-05-15T18:00:00", "Volleyball Court", "scheduled"],
    )

    console.log("Database seeded successfully")
  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  }
}

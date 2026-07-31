import players from "../data/players";
import standings from "../data/standings";

function Standings() {
  return (
    <>
      <h2>Current Standings</h2>

      <ol>
        {players.map((player) => (
          <li key={player}>{player}</li>
        ))}
      </ol>
    </>
  );
}

export default Standings;
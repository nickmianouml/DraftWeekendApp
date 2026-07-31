import { useEffect, useState } from "react";
import Card from "../components/Card";
import StandingCard from "../components/StandingCard";
import { getStandings } from "../services/googleSheets";

function Standings() {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    async function loadStandings() {
      const data = await getStandings();
      setStandings(data);
    }

    loadStandings();
  }, []);

  return (
    <Card icon="🏆" title="Current Standings">
      {standings.map((standing) => (
        <StandingCard
          key={standing.player}
          standing={standing}
        />
      ))}
    </Card>
  );
}

export default Standings;
import { useEffect, useState } from "react";
import { getStandings } from "../services/googleSheets";

function useStandings() {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    async function loadStandings() {
      const data = await getStandings();
      setStandings(data);
    }

    loadStandings();
  }, []);

  return standings;
}

export default useStandings;
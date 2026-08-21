import {
  getCachedData,
} from "../utils/dataCache";

import {
  cleanCsvValue,
  fetchCsvRows,
} from "./csv";

const ODDS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1015029653&single=true&output=csv";

const ODDS_CACHE_KEY =
  "source:odds";

const ODDS_TTL =
  300000;

const REQUEST_TIMEOUT =
  8000;

function clean(value) {
  return cleanCsvValue(
    value
  );
}

function normalizeText(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeTeam(value) {
  return clean(value)
    .split(
      /\s*\/\s*|\s*,\s*|\s*&\s*/
    )
    .map(normalizeText)
    .filter(Boolean)
    .sort()
    .join("|");
}

function isGameMatch(
  item,
  gameName
) {
  if (!gameName) {
    return true;
  }

  return (
    normalizeText(
      item.game
    ) ===
    normalizeText(
      gameName
    )
  );
}

async function loadOdds() {
  const rows =
    await fetchCsvRows(
      ODDS_URL,
      "Unable to load odds."
    );

  return rows
    .filter(
      (row) =>
        clean(
          row[0]
        ) &&
        clean(
          row[1]
        )
    )
    .map((row) => ({
      type:
        clean(
          row[0]
        ),

      game:
        clean(
          row[1]
        ),

      team1:
        clean(
          row[2]
        ),

      team2:
        clean(
          row[3]
        ),

      odds1:
        clean(
          row[4]
        ),

      odds2:
        clean(
          row[5]
        ),

      player1:
        clean(
          row[6]
        ),

      player2:
        clean(
          row[7]
        ),

      outrightOdds:
        clean(
          row[8]
        ),
    }));
}

export async function getOdds() {
  return getCachedData(
    ODDS_CACHE_KEY,
    loadOdds,
    {
      ttl:
        ODDS_TTL,

      timeout:
        REQUEST_TIMEOUT,
    }
  );
}

export async function getOddsForGame(
  gameName
) {
  const odds =
    await getOdds();

  return odds.filter(
    (item) =>
      isGameMatch(
        item,
        gameName
      )
  );
}

export function getMatchupOdds(
  odds,
  gameName,
  team1,
  team2
) {
  const firstTeam =
    normalizeTeam(
      team1
    );

  const secondTeam =
    normalizeTeam(
      team2
    );

  const matchupOdds =
    (odds || []).filter(
      (item) =>
        isGameMatch(
          item,
          gameName
        ) &&
        normalizeText(
          item.type
        ) ===
          "matchup"
    );

  const direct =
    matchupOdds.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) ===
          firstTeam &&
        normalizeTeam(
          item.team2
        ) ===
          secondTeam
    );

  if (direct) {
    return {
      odds1:
        direct.odds1,

      odds2:
        direct.odds2,
    };
  }

  const reversed =
    matchupOdds.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) ===
          secondTeam &&
        normalizeTeam(
          item.team2
        ) ===
          firstTeam
    );

  if (reversed) {
    return {
      odds1:
        reversed.odds2,

      odds2:
        reversed.odds1,
    };
  }

  return {
    odds1: "",
    odds2: "",
  };
}

export function getCaptainOdds(
  odds,
  gameName,
  captain1,
  captain2
) {
  const firstCaptain =
    normalizeText(
      captain1
    );

  const secondCaptain =
    normalizeText(
      captain2
    );

  const matchupOdds =
    (odds || []).filter(
      (item) =>
        isGameMatch(
          item,
          gameName
        ) &&
        normalizeText(
          item.type
        ) ===
          "matchup"
    );

  const direct =
    matchupOdds.find(
      (item) =>
        normalizeText(
          item.team1
        ) ===
          firstCaptain &&
        normalizeText(
          item.team2
        ) ===
          secondCaptain
    );

  if (direct) {
    return {
      odds1:
        direct.odds1,

      odds2:
        direct.odds2,
    };
  }

  const reversed =
    matchupOdds.find(
      (item) =>
        normalizeText(
          item.team1
        ) ===
          secondCaptain &&
        normalizeText(
          item.team2
        ) ===
          firstCaptain
    );

  if (reversed) {
    return {
      odds1:
        reversed.odds2,

      odds2:
        reversed.odds1,
    };
  }

  return {
    odds1: "",
    odds2: "",
  };
}

export function getOutrightOdds(
  odds,
  gameName,
  participant
) {
  const participantTeam =
    normalizeTeam(
      participant
    );

  const participantName =
    normalizeText(
      participant
    );

  const teamMatch =
    (odds || []).find(
      (item) => {
        if (
          !isGameMatch(
            item,
            gameName
          ) ||
          normalizeText(
            item.type
          ) !==
            "team outright"
        ) {
          return false;
        }

        const sourceTeam =
          normalizeTeam(
            [
              item.player1,
              item.player2,
            ]
              .filter(Boolean)
              .join(" / ")
          );

        return (
          sourceTeam ===
          participantTeam
        );
      }
    );

  if (teamMatch) {
    return (
      teamMatch.outrightOdds ||
      ""
    );
  }

  const playerMatch =
    (odds || []).find(
      (item) => {
        const itemType =
          normalizeText(
            item.type
          );

        const sourcePlayer =
          normalizeText(
            item.player1 ||
              item.team1
          );

        return (
          isGameMatch(
            item,
            gameName
          ) &&
          (
            itemType ===
              "individual outright" ||
            itemType ===
              "individual"
          ) &&
          sourcePlayer ===
            participantName
        );
      }
    );

  return (
    playerMatch?.outrightOdds ||
    playerMatch?.odds1 ||
    ""
  );
}

export function hasValidLiarsDiceOdds(
  odds
) {
  return (odds || []).some(
    (item) => {
      const itemType =
        normalizeText(
          item.type
        );

      return (
        normalizeText(
          item.game
        ) ===
          "liars dice" &&
        (
          itemType ===
            "individual outright" ||
          itemType ===
            "individual"
        ) &&
        normalizeText(
          item.player1 ||
            item.team1
        ) !== "" &&
        clean(
          item.outrightOdds ??
            item.odds1
        ) !== ""
      );
    }
  );
}

export function formatAmericanOdds(
  value
) {
  const raw =
    clean(
      value
    );

  if (!raw) {
    return "";
  }

  const number =
    Number(
      raw
    );

  if (
    Number.isNaN(
      number
    )
  ) {
    return raw;
  }

  if (
    number > 0
  ) {
    return `+${number}`;
  }

  return String(
    number
  );
}
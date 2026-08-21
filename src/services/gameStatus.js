import {
  cleanCsvValue,
} from "./csv";

import {
  getLiveSheetRows,
} from "./liveSheet";

export async function getGameStatuses() {
  const rows =
    await getLiveSheetRows();

  return rows
    .map((row) => ({
      game:
        cleanCsvValue(
          row[3]
        ),

      status:
        cleanCsvValue(
          row[4]
        ) ||
        "Not Started",
    }))
    .filter(
      (item) =>
        item.game
    );
}
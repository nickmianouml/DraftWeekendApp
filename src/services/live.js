import {
  cleanCsvValue,
} from "./csv";

import {
  getLiveSheetRows,
} from "./liveSheet";

export async function getLiveData() {
  const rows =
    await getLiveSheetRows();

  const liveData = {};

  rows.forEach((row) => {
    const metric =
      cleanCsvValue(
        row[0]
      );

    const value =
      cleanCsvValue(
        row[1]
      );

    if (!metric) {
      return;
    }

    liveData[metric] =
      value;
  });

  return liveData;
}
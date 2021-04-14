
export function getBoxBorderClass(mapDataFileExisting: boolean): string {
  if (mapDataFileExisting) {
    return "boxBorder"
  } else {
    return "boxBorderNoMapData"
  }
}

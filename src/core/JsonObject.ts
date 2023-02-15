import { util } from './util/util'

export abstract class JsonObject {

  public toJson(): string {
    return util.toFormattedJson(this)
  }

  public mergeIntoJson(jsonToMergeInto: string): string {
    // TODO: improve, jsonToMergeInto should only be changed where needed (not completely reformatted)
    const objectToMergeInto: Object = JSON.parse(jsonToMergeInto)
    const mergedObject: Object = {...objectToMergeInto, ...this}
    const mergedJson: string = util.toFormattedJson(mergedObject)
    return mergedJson
  }

}

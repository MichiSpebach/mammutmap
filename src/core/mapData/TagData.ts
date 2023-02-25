import { JsonObject } from '../JsonObject'

export abstract class TagData extends JsonObject {

    public constructor(
        public readonly name: string,
        public count: number
    ) {
        super()
    }
    
}
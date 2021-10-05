import { Data, DateDecoder, Decoder, Encodeable, EncodeContext, ObjectData, PlainObject } from "@simonbackx/simple-encoding"
import { SimpleError } from "@simonbackx/simple-errors";

/**
 * Points to a value in a object of type T that is filterable
 */
export abstract class FilterDefinition<T, FilterType extends Filter<T>, ValueType> implements Decoder<FilterType>{
    id: string
    name: string
    getValue: (object: T) => ValueType

    constructor(settings: { id: string, name: string, getValue: (object: T) => ValueType }) {
        this.id = settings.id
        this.name = settings.name
        this.getValue = settings.getValue
    }

    abstract decode(data: Data): FilterType
    abstract createFilter(): FilterType
}



/**
 * A filter is an encodebale structure, that is associated with a specific definition
 */

export abstract class Filter<T> implements Encodeable {
    definition: FilterDefinition<T, Filter<T>, any>

    abstract doesMatch(object: T): boolean
    abstract encode(context: EncodeContext): PlainObject

    clone(): Filter<T> {
        const o = new ObjectData(this.encode({ version: 0 }), { version: 0})
        return this.definition.decode(o)
    }
}

export class FilterDecoder<T> implements Decoder<Filter<T>> {
    definitions: FilterDefinition<T, Filter<T>, any>[]

    constructor(definitions: FilterDefinition<T, Filter<T>, any>[]) {
        this.definitions = definitions
    }
    
    decode(data: Data): Filter<T> {
        const definitionId = data.field("definitionId").string
        const definition = this.definitions.find(d => d.id === definitionId) 
        if (!definition) {
            throw new SimpleError({
                code: "invalid_definition",
                message: "De opgeslagen filter filtert op iets dat niet langer bestaat",
                field: data.addToCurrentField("definitionId")
            })
        }
        return definition.decode(data)
    }
}
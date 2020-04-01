import { Decoder } from "../classes/Decoder";
import { Data } from "../classes/Data";
import { ClientError } from "../../routing/classes/ClientError";

class StringDecoder implements Decoder<string> {
    decode(data: Data): string {
        if (typeof data.value == "string") {
            return data.value;
        }
        throw new ClientError({
            code: "invalid_field",
            message: `Expected a string at ${data.currentField}`,
            field: data.currentField
        });
    }
}

// We export an instance to prevent creating a new instance every time we need to decode a number
export default new StringDecoder();

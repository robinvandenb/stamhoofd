import sodium, { StringKeyPair } from "libsodium-wrappers";

class SodiumStatic {
    loaded = false;

    async loadIfNeeded() {
        await sodium.ready;
        this.loaded = true;
    }

    async getBoxPublicKeyBytes() {
        await this.loadIfNeeded();
        return sodium.crypto_box_PUBLICKEYBYTES
    }

    async getBoxPrivateKeyBytes() {
        await this.loadIfNeeded();
        return sodium.crypto_box_SECRETKEYBYTES
    }

    async getBoxNonceBytes() {
        await this.loadIfNeeded();
        return sodium.crypto_box_NONCEBYTES
    }

    async getBoxEncryptedPrivateKeyBytes() {
        await this.loadIfNeeded();
        return await this.getBoxPrivateKeyBytes() + await this.getBoxNonceBytes() + sodium.crypto_box_MACBYTES
    }

    async boxKeyPair(): Promise<StringKeyPair> {
        await this.loadIfNeeded();
        const keypair = sodium.crypto_box_keypair();

        // Somehow, the base64 encoding of sodium.js is not working correctly? (need to check and add test in libsodium)
        return {
            publicKey: Buffer.from(keypair.publicKey).toString("base64"),
            privateKey: Buffer.from(keypair.privateKey).toString("base64"),
            keyType: keypair.keyType,
        };
    }

    async signKeyPair(): Promise<StringKeyPair> {
        await this.loadIfNeeded();
        const keypair = sodium.crypto_sign_keypair();

        return {
            publicKey: Buffer.from(keypair.publicKey).toString("base64"),
            privateKey: Buffer.from(keypair.privateKey).toString("base64"),
            keyType: keypair.keyType,
        };
    }

    async verifySignature(signature: string, message: string, publicKey: string): Promise<boolean> {
        await this.loadIfNeeded();
        return sodium.crypto_sign_verify_detached(Buffer.from(signature, "base64"), message, Buffer.from(publicKey, "base64"));
    }

    async signMessage(message: string, privateKey: string): Promise<string> {
        await this.loadIfNeeded();
        return Buffer.from(sodium.crypto_sign_detached(message, Buffer.from(privateKey, "base64"))).toString("base64");
    }

    async sealMessageAuthenticated(message: string, publicKeyReceiver: string, privateKeySender: string): Promise<string> {
        await this.loadIfNeeded();

        // Hide the nonce implementation details from crypto_box_easy and include the bytes in the result so we can use it to decrypt again using the same nonce
        // Without having to worry about storing the nonce seperately
        const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
        const cyphertext = sodium.crypto_box_easy(Buffer.from(message, "utf8"), nonce, Buffer.from(publicKeyReceiver, "base64"), Buffer.from(privateKeySender, "base64"))

        const concatCyphertext = new Uint8Array([...nonce, ...cyphertext])

        // Convert to base64
        return Buffer.from(concatCyphertext).toString("base64");
    }

    async unsealMessageAuthenticated(concatCyphertext: string, publicKeySender: string, privateKeyReceiver: string): Promise<string> {
        await this.loadIfNeeded();

        // Read buffer
        const concatCyphertextBuffer = Buffer.from(concatCyphertext, "base64")
        if (concatCyphertextBuffer.length <= sodium.crypto_box_NONCEBYTES) {
            throw new Error("ciphertext is too short")
        }

        // Read nonce
        const nonce = concatCyphertextBuffer.slice(0, sodium.crypto_box_NONCEBYTES)
        const cyphertext = concatCyphertextBuffer.slice(sodium.crypto_box_NONCEBYTES)

        const messageBuffer = sodium.crypto_box_open_easy(cyphertext, nonce, Buffer.from(publicKeySender, "base64"), Buffer.from(privateKeyReceiver, "base64"))

        return Buffer.from(messageBuffer).toString("utf8")
    }

    async sealMessage(message: string, publicKey: string): Promise<string> {
        await this.loadIfNeeded();
        return Buffer.from(sodium.crypto_box_seal(Buffer.from(message, "utf8"), Buffer.from(publicKey, "base64"))).toString("base64");
    }

    async unsealMessage(ciphertext: string, publicKey: string, privateKey: string): Promise<string> {
        await this.loadIfNeeded();
        return Buffer.from(sodium.crypto_box_seal_open(Buffer.from(ciphertext, "base64"), Buffer.from(publicKey, "base64"), Buffer.from(privateKey, "base64"))).toString("utf8");
    }
}

export const Sodium = new SodiumStatic();

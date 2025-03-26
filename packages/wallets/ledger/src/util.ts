import './polyfills/index.js';

export function getDerivationPath(account?: number, change?: number): Buffer {
    const length = account !== undefined ? (change === undefined ? 3 : 4) : 2;
    const derivationPath = Buffer.alloc(1 + length * 4);

    let offset = derivationPath.writeUInt8(length, 0);
    offset = derivationPath.writeUInt32BE(harden(44), offset); // Using BIP44
    offset = derivationPath.writeUInt32BE(harden(501), offset); // Solana's BIP44 path

    if (account !== undefined) {
        offset = derivationPath.writeUInt32BE(harden(account), offset);
        if (change !== undefined) {
            derivationPath.writeUInt32BE(harden(change), offset);
        }
    }

    return derivationPath;
}

const BIP32_HARDENED_BIT = (1 << 31) >>> 0;

function harden(n: number): number {
    return (n | BIP32_HARDENED_BIT) >>> 0;
}

/**
 * Format a Buffer encoded BIP32 derivation path to its string representation
 *
 * @see {@link https://github.com/LedgerHQ/ledger-live/blob/706fe9dbb5022346d8e276d17c068937a80ad4d2/libs/ledgerjs/packages/hw-app-solana/src/Solana.ts Ledger Hardware Wallet Solana JavaScript bindings.}
 *
 * @param buffer The buffer containing the derivation path
 * @returns The parsed derivation path as a string, e.g. "m/44'/501'/0'/0'"
 */
export function toDerivationPath(buffer: Buffer): string {
    // First byte contains the length of path components
    const length = buffer.readUInt8(0);

    // We always have 44' and 501' as the first two components
    // Skip them and read account and change if available
    const path = ["44'", "501'"];

    // If length is at least 3, we have an account component
    if (length >= 3) {
        const accountWithHardening = buffer.readUInt32BE(9); // 1 byte + 2*4 bytes offset
        const account = accountWithHardening & ~BIP32_HARDENED_BIT; // Remove hardening bit
        path.push(`${account}'`);
    }

    // If length is at least 4, we have a change component
    if (length >= 4) {
        const changeWithHardening = buffer.readUInt32BE(13); // 1 byte + 3*4 bytes offset
        const change = changeWithHardening & ~BIP32_HARDENED_BIT; // Remove hardening bit
        path.push(`${change}'`);
    }

    return path.join('/');
}

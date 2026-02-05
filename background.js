// MV2 background script

const api = globalThis.browser ?? globalThis.chrome;
const STORAGE_KEY = "totpEntries";

api.runtime.onMessage.addListener((msg, sender) => {
    return (async () => {
        if (!msg || !msg.type) return;

        if (msg.type === "GET_ENTRY") {
            const origin = normalizeOrigin(msg.origin);
            const entry = await getEntry(origin);
            return { ok: true, entry };
        }

        if (msg.type === "SET_ENTRY") {
            const origin = normalizeOrigin(msg.origin);
            const { secretBase32, digits, period } = msg.entry ?? {};
            validateEntry({ secretBase32, digits, period });
            await setEntry(origin, { secretBase32, digits, period });
            return { ok: true };
        }

        if (msg.type === "DELETE_ENTRY") {
            const origin = normalizeOrigin(msg.origin);
            await deleteEntry(origin);
            return { ok: true };
        }

        if (msg.type === "GET_TOTP") {
            const origin = normalizeOrigin(msg.origin);
            const entry = await getEntry(origin);
            if (!entry) return { ok: false, error: "No TOTP configured for this site." };

            const code = await totp(entry.secretBase32, entry.period ?? 30, entry.digits ?? 6);
            const nowSec = Math.floor(Date.now() / 1000);
            const remaining = (entry.period ?? 30) - (nowSec % (entry.period ?? 30));
            return { ok: true, code, remaining };
        }
    })().catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
});

function normalizeOrigin(origin) {
    const u = new URL(origin);
    return u.origin;
}

function validateEntry({ secretBase32, digits, period }) {
    if (typeof secretBase32 !== "string" || secretBase32.trim().length < 8) {
        throw new Error("Secret must be a Base32 string (usually 16+ chars).");
    }
    if (digits != null && (![6, 7, 8].includes(Number(digits)))) {
        throw new Error("Digits must be 6, 7, or 8.");
    }
    if (period != null && (Number(period) < 15 || Number(period) > 120)) {
        throw new Error("Period must be between 15 and 120 seconds.");
    }
}

async function getAllEntries() {
    const res = await api.storage.local.get(STORAGE_KEY);
    return res[STORAGE_KEY] ?? {};
}

async function setAllEntries(entries) {
    await api.storage.local.set({ [STORAGE_KEY]: entries });
}

async function getEntry(origin) {
    const entries = await getAllEntries();
    return entries[origin] ?? null;
}

async function setEntry(origin, entry) {
    const entries = await getAllEntries();
    entries[origin] = {
        secretBase32: entry.secretBase32.trim().replace(/\s+/g, "").toUpperCase(),
        digits: Number(entry.digits ?? 6),
        period: Number(entry.period ?? 30)
    };
    await setAllEntries(entries);
}

async function deleteEntry(origin) {
    const entries = await getAllEntries();
    delete entries[origin];
    await setAllEntries(entries);
}

/* ---------------- TOTP (RFC 6238 defaults) ---------------- */

async function totp(secretBase32, period = 30, digits = 6) {
    const keyBytes = base32Decode(secretBase32);
    const counter = Math.floor(Date.now() / 1000 / period);

    const counterBytes = new Uint8Array(8);
    let x = counter;
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = x & 0xff;
        x = Math.floor(x / 256);
    }

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
    );

    const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, counterBytes));
    const offset = hmac[hmac.length - 1] & 0x0f;

    const binCode =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    const mod = 10 ** digits;
    return String(binCode % mod).padStart(digits, "0");
}

function base32Decode(input) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
    if (!clean.length) return new Uint8Array();

    let bits = 0;
    let value = 0;
    const out = [];

    for (const c of clean) {
        const idx = alphabet.indexOf(c);
        if (idx === -1) throw new Error("Secret contains non-Base32 characters.");
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            out.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return new Uint8Array(out);
}

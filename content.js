const api = globalThis.browser ?? globalThis.chrome;

function getOrigin() {
    return location.origin;
}

function isVisible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
}

function scoreOtpInput(input) {
    if (!(input instanceof HTMLInputElement)) return -1;
    if (input.disabled || input.readOnly) return -1;
    if (!isVisible(input)) return -1;

    const type = (input.type || "").toLowerCase();
    const ac = (input.autocomplete || "").toLowerCase();
    const name = (input.name || "").toLowerCase();
    const id = (input.id || "").toLowerCase();
    const placeholder = (input.placeholder || "").toLowerCase();
    const aria = (input.getAttribute("aria-label") || "").toLowerCase();

    let s = 0;

    // Strong signals
    if (ac === "one-time-code") s += 100;
    if (type === "tel") s += 20;
    if (type === "text" || type === "number") s += 10;

    // Common attribute hints
    const hay = `${name} ${id} ${placeholder} ${aria}`;
    if (/(otp|totp|2fa|mfa)/.test(hay)) s += 60;
    if (/(one[-\s]?time|verification|auth|security)\s*(code|token|pin)/.test(hay)) s += 50;
    if (/(code|token|pin)/.test(hay)) s += 15;

    // Length hints (many OTPs are 6 digits)
    const maxLen = Number(input.maxLength);
    if (maxLen === 6) s += 25;
    if (maxLen === 8) s += 10;

    // De-prioritize obvious non-OTP fields
    if (/(search|email|username|name|pass)/.test(hay)) s -= 50;
    if (type === "password") s -= 100;

    return s;
}

function findBestOtpInput() {
    const inputs = Array.from(document.querySelectorAll("input"));
    let best = null;
    let bestScore = 0;

    for (const inp of inputs) {
        const sc = scoreOtpInput(inp);
        if (sc > bestScore) {
            bestScore = sc;
            best = inp;
        }
    }

    // Require some minimum confidence
    console.debug("Best score: " + bestScore + " for input id: " + best.id);
    if (bestScore < 35) return null;
    return best;
}

function setInputValue(input, value) {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event("input", {bubbles: true}));
    input.dispatchEvent(new Event("change", {bubbles: true}));
}

let lastFillAt = 0;
let runs = 0;

async function tryAutofill() {
    runs++;
    console.debug("[TOTP autofill] tryAutofill runs:", runs);
    // Avoid spamming in SPAs
    const now = Date.now();
    if (now - lastFillAt < 3000) return;

    const otpInput = findBestOtpInput();
    if (!otpInput) return;

    // If already filled with digits, don't overwrite
    if (/^\d{6,8}$/.test((otpInput.value || "").trim())) return;

    const origin = getOrigin();
    const resp = await api.runtime.sendMessage({type: "GET_TOTP", origin});
    if (!resp?.ok) return;

    setInputValue(otpInput, resp.code);
    lastFillAt = now;
}

let enabled = false;
let t = 0;
let lastRun = 0;

async function init() {
    const resp = await api.runtime.sendMessage({type: "HAS_ENTRY", origin: location.origin});
    enabled = !!resp?.ok && !!resp.has;
    if (!enabled) return;

    schedule();
    setTimeout(schedule, 800);
    setTimeout(schedule, 2000);

    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {
        subtree: true,
        childList: true,
        // Consider enabling if problems occur on some sites
        // attributes: true,
        // attributeFilter: ["hidden", "aria-hidden"]
    });
}

function schedule() {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastRun < 1500) return;
    clearTimeout(t);
    t = setTimeout(() => {
        lastRun = Date.now();
        tryAutofill();
    }, 150);
}

init();
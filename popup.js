const api = globalThis.browser ?? globalThis.chrome;

function $(id) {
    return document.getElementById(id);
}

function setStatus(msg, ok = true) {
    const el = $("status");
    el.textContent = msg;
    el.style.color = ok ? "#0a0" : "#b00";
}

function sendMessage(msg) {
    // Firefox (browser.*): promise API
    if (api.runtime.sendMessage.length === 1) return api.runtime.sendMessage(msg);

    // Chrome (chrome.*): callback API + lastError
    return new Promise((resolve, reject) => {
        api.runtime.sendMessage(msg, (resp) => {
            const err = api.runtime.lastError;
            if (err) reject(new Error(err.message));
            else resolve(resp);
        });
    });
}

async function getActiveTab() {
    const tabs = await api.tabs.query({active: true, currentWindow: true});
    return tabs[0];
}

function originFromUrl(url) {
    return new URL(url).origin;
}

/* ---------- Advanced toggle ---------- */
function setAdvanced(open) {
    document.body.classList.toggle("adv-open", open);
    $("advToggle").setAttribute("aria-expanded", String(open));
}

function toggleAdvanced() {
    setAdvanced(!document.body.classList.contains("adv-open"));
}

$("advToggle").addEventListener("click", toggleAdvanced);
$("advToggle").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleAdvanced();
    }
});

/* ---------- Code display + copy ---------- */
async function refreshCode() {
    const tab = await getActiveTab();
    const origin = originFromUrl(tab.url);

    const res = await sendMessage({type: "GET_TOTP", origin});
    $("code").value = res?.ok ? res.code : "";
}

$("copy").addEventListener("click", async () => {
    const v = ($("code").value || "").trim();
    if (!v) return setStatus("No code to copy.", false);
    await navigator.clipboard.writeText(v);
    setStatus("Copied.");
});

/* ---------- Load / Save / Delete ---------- */
async function load() {
    const tab = await getActiveTab();
    const origin = originFromUrl(tab.url);

    $("site").textContent = origin;

    const res = await sendMessage({type: "GET_ENTRY", origin});
    if (res?.ok && res.entry) {
        $("secret").value = res.entry.secretBase32 ?? "";
        $("digits").value = String(res.entry.digits ?? 6);
        $("period").value = String(res.entry.period ?? 30);
        await refreshCode();
    } else {
        $("code").value = "";
    }
}

async function save() {
    try {
        const tab = await getActiveTab();
        const origin = originFromUrl(tab.url);

        const entry = {
            secretBase32: $("secret").value.trim(),
            digits: Number($("digits").value || 6),
            period: Number($("period").value || 30)
        };

        const res = await sendMessage({type: "SET_ENTRY", origin, entry});
        if (!res?.ok) throw new Error(res?.error || "Save failed");

        setStatus("Saved.");
        await refreshCode();
    } catch (e) {
        setStatus(String(e?.message ?? e), false);
    }
}

async function del() {
    try {
        const tab = await getActiveTab();
        const origin = originFromUrl(tab.url);

        const res = await sendMessage({type: "DELETE_ENTRY", origin});
        if (!res?.ok) throw new Error(res?.error || "Delete failed");

        $("secret").value = "";
        $("code").value = "";
        setStatus("Deleted.");
    } catch (e) {
        setStatus(String(e?.message ?? e), false);
    }
}

$("save").addEventListener("click", save);
$("delete").addEventListener("click", del);

$("openOptions").addEventListener("click", async () => {
    if (api.runtime.openOptionsPage) await api.runtime.openOptionsPage();
    else window.open(api.runtime.getURL("options.html"));
});

// Default: advanced collapsed
setAdvanced(false);
load();

const api = globalThis.browser ?? globalThis.chrome;

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

function $(id) {
    return document.getElementById(id);
}

function setStatus(msg, ok = true) {
    const el = $("status");
    el.textContent = msg;
    el.style.color = ok ? "#0a0" : "#b00";
}

async function getActiveTab() {
    const tabs = await api.tabs.query({active: true, currentWindow: true});
    return tabs[0];
}

function originFromUrl(url) {
    return new URL(url).origin;
}

async function load() {
    const tab = await getActiveTab();
    const origin = originFromUrl(tab.url);

    $("site").textContent = origin;

    const res = await sendMessage({type: "GET_ENTRY", origin});
    if (res?.ok && res.entry) {
        $("secret").value = res.entry.secretBase32 ?? "";
        $("digits").value = String(res.entry.digits ?? 6);
        $("period").value = String(res.entry.period ?? 30);
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
        setStatus("Deleted.");
    } catch (e) {
        setStatus(String(e?.message ?? e), false);
    }
}

$("save").addEventListener("click", save);
$("delete").addEventListener("click", del);

document.getElementById("openOptions").addEventListener("click", async () => {
    // Works in Firefox and Chrome
    if (api.runtime.openOptionsPage) {
        await api.runtime.openOptionsPage();
    } else {
        // fallback
        window.open(api.runtime.getURL("options.html"));
    }
});

load();

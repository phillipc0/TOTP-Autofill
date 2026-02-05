const api = globalThis.browser ?? globalThis.chrome;
const STORAGE_KEY = "totpEntries";

async function getAll() {
    const res = await api.storage.local.get(STORAGE_KEY);
    return res[STORAGE_KEY] ?? {};
}

async function setAll(entries) {
    await api.storage.local.set({ [STORAGE_KEY]: entries });
}

function el(tag, attrs = {}, text = "") {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text) n.textContent = text;
    return n;
}

async function render() {
    const tbody = document.getElementById("rows");
    tbody.innerHTML = "";

    const entries = await getAll();
    const origins = Object.keys(entries).sort();

    for (const origin of origins) {
        const e = entries[origin];
        const tr = document.createElement("tr");
        tr.appendChild(el("td", {}, origin));
        tr.appendChild(el("td", {}, String(e.digits ?? 6)));
        tr.appendChild(el("td", {}, String(e.period ?? 30)));

        const btn = el("button", {}, "Delete");
        btn.addEventListener("click", async () => {
            const all = await getAll();
            delete all[origin];
            await setAll(all);
            render();
        });

        const tdBtn = document.createElement("td");
        tdBtn.appendChild(btn);
        tr.appendChild(tdBtn);

        tbody.appendChild(tr);
    }
}

render();

const API_URL = "https://issmp.onrender.com";

const SERVER_ADDRESS = "issmp.asia:25367";
const REFRESH_INTERVAL = 5000;

// ===============================
// Helpers
// ===============================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatLatency(latency) {
    if (typeof latency !== "number") {
        return "--";
    }

    return `${Math.round(latency)} ms`;
}

function formatTime(dateString) {
    if (!dateString) {
        return "--";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// ===============================
// Status dots
// ===============================

function setStatusDots(state) {
    document
        .querySelectorAll(".status-dot")
        .forEach((element) => {
            element.classList.remove("online", "offline", "loading");
            element.classList.add(state);
        });
}

// ===============================
// Status UI
// ===============================

function setStatusOnline(data) {
    const players = Number(data.players) || 0;
    const maxPlayers = Number(data.maxPlayers) || 0;

    // Hero
    setText("statusText", "ONLINE");
    setText("smallStatus", "ONLINE");
    setText("playerCount", players);
    setText("playerMax", ` / ${maxPlayers}`);
    setText("playerText", "Server đang hoạt động");

    // Dashboard
    setText("dashboardStatus", "ONLINE");
    setText("dashboardPlayers", players);
    setText("dashboardMax", maxPlayers);
    setText("versionText", data.version || "--");
    setText("latencyText", formatLatency(data.latency));
    setText("lastUpdate", `Cập nhật: ${formatTime(data.lastUpdate)}`);

    // Status dots
    setStatusDots("online");

    // Progress bar
    const bar = document.getElementById("playerBar");

    if (bar) {
        let percentage = 0;

        if (maxPlayers > 0) {
            percentage = (players / maxPlayers) * 100;
        }

        percentage = Math.max(0, Math.min(100, percentage));

        bar.style.width = `${percentage}%`;
    }
}

function setStatusOffline(data) {
    // Hero
    setText("statusText", "OFFLINE");
    setText("smallStatus", "OFFLINE");
    setText("playerCount", "0");
    setText("playerMax", " / 0");
    setText("playerText", "Server đang tắt");

    // Dashboard
    setText("dashboardStatus", "OFFLINE");
    setText("dashboardPlayers", "0");
    setText("dashboardMax", "0");
    setText("versionText", "--");
    setText("latencyText", "--");
    setText("lastUpdate", `Cập nhật: ${formatTime(data.lastUpdate)}`);

    // Status dots
    setStatusDots("offline");

    // Progress bar
    const bar = document.getElementById("playerBar");

    if (bar) {
        bar.style.width = "0%";
    }
}

function setStatusLoading() {
    setText("statusText", "CONNECTING...");
    setText("smallStatus", "CONNECTING...");
    setText("playerText", "ĐANG KIỂM TRA SERVER...");

    setStatusDots("loading");
}

// ===============================
// Fetch Minecraft status
// ===============================

let firstLoad = true;

async function fetchServerStatus() {
    if (firstLoad) {
        setStatusLoading();
    }

    try {
        const response = await fetch(
            `${API_URL}/api/status?t=${Date.now()}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `API returned HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (data.online === true) {
            setStatusOnline(data);
        } else {
            setStatusOffline(data);
        }

        firstLoad = false;
    } catch (error) {
        console.error("Status API error:", error);

        // Backend may be waking up — keep loading state
        setText("statusText", "CONNECTING...");
        setText("smallStatus", "CONNECTING...");
        setText("playerText", "Đang kết nối tới server...");

        setStatusDots("loading");
    }
}

// ===============================
// Copy server address
// ===============================

function copyServerAddress(button) {
    navigator.clipboard
        .writeText(SERVER_ADDRESS)
        .then(() => {
            showCopySuccess(button);
        })
        .catch(() => {
            fallbackCopy(button);
        });
}

function fallbackCopy(button) {
    const textarea = document.createElement("textarea");

    textarea.value = SERVER_ADDRESS;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
        document.execCommand("copy");
        showCopySuccess(button);
    } catch (error) {
        console.error("Copy failed:", error);
    }

    textarea.remove();
}

function showCopySuccess(button) {
    if (!button) return;

    const originalText = button.dataset.originalText || button.textContent;

    button.dataset.originalText = originalText;
    button.textContent = "COPIED!";

    // Toast
    const toast = document.getElementById("toast");

    if (toast) {
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 1500);
    }

    setTimeout(() => {
        button.textContent = originalText;
    }, 1500);
}

// ===============================
// Start
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // Copy buttons
    ["copyBtn", "copyBtn2", "copyBtn3"].forEach((id) => {
        const button = document.getElementById(id);

        if (button) {
            button.addEventListener("click", () => {
                copyServerAddress(button);
            });
        }
    });

    fetchServerStatus();

    setInterval(fetchServerStatus, REFRESH_INTERVAL);
});

const API_URL = "https://issmp.onrender.com";

const SERVER_ADDRESS = "issmp.pikamc.vn:25367";
const REFRESH_INTERVAL = 5000;

// ===============================
// Helpers
// ===============================

function $(selector) {
    return document.querySelector(selector);
}

function setText(selector, value) {
    const element = $(selector);

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
// Copy server address
// ===============================

function copyServerAddress() {
    navigator.clipboard
        .writeText(SERVER_ADDRESS)
        .then(() => {
            showCopySuccess();
        })
        .catch(() => {
            fallbackCopy();
        });
}

function fallbackCopy() {
    const textarea = document.createElement("textarea");

    textarea.value = SERVER_ADDRESS;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
        document.execCommand("copy");
        showCopySuccess();
    } catch (error) {
        console.error("Copy failed:", error);
    }

    textarea.remove();
}

function showCopySuccess() {
    const buttons = document.querySelectorAll(
        "[data-copy-server], .copy-btn"
    );

    buttons.forEach((button) => {
        const originalText =
            button.dataset.originalText || button.textContent;

        button.dataset.originalText = originalText;
        button.textContent = "COPIED!";

        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    });
}

// ===============================
// Status UI
// ===============================

function setStatusOnline(data) {
    const players = Number(data.players) || 0;
    const maxPlayers = Number(data.maxPlayers) || 0;

    // Hero status
    setText("[data-status]", "ONLINE");

    // Player count
    setText("[data-players]", `${players}/${maxPlayers}`);
    setText("[data-player-count]", players);
    setText("[data-player-max]", maxPlayers);

    // Version
    setText("[data-version]", data.version || "--");

    // Latency
    setText("[data-latency]", formatLatency(data.latency));

    // Last update
    setText("[data-last-update]", formatTime(data.lastUpdate));

    // Status indicators
    document
        .querySelectorAll(
            ".status-dot, .live-dot, [data-status-dot]"
        )
        .forEach((element) => {
            element.classList.remove("offline");
            element.classList.remove("loading");
            element.classList.add("online");
        });

    document
        .querySelectorAll(
            ".status-pill, .server-status, [data-status-container]"
        )
        .forEach((element) => {
            element.classList.remove("offline");
            element.classList.remove("loading");
            element.classList.add("online");
        });

    // Progress bar
    const progressBars = document.querySelectorAll(
        "[data-player-progress], .player-progress-fill"
    );

    progressBars.forEach((bar) => {
        let percentage = 0;

        if (maxPlayers > 0) {
            percentage = (players / maxPlayers) * 100;
        }

        percentage = Math.max(0, Math.min(100, percentage));

        bar.style.width = `${percentage}%`;
    });

    // Optional status text
    setText("[data-status-message]", "Server is online");
}

function setStatusOffline(data) {
    setText("[data-status]", "OFFLINE");

    setText("[data-players]", "0/0");
    setText("[data-player-count]", "0");
    setText("[data-player-max]", "0");

    setText("[data-version]", "--");
    setText("[data-latency]", "--");
    setText("[data-last-update]", formatTime(data.lastUpdate));

    document
        .querySelectorAll(
            ".status-dot, .live-dot, [data-status-dot]"
        )
        .forEach((element) => {
            element.classList.remove("online");
            element.classList.remove("loading");
            element.classList.add("offline");
        });

    document
        .querySelectorAll(
            ".status-pill, .server-status, [data-status-container]"
        )
        .forEach((element) => {
            element.classList.remove("online");
            element.classList.remove("loading");
            element.classList.add("offline");
        });

    document
        .querySelectorAll(
            "[data-player-progress], .player-progress-fill"
        )
        .forEach((bar) => {
            bar.style.width = "0%";
        });

    setText("[data-status-message]", "Server is offline");
}

function setStatusLoading() {
    setText("[data-status]", "CONNECTING...");

    document
        .querySelectorAll(
            ".status-dot, .live-dot, [data-status-dot]"
        )
        .forEach((element) => {
            element.classList.remove("online");
            element.classList.remove("offline");
            element.classList.add("loading");
        });

    document
        .querySelectorAll(
            ".status-pill, .server-status, [data-status-container]"
        )
        .forEach((element) => {
            element.classList.remove("online");
            element.classList.remove("offline");
            element.classList.add("loading");
        });

    setText("[data-status-message]", "Connecting to status server...");
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

        console.log("Minecraft status:", data);
    } catch (error) {
        console.error(
            "Status API error:",
            error
        );

        // Don't immediately say Minecraft is offline.
        // The backend itself may simply be waking up.
        setText("[data-status]", "CONNECTING...");

        setText(
            "[data-status-message]",
            "Status server is waking up..."
        );

        document
            .querySelectorAll(
                ".status-dot, .live-dot, [data-status-dot]"
            )
            .forEach((element) => {
                element.classList.remove("online");
                element.classList.remove("offline");
                element.classList.add("loading");
            });

        document
            .querySelectorAll(
                ".status-pill, .server-status, [data-status-container]"
            )
            .forEach((element) => {
                element.classList.remove("online");
                element.classList.remove("offline");
                element.classList.add("loading");
            });
    }
}

// ===============================
// Copy buttons
// ===============================

function setupCopyButtons() {
    const buttons = document.querySelectorAll(
        "[data-copy-server], .copy-btn"
    );

    buttons.forEach((button) => {
        button.addEventListener("click", copyServerAddress);
    });
}

// ===============================
// Server address
// ===============================

function setupServerAddress() {
    document
        .querySelectorAll("[data-server-address]")
        .forEach((element) => {
            element.textContent = SERVER_ADDRESS;
        });
}

// ===============================
// Start
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    setupCopyButtons();
    setupServerAddress();

    fetchServerStatus();

    setInterval(
        fetchServerStatus,
        REFRESH_INTERVAL
    );
});

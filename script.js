const SERVER_ADDRESS = "issmp.pikamc.vn:25367";

const $ = (id) => document.getElementById(id);

function setStatus(online) {

    const dots = [
        $("statusDot"),
        $("statusDot2")
    ];

    dots.forEach((dot) => {
        if (!dot) return;

        dot.classList.toggle(
            "offline",
            !online
        );
    });

    $("statusText").textContent =
        online ? "ONLINE" : "OFFLINE";

    $("smallStatus").textContent =
        online ? "ONLINE" : "OFFLINE";

    $("dashboardStatus").textContent =
        online ? "ONLINE" : "OFFLINE";

    $("dashboardStatus").style.color =
        online ? "#4ce794" : "#ff6666";
}

function updateStatus(data) {

    const online = Boolean(data.online);

    setStatus(online);

    const players =
        Number(data.players) || 0;

    const maxPlayers =
        Number(data.maxPlayers) || 0;

    $("playerCount").textContent =
        online ? players : "0";

    $("playerMax").textContent =
        `/ ${online ? maxPlayers : "0"}`;

    $("dashboardPlayers").textContent =
        online ? players : "0";

    $("dashboardMax").textContent =
        online ? maxPlayers : "0";

    if (maxPlayers > 0) {

        const percentage =
            Math.min(
                (players / maxPlayers) * 100,
                100
            );

        $("playerBar").style.width =
            `${percentage}%`;

    } else {
        $("playerBar").style.width = "0%";
    }

    $("playerText").textContent =
        online
            ? `${players} người chơi đang online`
            : "SERVER ĐANG OFFLINE";

    $("versionText").textContent =
        online
            ? (data.version || "--")
            : "--";

    $("latencyText").textContent =
        online && data.latency !== null
            ? `${data.latency} ms`
            : "--";

    if (data.lastUpdate) {

        const time =
            new Date(data.lastUpdate);

        $("lastUpdate").textContent =
            "Cập nhật: " +
            time.toLocaleTimeString(
                "vi-VN"
            );
    }
}

async function fetchStatus() {

    try {

        const response =
            await fetch(
                `/api/status?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        updateStatus(data);

    } catch (error) {

        console.error(
            "Status error:",
            error
        );

        setStatus(false);

        $("playerCount").textContent = "0";
        $("playerMax").textContent = "/ 0";

        $("dashboardPlayers").textContent = "0";
        $("dashboardMax").textContent = "0";

        $("playerBar").style.width = "0%";

        $("playerText").textContent =
            "KHÔNG THỂ KẾT NỐI SERVER";

        $("versionText").textContent = "--";
        $("latencyText").textContent = "--";
    }
}

async function copyServer() {

    try {

        await navigator.clipboard.writeText(
            SERVER_ADDRESS
        );

        showToast();

    } catch {

        const textarea =
            document.createElement("textarea");

        textarea.value = SERVER_ADDRESS;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        showToast();
    }
}

function showToast() {

    const toast = $("toast");

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

$("copyBtn").addEventListener(
    "click",
    copyServer
);

$("copyBtn2").addEventListener(
    "click",
    copyServer
);

fetchStatus();

setInterval(
    fetchStatus,
    5000
);

const http = require("http");
const mc = require("minecraft-protocol");

const PORT = process.env.PORT || 8080;

const MINECRAFT_SERVER = {
    host: "issmp.pikamc.vn",
    port: 25367
};

let status = {
    online: false,
    players: 0,
    maxPlayers: 0,
    version: "--",
    latency: null,
    lastUpdate: null,
    error: null
};

let checking = false;

function checkMinecraft() {
    if (checking) return;

    checking = true;

    mc.ping({
        host: MINECRAFT_SERVER.host,
        port: MINECRAFT_SERVER.port,
        timeout: 7000
    })
        .then((result) => {
            const players = result.players || {};

            let version = "--";

            if (result.version) {
                if (typeof result.version === "string") {
                    version = result.version;
                } else {
                    version =
                        result.version.name ||
                        result.version.version ||
                        "--";
                }
            }

            status = {
                online: true,
                players: Number(players.online) || 0,
                maxPlayers: Number(players.max) || 0,
                version,
                latency:
                    typeof result.latency === "number"
                        ? result.latency
                        : null,
                lastUpdate: new Date().toISOString(),
                error: null
            };

            console.log(
                `[ONLINE] ${status.players}/${status.maxPlayers} | ${status.version} | ${status.latency}ms`
            );
        })
        .catch((error) => {
            status = {
                online: false,
                players: 0,
                maxPlayers: 0,
                version: "--",
                latency: null,
                lastUpdate: new Date().toISOString(),
                error: error.message
            };

            console.log(`[OFFLINE] ${error.message}`);
        })
        .finally(() => {
            checking = false;
        });
}

function sendJSON(res, data) {
    res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });

    res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
    const pathname = req.url.split("?")[0];

    // CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });

        res.end();
        return;
    }

    // Minecraft status API
    if (pathname === "/api/status") {
        sendJSON(res, status);
        return;
    }

    // Simple health check
    if (pathname === "/") {
        sendJSON(res, {
            ok: true,
            service: "InfiniteSuperSMP Status API",
            minecraft: `${MINECRAFT_SERVER.host}:${MINECRAFT_SERVER.port}`,
            statusEndpoint: "/api/status"
        });

        return;
    }

    res.writeHead(404, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    });

    res.end(
        JSON.stringify({
            error: "Not Found"
        })
    );
});

server.on("error", (error) => {
    console.error("Server error:", error);
});

checkMinecraft();

// Check Minecraft every 10 seconds
setInterval(checkMinecraft, 10000);

server.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log(" InfiniteSuperSMP Status API");
    console.log("=================================");
    console.log(`HTTP Port: ${PORT}`);
    console.log(
        `Minecraft: ${MINECRAFT_SERVER.host}:${MINECRAFT_SERVER.port}`
    );
    console.log("Check interval: 10 seconds");
    console.log("=================================");
});

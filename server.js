const http = require("http");
const fs = require("fs");
const path = require("path");
const mc = require("minecraft-protocol");

const PORT = 8080;

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

            const onlinePlayers =
                Number(players.online) || 0;

            const maxPlayers =
                Number(players.max) || 0;

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

            const latency =
                typeof result.latency === "number"
                    ? result.latency
                    : null;

            status = {
                online: true,
                players: onlinePlayers,
                maxPlayers: maxPlayers,
                version: version,
                latency: latency,
                lastUpdate: new Date().toISOString(),
                error: null
            };

            console.log(
                `[ONLINE] ${onlinePlayers}/${maxPlayers} | ${version} | ${latency}ms`
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

checkMinecraft();
setInterval(checkMinecraft, 10000);

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
    const pathname = req.url.split("?")[0];

    if (pathname === "/api/status") {
        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        });

        res.end(JSON.stringify(status));
        return;
    }

    let requestPath = pathname;

    if (requestPath === "/") {
        requestPath = "/index.html";
    }

    try {
        requestPath = decodeURIComponent(requestPath);
    } catch {
        res.writeHead(400);
        res.end("Bad Request");
        return;
    }

    const webRoot = path.resolve(__dirname);

    const filePath = path.normalize(
        path.join(webRoot, requestPath)
    );

    if (
        filePath !== webRoot &&
        !filePath.startsWith(webRoot + path.sep)
    ) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            if (error.code === "ENOENT") {
                res.writeHead(404, {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                });

                res.end("404 - Not Found");
                return;
            }

            res.writeHead(500, {
                "Content-Type":
                    "text/plain; charset=utf-8"
            });

            res.end("500 - Internal Server Error");
            return;
        }

        const extension =
            path.extname(filePath).toLowerCase();

        const contentType =
            mimeTypes[extension] ||
            "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        });

        res.end(data);
    });
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.log(
            "❌ Port 8080 đang được sử dụng."
        );

        process.exit(1);
    }

    console.error(error);
});

server.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("=================================");
    console.log(" InfiniteSuperSMP Web V8");
    console.log("=================================");
    console.log(
        `Website: http://localhost:${PORT}`
    );

    console.log(
        `Minecraft: ${MINECRAFT_SERVER.host}:${MINECRAFT_SERVER.port}`
    );

    console.log("Realtime check: 10 giây");
    console.log("=================================");
    console.log("");
});

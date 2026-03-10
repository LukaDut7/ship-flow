"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRemoteNode = checkRemoteNode;
exports.checkRemoteServer = checkRemoteServer;
exports.deployRemoteServer = deployRemoteServer;
exports.reuseIfRunning = reuseIfRunning;
exports.startRemoteServer = startRemoteServer;
exports.stopRemoteServer = stopRemoteServer;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const REMOTE_DIR = "~/.shipflow-server";
const VERSION_FILE = ".version";
const PID_FILE = "server.pid";
function exec(client, command) {
    return new Promise((resolve, reject) => {
        client.exec(command, (err, stream) => {
            if (err)
                return reject(err);
            let stdout = "";
            let stderr = "";
            stream.on("data", (data) => { stdout += data.toString(); });
            stream.stderr.on("data", (data) => { stderr += data.toString(); });
            stream.on("close", (code) => {
                resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code ?? 0 });
            });
        });
    });
}
async function checkRemoteNode(client) {
    const { stdout, code } = await exec(client, "node --version");
    if (code !== 0 || !stdout) {
        throw new Error("Node.js is not installed on the remote machine. Node.js 20+ is required.");
    }
    const major = parseInt(stdout.replace("v", "").split(".")[0], 10);
    if (major < 20) {
        throw new Error(`Node.js ${stdout} found on remote. Node.js 20+ is required.`);
    }
    return stdout;
}
async function checkRemoteServer(client) {
    const { stdout, code } = await exec(client, `cat ${REMOTE_DIR}/${VERSION_FILE} 2>/dev/null`);
    if (code !== 0 || !stdout)
        return null;
    return stdout;
}
function getLocalVersion() {
    return electron_1.app.getVersion();
}
function getStandaloneDir() {
    if (electron_1.app.isPackaged) {
        return path.join(process.resourcesPath, "standalone");
    }
    return path.join(__dirname, "..", "..", "..", "..", ".next", "standalone");
}
async function deployRemoteServer(client, onProgress) {
    const localVersion = getLocalVersion();
    const remoteVersion = await checkRemoteServer(client);
    if (remoteVersion === localVersion) {
        onProgress?.({ stage: "done", message: "Server already up to date", percent: 100 });
        return;
    }
    onProgress?.({ stage: "checking", message: "Preparing remote directory...", percent: 5 });
    await exec(client, `mkdir -p ${REMOTE_DIR}/data`);
    onProgress?.({ stage: "uploading", message: "Uploading server bundle...", percent: 10 });
    const standaloneDir = getStandaloneDir();
    if (!fs.existsSync(standaloneDir)) {
        throw new Error(`Standalone server not found at ${standaloneDir}`);
    }
    // Upload via SFTP
    await new Promise((resolve, reject) => {
        client.sftp((err, sftp) => {
            if (err)
                return reject(err);
            // We'll create a tar on the local side and upload it
            const tarName = "shipflow-server.tar.gz";
            const remoteTarPath = `/tmp/${tarName}`;
            // Create tar.gz of standalone directory
            const localTarPath = path.join(electron_1.app.getPath("temp"), tarName);
            try {
                (0, child_process_1.execSync)(`tar -czf "${localTarPath}" -C "${path.dirname(standaloneDir)}" "${path.basename(standaloneDir)}"`);
            }
            catch (tarErr) {
                sftp.end();
                return reject(new Error(`Failed to create tar archive: ${tarErr}`));
            }
            onProgress?.({ stage: "uploading", message: "Transferring server bundle...", percent: 30 });
            const readStream = fs.createReadStream(localTarPath);
            const writeStream = sftp.createWriteStream(remoteTarPath);
            const fileSize = fs.statSync(localTarPath).size;
            let uploaded = 0;
            readStream.on("data", (chunk) => {
                uploaded += Buffer.byteLength(chunk);
                const pct = Math.round(30 + (uploaded / fileSize) * 40); // 30% to 70%
                onProgress?.({ stage: "uploading", message: "Transferring server bundle...", percent: pct });
            });
            writeStream.on("close", () => {
                sftp.end();
                // Clean up local tar
                try {
                    fs.unlinkSync(localTarPath);
                }
                catch { }
                resolve();
            });
            writeStream.on("error", (e) => {
                sftp.end();
                try {
                    fs.unlinkSync(localTarPath);
                }
                catch { }
                reject(e);
            });
            readStream.pipe(writeStream);
        });
    });
    onProgress?.({ stage: "extracting", message: "Extracting on remote...", percent: 75 });
    // Stop existing server before replacing files
    await stopRemoteServerIfRunning(client);
    // Extract and move into place
    await exec(client, `cd ${REMOTE_DIR} && rm -rf server.js node_modules public`);
    const { code } = await exec(client, `cd /tmp && tar -xzf shipflow-server.tar.gz && cp -r standalone/* ${REMOTE_DIR}/ && rm -rf standalone shipflow-server.tar.gz`);
    if (code !== 0) {
        throw new Error("Failed to extract server bundle on remote");
    }
    // Write version file
    await exec(client, `echo "${localVersion}" > ${REMOTE_DIR}/${VERSION_FILE}`);
    onProgress?.({ stage: "done", message: "Server deployed successfully", percent: 100 });
}
async function reuseIfRunning(client) {
    const { stdout: pidStr, code: pidCode } = await exec(client, `cat ${REMOTE_DIR}/${PID_FILE} 2>/dev/null`);
    if (pidCode !== 0 || !pidStr)
        return null;
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid))
        return null;
    // Check if process is alive
    const { code: killCode } = await exec(client, `kill -0 ${pid} 2>/dev/null`);
    if (killCode !== 0)
        return null;
    // Find the port it's listening on
    const { stdout: portStr } = await exec(client, `cat ${REMOTE_DIR}/server.port 2>/dev/null`);
    const port = parseInt(portStr, 10);
    if (isNaN(port))
        return null;
    return port;
}
async function startRemoteServer(client) {
    // Find a free port on the remote
    const { stdout: portStr } = await exec(client, `python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()" 2>/dev/null || node -e "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close()})"`);
    const port = parseInt(portStr, 10);
    if (isNaN(port)) {
        throw new Error("Failed to find a free port on remote");
    }
    // Generate a random secret for this session
    const { stdout: secret } = await exec(client, `head -c 32 /dev/urandom | base64`);
    // Start the server with nohup
    const envVars = [
        `PORT=${port}`,
        `HOSTNAME=127.0.0.1`,
        `SHIPFLOW_RUNTIME=desktop`,
        `SHIPFLOW_DATA_DIR=${REMOTE_DIR}/data`,
        `NEXTAUTH_SECRET="${secret.trim()}"`,
        `NEXTAUTH_URL="http://127.0.0.1:${port}"`,
    ].join(" ");
    const { stdout: pidStr, code } = await exec(client, `cd ${REMOTE_DIR} && ${envVars} nohup node server.js > server.log 2>&1 & echo $!`);
    if (code !== 0 || !pidStr) {
        throw new Error("Failed to start server on remote");
    }
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) {
        throw new Error("Failed to get server PID");
    }
    // Write PID and port files
    await exec(client, `echo "${pid}" > ${REMOTE_DIR}/${PID_FILE}`);
    await exec(client, `echo "${port}" > ${REMOTE_DIR}/server.port`);
    // Wait for server to be ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
        const { code: curlCode } = await exec(client, `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${port}/api/health 2>/dev/null | grep -q 200`);
        if (curlCode === 0) {
            ready = true;
            break;
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) {
        // Read the log for debugging
        const { stdout: log } = await exec(client, `tail -20 ${REMOTE_DIR}/server.log 2>/dev/null`);
        throw new Error(`Remote server failed to start. Log:\n${log}`);
    }
    return { pid, port };
}
async function stopRemoteServer(client, pid) {
    await exec(client, `kill ${pid} 2>/dev/null`);
    await exec(client, `rm -f ${REMOTE_DIR}/${PID_FILE} ${REMOTE_DIR}/server.port`);
}
async function stopRemoteServerIfRunning(client) {
    const { stdout: pidStr } = await exec(client, `cat ${REMOTE_DIR}/${PID_FILE} 2>/dev/null`);
    const pid = parseInt(pidStr, 10);
    if (!isNaN(pid)) {
        await exec(client, `kill ${pid} 2>/dev/null`);
        await exec(client, `rm -f ${REMOTE_DIR}/${PID_FILE} ${REMOTE_DIR}/server.port`);
        // Give it a moment to shut down
        await new Promise((r) => setTimeout(r, 500));
    }
}

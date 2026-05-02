#!/usr/bin/env node
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

const config = {
  host: process.env.WEBHOOK_HOST || "127.0.0.1",
  port: Number.parseInt(process.env.WEBHOOK_PORT || "8787", 10),
  path: process.env.WEBHOOK_PATH || "/hooks/github/live-deploy",
  secret: process.env.WEBHOOK_SECRET || "",
  branch: process.env.DEPLOY_BRANCH || "live",
  repo: process.env.DEPLOY_REPO || "",
  script: process.env.DEPLOY_SCRIPT || "/home/ubuntu/zavis-deploy/deploy.sh",
  logFile: process.env.DEPLOY_WEBHOOK_LOG || "/home/ubuntu/logs/webhook-deploy.log",
  statusFile:
    process.env.DEPLOY_WEBHOOK_STATUS ||
    "/home/ubuntu/zavis-deploy/webhook-status.json",
  timeoutMs: Number.parseInt(process.env.DEPLOY_TIMEOUT_MS || "3600000", 10),
  maxBodyBytes: Number.parseInt(process.env.WEBHOOK_MAX_BODY_BYTES || "10485760", 10),
};

if (!config.secret) {
  console.error("WEBHOOK_SECRET is required");
  process.exit(1);
}

if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) {
  console.error(`Invalid WEBHOOK_PORT: ${process.env.WEBHOOK_PORT}`);
  process.exit(1);
}

mkdirSync(dirname(config.logFile), { recursive: true });
mkdirSync(dirname(config.statusFile), { recursive: true });

const serviceStartedAt = new Date().toISOString();
let currentProcess = null;
let currentDeployment = null;
let queuedDeployment = null;
let lastRun = loadPreviousStatus()?.lastRun || null;

function now() {
  return new Date().toISOString();
}

function logLine(message) {
  appendFileSync(config.logFile, `[${now()}] ${message}\n`);
}

function appendStream(streamName, chunk) {
  const text = chunk.toString("utf8");
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.length > 0) {
      logLine(`${streamName}: ${line}`);
    }
  }
}

function loadPreviousStatus() {
  if (!existsSync(config.statusFile)) return null;
  try {
    return JSON.parse(readFileSync(config.statusFile, "utf8"));
  } catch {
    return null;
  }
}

function publicConfig() {
  return {
    host: config.host,
    port: config.port,
    path: config.path,
    branch: config.branch,
    repo: config.repo || null,
    script: config.script,
    timeoutMs: config.timeoutMs,
  };
}

function statusSnapshot() {
  return {
    ok: true,
    serviceStartedAt,
    updatedAt: now(),
    running: Boolean(currentProcess),
    current: currentDeployment,
    queued: queuedDeployment,
    lastRun,
    config: publicConfig(),
  };
}

function persistStatus() {
  const tmpFile = `${config.statusFile}.tmp`;
  writeFileSync(tmpFile, `${JSON.stringify(statusSnapshot(), null, 2)}\n`);
  renameSync(tmpFile, config.statusFile);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${JSON.stringify(body)}\n`);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > config.maxBodyBytes) {
        reject(new Error("request body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function verifySignature(rawBody, signatureHeader) {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const providedHex = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(providedHex)) return false;

  const provided = Buffer.from(providedHex, "hex");
  const expected = createHmac("sha256", config.secret).update(rawBody).digest();

  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function toDeployment(deliveryId, payload) {
  return {
    deliveryId,
    repo: payload.repository?.full_name || null,
    ref: payload.ref,
    branch: payload.ref?.replace(/^refs\/heads\//, "") || null,
    sha: payload.after || null,
    shortSha: payload.after ? payload.after.slice(0, 12) : null,
    sender: payload.sender?.login || null,
    headCommitMessage: payload.head_commit?.message?.split(/\r?\n/, 1)[0] || null,
    receivedAt: now(),
  };
}

function shouldDeploy(payload) {
  if (payload.ref !== `refs/heads/${config.branch}`) {
    return { deploy: false, reason: `ignored ref ${payload.ref}` };
  }

  if (config.repo && payload.repository?.full_name !== config.repo) {
    return {
      deploy: false,
      reason: `ignored repo ${payload.repository?.full_name || "unknown"}`,
    };
  }

  return { deploy: true, reason: "accepted" };
}

function enqueueOrStart(deployment) {
  if (currentProcess) {
    queuedDeployment = deployment;
    logLine(
      `deploy queued delivery=${deployment.deliveryId} repo=${deployment.repo} branch=${deployment.branch} sha=${deployment.shortSha}`,
    );
    persistStatus();
    return "queued";
  }

  startDeployment(deployment);
  return "started";
}

function killProcessGroup(child, signal) {
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    logLine(`failed to send ${signal} to deploy process group: ${error.message}`);
  }
}

function startDeployment(deployment) {
  const startedAt = now();
  currentDeployment = { ...deployment, startedAt };

  const env = {
    ...process.env,
    NEXT_PRIVATE_BUILD_WORKER_COUNT:
      process.env.NEXT_PRIVATE_BUILD_WORKER_COUNT || "1",
  };

  logLine(
    `deploy start delivery=${deployment.deliveryId} repo=${deployment.repo} branch=${deployment.branch} sha=${deployment.shortSha}`,
  );
  persistStatus();

  const child = spawn("/usr/bin/env", ["bash", config.script], {
    cwd: dirname(config.script),
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  currentProcess = child;
  let timedOut = false;

  child.stdout.on("data", (chunk) => appendStream("stdout", chunk));
  child.stderr.on("data", (chunk) => appendStream("stderr", chunk));

  child.on("error", (error) => {
    logLine(`deploy spawn error delivery=${deployment.deliveryId}: ${error.message}`);
  });

  const timeout = setTimeout(() => {
    timedOut = true;
    logLine(
      `deploy timeout delivery=${deployment.deliveryId} after ${config.timeoutMs}ms; sending SIGTERM`,
    );
    killProcessGroup(child, "SIGTERM");
    setTimeout(() => killProcessGroup(child, "SIGKILL"), 30000).unref();
  }, config.timeoutMs);

  child.on("close", (exitCode, signal) => {
    clearTimeout(timeout);

    lastRun = {
      ...currentDeployment,
      finishedAt: now(),
      exitCode,
      signal,
      timedOut,
      ok: exitCode === 0 && signal === null && !timedOut,
    };

    logLine(
      `deploy finish delivery=${deployment.deliveryId} exitCode=${exitCode} signal=${signal || "none"} timedOut=${timedOut}`,
    );

    currentProcess = null;
    currentDeployment = null;
    persistStatus();

    if (queuedDeployment) {
      const nextDeployment = queuedDeployment;
      queuedDeployment = null;
      logLine(
        `deploy queue draining next_delivery=${nextDeployment.deliveryId} sha=${nextDeployment.shortSha}`,
      );
      persistStatus();
      startDeployment(nextDeployment);
    }
  });
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");

  if (request.method === "GET" && requestUrl.pathname === "/healthz") {
    sendJson(response, 200, {
      ok: true,
      running: Boolean(currentProcess),
      queued: Boolean(queuedDeployment),
      serviceStartedAt,
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/status") {
    sendJson(response, 200, statusSnapshot());
    return;
  }

  if (requestUrl.pathname !== config.path) {
    sendJson(response, 404, { ok: false, error: "not found" });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "method not allowed" });
    return;
  }

  let rawBody;
  try {
    rawBody = await readRequestBody(request);
  } catch (error) {
    logLine(`webhook body rejected: ${error.message}`);
    sendJson(response, 413, { ok: false, error: "body rejected" });
    return;
  }

  const signature = request.headers["x-hub-signature-256"];
  if (!verifySignature(rawBody, Array.isArray(signature) ? signature[0] : signature)) {
    logLine("webhook rejected: invalid signature");
    sendJson(response, 401, { ok: false, error: "invalid signature" });
    return;
  }

  const eventName = request.headers["x-github-event"];
  const deliveryId = request.headers["x-github-delivery"] || "unknown";

  if (eventName === "ping") {
    logLine(`webhook ping accepted delivery=${deliveryId}`);
    sendJson(response, 202, { ok: true, action: "ping" });
    return;
  }

  if (eventName !== "push") {
    logLine(`webhook ignored delivery=${deliveryId} event=${eventName}`);
    sendJson(response, 202, { ok: true, action: "ignored", reason: "event" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    logLine(`webhook rejected delivery=${deliveryId}: invalid json`);
    sendJson(response, 400, { ok: false, error: "invalid json" });
    return;
  }

  const decision = shouldDeploy(payload);
  if (!decision.deploy) {
    logLine(`webhook ignored delivery=${deliveryId}: ${decision.reason}`);
    sendJson(response, 202, { ok: true, action: "ignored", reason: decision.reason });
    return;
  }

  const deployment = toDeployment(deliveryId, payload);
  const action = enqueueOrStart(deployment);
  sendJson(response, 202, { ok: true, action, deployment });
});

server.on("error", (error) => {
  logLine(`server error: ${error.stack || error.message}`);
});

server.listen(config.port, config.host, () => {
  logLine(
    `webhook deployer listening on http://${config.host}:${config.port}${config.path} branch=${config.branch} repo=${config.repo || "*"}`,
  );
  persistStatus();
});

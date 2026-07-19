const fs = require('fs');

const LOG_DIR = 'D://weihai-cainiao-front/plc-conn-log';
const BUFFER_SIZE = 20;
const FLUSH_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT_MS = 3000;
const HEARTBEAT_CHECK_INTERVAL_MS = 1000;
const MAX_FILE_SIZE_MB = 10;
const BAD_KEYS_LOG_LIMIT = 20;

let buffer = [];
let flushTimer = null;
let host = '';
let port = '';

/** 与前端 StatusMonitoring 一致：看 DBW0 是否变化 */
let lastDbw0Value = undefined;
let lastDbw0ChangeAt = 0;
let heartbeatTimedOut = false;
let heartbeatTimeoutAt = 0;
let heartbeatWatchStarted = false;
let heartbeatTimer = null;

let readFailed = false;
let writeFailed = false;
/** 点位质量 BAD（与整批 anythingBad 可同时存在） */
let dataBad = false;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatTimestamp(date = new Date()) {
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
      date.getDate()
    )} ` +
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
      date.getSeconds()
    )}`
  );
}

function formatDateForFile(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function yn(flag) {
  return flag ? '是' : '否';
}

function endpointDetail(extra = '') {
  const base = `地址=${host || '-'} 端口=${port || '-'}`;
  return extra ? `${extra} ${base}` : base;
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getLogPath() {
  return `${LOG_DIR}/plc-conn-${formatDateForFile()}.log`;
}

function rotateIfNeeded(logPath) {
  try {
    if (!fs.existsSync(logPath)) return;
    const stats = fs.statSync(logPath);
    if (stats.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
      const backupPath = logPath.replace('.log', `_${Date.now()}.log`);
      fs.renameSync(logPath, backupPath);
    }
  } catch (error) {
    console.error('plcConnLogger rotate error:', error);
  }
}

function flush() {
  if (buffer.length === 0) return;

  ensureLogDir();
  const logPath = getLogPath();
  rotateIfNeeded(logPath);

  const content = buffer.join('');
  buffer = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  fs.appendFile(logPath, content, (err) => {
    if (err) {
      console.error('plcConnLogger append error:', err);
    }
  });
}

function logEvent(level, event, detail = '') {
  const levelText = level === 'WARN' ? '警告' : '信息';
  const line = `${formatTimestamp()} | ${levelText} | ${event} | ${detail}\n`;
  buffer.push(line);

  if (buffer.length >= BUFFER_SIZE) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flush();
    }, FLUSH_INTERVAL);
  }
}

function setEndpoint(nextHost, nextPort) {
  host = nextHost != null ? String(nextHost) : '';
  port = nextPort != null ? String(nextPort) : '';
}

/**
 * nodes7 失败点位多为以 BAD 开头的字符串，如 "BAD 255"
 * @returns {{ key: string, reason: string }[]}
 */
function collectBadItems(values) {
  if (!values || typeof values !== 'object') return [];
  const items = [];
  for (const key of Object.keys(values)) {
    const val = values[key];
    if (typeof val === 'string' && val.indexOf('BAD') === 0) {
      items.push({ key, reason: val });
      if (items.length >= BAD_KEYS_LOG_LIMIT) break;
    }
  }
  return items;
}

/** 格式化失败原因：点位名(BAD码) */
function formatBadReason(items) {
  if (!items.length) {
    return '原因=整批读取异常(未返回点位明细，可能链路中断或PLC无响应)';
  }
  const parts = items.map((item) => `${item.key}(${item.reason})`);
  return `异常数量=${items.length} 原因=${parts.join(',')}`;
}

/**
 * 点位质量：出现/消失 BAD 时各记一条（持续 BAD 不刷）
 */
function markDataQuality(values) {
  const badItems = collectBadItems(values);
  if (badItems.length > 0) {
    if (dataBad) return;
    dataBad = true;
    logEvent('WARN', '点位读取异常', endpointDetail(formatBadReason(badItems)));
    return;
  }
  if (dataBad) {
    dataBad = false;
    logEvent('INFO', '点位读取恢复', endpointDetail());
  }
}

/**
 * 读成功：刷新心跳看门狗 + 检查点位 BAD + 读失败恢复
 * @param {*} dbw0 DB1000.DBW0
 * @param {object} [values] 本批读值（用于扫描 BAD）
 */
function markReadOk(dbw0, values) {
  if (readFailed) {
    readFailed = false;
    logEvent('INFO', '批量读取恢复', endpointDetail());
  }

  if (values) {
    markDataQuality(values);
  }

  // 仅当 DBW0 实际变化时刷新看门狗（含首次拿到有效值）
  if (dbw0 !== lastDbw0Value) {
    const prevDbw0 = lastDbw0Value;
    lastDbw0Value = dbw0;
    lastDbw0ChangeAt = Date.now();

    if (heartbeatTimedOut) {
      const durationMs = Date.now() - heartbeatTimeoutAt;
      heartbeatTimedOut = false;
      logEvent(
        'INFO',
        '心跳恢复',
        endpointDetail(
          `断连时长=${durationMs}ms 当前心跳值=${dbw0} 断连前心跳值=${
            prevDbw0 === undefined ? '-' : prevDbw0
          }`
        )
      );
    }
  }
}

/**
 * 整批读失败（nodes7 anythingBad）
 * @param {object} [values]
 */
function markReadFail(values) {
  if (readFailed) return;
  readFailed = true;
  const badItems = collectBadItems(values);
  // 与「点位读取异常」共用 dataBad，恢复时由 markReadOk → markDataQuality 记一条恢复
  if (badItems.length > 0) {
    dataBad = true;
  }
  logEvent('WARN', '批量读取失败', endpointDetail(formatBadReason(badItems)));
}

function markWriteOk() {
  if (!writeFailed) return;
  writeFailed = false;
  logEvent('INFO', '批量写入恢复', endpointDetail());
}

function markWriteFail() {
  if (writeFailed) return;
  writeFailed = true;
  logEvent('WARN', '批量写入失败', endpointDetail());
}

function checkHeartbeat() {
  if (!lastDbw0ChangeAt) return;
  const silenceMs = Date.now() - lastDbw0ChangeAt;
  if (silenceMs >= HEARTBEAT_TIMEOUT_MS && !heartbeatTimedOut) {
    heartbeatTimedOut = true;
    heartbeatTimeoutAt = Date.now();
    logEvent(
      'WARN',
      '心跳断连',
      endpointDetail(
        `未变化时长=${silenceMs}ms 最后心跳值=${
          lastDbw0Value === undefined ? '-' : lastDbw0Value
        } 读失败=${yn(readFailed)} 写失败=${yn(writeFailed)} 点位异常=${yn(
          dataBad
        )}`
      )
    );
  }
}

function startHeartbeatWatch() {
  if (heartbeatWatchStarted) return;
  heartbeatWatchStarted = true;
  lastDbw0Value = undefined;
  lastDbw0ChangeAt = Date.now();
  heartbeatTimedOut = false;
  heartbeatTimeoutAt = 0;
  heartbeatTimer = setInterval(checkHeartbeat, HEARTBEAT_CHECK_INTERVAL_MS);
}

module.exports = {
  setEndpoint,
  markReadOk,
  markReadFail,
  markWriteOk,
  markWriteFail,
  startHeartbeatWatch,
  flush
};

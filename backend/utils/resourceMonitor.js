/**
 * Resource Monitor - checks CPU/memory usage periodically and alerts
 * admin when the server is nearing capacity, signaling it's time to
 * scale up (e.g., switch PM2 to cluster mode, upgrade instance size).
 */
const os = require('os');
const { sendErrorAlert } = require('./errorAlert');

const CPU_THRESHOLD = 80;      // percent
const MEM_THRESHOLD = 80;      // percent
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const SUSTAINED_CHECKS_NEEDED = 3; // must breach threshold 3 checks in a row (15 min sustained) before alerting

let highLoadStreak = 0;

function getCpuUsagePercent() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) totalTick += cpu.times[type];
    totalIdle += cpu.times.idle;
  });
  return 100 - Math.round((totalIdle / totalTick) * 100);
}

function getMemUsagePercent() {
  const total = os.totalmem();
  const free = os.freemem();
  return Math.round(((total - free) / total) * 100);
}

async function checkResources() {
  const cpuPct = getCpuUsagePercent();
  const memPct = getMemUsagePercent();
  const loadAvg = os.loadavg();

  const isHighLoad = cpuPct >= CPU_THRESHOLD || memPct >= MEM_THRESHOLD;

  if (isHighLoad) {
    highLoadStreak++;
  } else {
    highLoadStreak = 0;
  }

  if (highLoadStreak >= SUSTAINED_CHECKS_NEEDED) {
    await sendErrorAlert(
      'SCALE_UP_NEEDED',
      `Server has been under high load for ${SUSTAINED_CHECKS_NEEDED * (CHECK_INTERVAL_MS/60000)} minutes straight. CPU: ${cpuPct}%, Memory: ${memPct}%. Consider switching PM2 to cluster mode or upgrading your EC2 instance.`,
      { cpuPercent: cpuPct, memPercent: memPct, loadAverage: loadAvg, cores: os.cpus().length }
    );
    highLoadStreak = 0; // reset so we don't spam; errorAlert itself also rate-limits to 1/15min per type
  }
}

function startResourceMonitor() {
  setInterval(checkResources, CHECK_INTERVAL_MS);
  console.log('📊 Resource monitor started - checking every', CHECK_INTERVAL_MS/60000, 'minutes');
}

module.exports = { startResourceMonitor };

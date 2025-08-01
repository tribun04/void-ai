const db = require('./utils/db');
const fetch = require('node-fetch');

const REMOTE_TRAINING_ENDPOINT = 'https://voidsystem.shigjeta.com/api/train';

/**
 * Get all active tenants from DB
 */
async function getTenants() {
  const [tenants] = await db.query(
    'SELECT id, companyName FROM tenants WHERE status = "active"'
  );
  return tenants;
}

/**
 * Get training entries for a tenant
 */
async function getKnowledgeBaseForTenant(tenantId) {
  const [entries] = await db.query(
    'SELECT intent, patterns, responses FROM ai_entries WHERE tenant_id = ?',
    [tenantId]
  );
  return entries;
}

/**
 * Call remote trainer
 */
async function sendToTrainer(tenantId, entry) {
  try {
    const payload = {
      tenantId,
      ...entry
    };

    const res = await fetch(REMOTE_TRAINING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(`✅ [${tenantId}] Trained "${entry.intent}" →`, data.message || 'success');

    return { status: 'success', message: data.message || 'success' };
  } catch (err) {
    console.error(`❌ [${tenantId}] Failed to train "${entry.intent}":`, err.message);
    return { status: 'fail', message: err.message };
  }
}

/**
 * Main trainer logic
 */
async function trainAll() {
  console.log('🚀 Starting multitenant AI training sync...');
  const tenants = await getTenants();

  if (!tenants.length) {
    console.warn('⚠️ No active tenants found. Aborting training.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`\n🔁 Training for Tenant: ${tenant.companyName} (${tenant.id})`);

    // 🧠 Check if already trained
    const [logRows] = await db.query(
      'SELECT id FROM training_logs WHERE tenant_id = ? LIMIT 1',
      [tenant.id]
    );

    if (logRows.length) {
      console.log(`⏩ Already trained. Skipping ${tenant.companyName}.`);
      continue;
    }

    // 🎯 Load AI entries
    const entries = await getKnowledgeBaseForTenant(tenant.id);
    if (!entries.length) {
      console.log(`⚠️ No AI entries found for tenant ${tenant.id}`);
      continue;
    }

    let success = true;

    for (const entry of entries) {
      const result = await sendToTrainer(tenant.id, entry);
      if (result.status !== 'success') {
        success = false;
      }
    }

    // 📝 Save training log
    await db.query(
      `INSERT INTO training_logs (tenant_id, status, intent_count, message)
       VALUES (?, ?, ?, ?)`,
      [
        tenant.id,
        success ? 'success' : 'fail',
        entries.length,
        success ? 'Trained successfully' : 'Some entries failed'
      ]
    );
  }

  console.log('\n🎉 All tenant training complete.');
}

// CLI run
if (require.main === module) {
  trainAll();
}

// Export for routes or CRON
module.exports = { trainAll };

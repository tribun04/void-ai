const db = require('../db/mysql');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.trainTenantAIEntry = async (req, res) => {
  const { intent, baseResponse } = req.body;
  const tenantId = req.tenant.id;

  if (!intent || !baseResponse) {
    return res.status(400).json({ message: 'Intent and baseResponse required.' });
  }

  try {
    const [sq, sr] = await Promise.all([
      openai.chat.completions.create({ model: "gpt-4", messages: [{ role: "system", content: "Translate to formal Albanian." }, { role: "user", content: baseResponse }] }),
      openai.chat.completions.create({ model: "gpt-4", messages: [{ role: "system", content: "Translate to formal Serbian." }, { role: "user", content: baseResponse }] }),
    ]);

    const formattedIntent = intent.toLowerCase().replace(/\s+/g, '_');
    const id = uuidv4();

    // ✅ Create default JSON arrays for the new columns
    const patterns = JSON.stringify([intent]); 
    const responses = JSON.stringify([baseResponse]);

    // ✅ Updated SQL query with the new columns
    await db.query(
      `INSERT INTO ai_entries (id, intent, response_en, response_sq, response_sr, tenant_id, patterns, responses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         response_en = VALUES(response_en), 
         response_sq = VALUES(response_sq), 
         response_sr = VALUES(response_sr),
         patterns = VALUES(patterns),
         responses = VALUES(responses)`,
      // ✅ Added the new values to the query parameters
      [id, formattedIntent, baseResponse, sq.choices[0].message.content, sr.choices[0].message.content, tenantId, patterns, responses]
    );

    res.status(201).json({ message: `Intent '${formattedIntent}' trained.` });
  } catch (err) {
    // This catch block is what's sending the 500 error
    console.error('❌ AI training error:', err); 
    res.status(500).json({ message: 'Failed to train AI entry.' });
  }
};

exports.getTenantAIEntries = async (req, res) => {
  const tenantId = req.tenant.id;
  const [entries] = await db.query(`SELECT * FROM ai_entries WHERE tenant_id = ?`, [tenantId]);
  res.json(entries);
};

exports.deleteTenantAIEntry = async (req, res) => {
  const tenantId = req.tenant.id;
  const intent = req.params.intent;
  await db.query(`DELETE FROM ai_entries WHERE intent = ? AND tenant_id = ?`, [intent, tenantId]);
  res.status(200).json({ message: `Intent '${intent}' deleted.` });
};

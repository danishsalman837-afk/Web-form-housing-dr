const { createSupabaseClient, assertEnv } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!assertEnv('service', res)) return;

  const supabase = createSupabaseClient('service');
  const data = req.body;
  const originalRawData = JSON.parse(JSON.stringify(data));

  try {
    const mapping = {
      dateOfBirth: 'dob', tenancyDuration: 'livingDuration', hasDampMould: 'damp', roomsAffected: 'dampRooms',
      agentName: 'agentName'
    };

    for (const [formKey, dbKey] of Object.entries(mapping)) {
      if (data[formKey] !== undefined) data[dbKey] = data[formKey];
    }

    data.isSubmitted = false;
    data.is_submitted = false;
    data.leadStatus = 'Agent Saved';
    data.leadStage = 'Draft';
    data.lead_stage = 'Draft';
    data.timestamp = new Date().toISOString();
    data.agentData = originalRawData;
    data.agent_data = originalRawData;
    data.agentName = data.agentName || data.agent_name;

    const rawPhone = data.phone || data.mobileNumber;
    if (!rawPhone) return res.status(400).json({ error: "Phone required" });

    const { data: existing } = await supabase.from('submissions').select('id').eq('phone', rawPhone).limit(1);

    if (existing && existing.length > 0) {
      const { data: updated, error } = await supabase.from('submissions').update(data).eq('id', existing[0].id).select();
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Draft updated", lead: updated[0] });
    } else {
      const { data: inserted, error } = await supabase.from('submissions').insert([data]).select();
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Draft saved", lead: inserted[0] });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

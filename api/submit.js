const { createSupabaseClient, assertEnv } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  const route = req.query.route || req.body.route;
  const method = req.method;

  // DIAGNOSTIC PING
  if (method === 'GET' && route === 'ping') {
      const url = process.env.SUPABASE_URL || 'NOT_SET';
      const projectId = url.split('.')[0].split('//')[1] || 'UNKNOWN';
      const supabase = createSupabaseClient('service');
      const { data: cols } = await supabase.from('submissions').select('*').limit(1);
      return res.status(200).json({ 
          status: "online", 
          projectId, 
          urlMasked: url.substring(0, 12) + "...",
          columns: cols && cols.length > 0 ? Object.keys(cols[0]) : [] 
      });
  }

  if (method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!assertEnv('service', res)) return;

  const supabase = createSupabaseClient('service');
  const data = req.body;
  const originalRawData = JSON.parse(JSON.stringify(data));

  try {
    // 1. Mapping to DB columns (CamelCase)
    const mapping = {
      dateOfBirth: 'dob', tenancyDuration: 'livingDuration', hasDampMould: 'damp', roomsAffected: 'dampRooms',
      heatingIssues: 'issuesHeating', faultyElectrics: 'issuesElectrics', structuralDamage: 'issuesStructural',
      agentName: 'agentName', rentalArrears: 'arrears', reportedOverMonth: 'reported'
    };

    for (const [formKey, dbKey] of Object.entries(mapping)) {
      if (data[formKey] !== undefined) data[dbKey] = data[formKey];
    }

    // 2. Set Status for visibility (Saving to both old and new columns)
    data.isSubmitted = true;
    data.is_submitted = true; 
    data.leadStatus = 'New Lead';
    data.leadStage = 'New Lead';
    data.lead_stage = 'New Lead';
    data.timestamp = new Date().toISOString();
    data.agentData = originalRawData;
    data.agent_data = originalRawData;
    data.agentName = data.agentName || data.agent_name;
    data.agent_name = data.agentName;

    const rawPhone = data.phone || data.mobileNumber || data.mobile_number;
    if (!rawPhone) return res.status(400).json({ error: "Phone required" });

    // 3. Search and Update or Insert
    const { data: existing } = await supabase.from('submissions').select('id').eq('phone', rawPhone).limit(1);

    if (existing && existing.length > 0) {
      const { data: updated, error } = await supabase.from('submissions').update(data).eq('id', existing[0].id).select();
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Updated", lead: updated[0] });
    } else {
      const { data: inserted, error } = await supabase.from('submissions').insert([data]).select();
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Submitted", lead: inserted[0] });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

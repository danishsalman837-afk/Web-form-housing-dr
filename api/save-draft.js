const { createSupabaseClient, normalizeLead } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabase = createSupabaseClient();
    const data = normalizeLead(req.body);
    
    // Save a backup of the original data for audit if needed
    if (!data.agent_data) {
        data.agent_data = JSON.parse(JSON.stringify(req.body));
    }

    if (!data.phone) {
        return res.status(400).json({ error: "Phone number is required to save progress." });
    }

    const strippedPhone = data.phone.replace(/\D/g, '');
    let variations = [data.phone, strippedPhone];
    
    if (strippedPhone.startsWith('44') && strippedPhone.length > 2) {
      variations.push('0' + strippedPhone.substring(2));
    } else if (strippedPhone.startsWith('0') && strippedPhone.length > 1) {
      variations.push('44' + strippedPhone.substring(1));
    }

    const uniqueVariations = [...new Set(variations.filter(v => v))];
    const orQuery = uniqueVariations
      .map(v => `phone.eq."${v}",mobile_number.eq."${v}"`)
      .join(',');

    // Attempt to update existing with this phone number or insert new
    // We search for most recent record with this phone
    const { data: existing, error: findError } = await supabase
      .from('submissions')
      .select('id')
      .or(orQuery)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) return res.status(500).json({ error: findError.message });

    let response;
    if (existing && existing.length > 0) {
        // Ensure status is 'Agent Saved' for drafts so they don't hit the dashboard yet
        if (!data.leadStatus || data.leadStatus === 'Agent Saved') {
            data.leadStatus = 'Agent Saved';
        }
        response = await supabase
            .from('submissions')
            .update(data)
            .eq('id', existing[0].id)
            .select();
    } else {
        // Insert
        // Ensure status is 'Agent Saved' for new drafts
        data.leadStatus = 'Agent Saved';
        response = await supabase
            .from('submissions')
            .insert([data])
            .select();
    }

    if (response.error) {
      console.error("Supabase Error:", response.error);
      return res.status(500).json({ success: false, error: response.error.message });
    }

    return res.status(200).json({ success: true, lead: response.data[0] });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, error: "An unexpected error occurred." });
  }
}

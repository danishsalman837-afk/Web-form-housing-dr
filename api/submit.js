const { createSupabaseClient, normalizeLead } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabase = createSupabaseClient();
    const data = normalizeLead(req.body);
    
    // 1. Check if an existing entry exists for this phone number
    let isUpdate = false;
    let existingId = null;

    if (data.phone) {
      const strippedPhone = data.phone.replace(/\D/g, '');
      const orQuery = strippedPhone && strippedPhone !== data.phone
        ? `phone.eq."${data.phone}",mobile_number.eq."${data.phone}",phone.eq."${strippedPhone}",mobile_number.eq."${strippedPhone}"`
        : `phone.eq."${data.phone}",mobile_number.eq."${data.phone}"`;

      const { data: existingLead } = await supabase
        .from('submissions')
        .select('id')
        .or(orQuery)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (existingLead && existingLead.length > 0) {
        isUpdate = true;
        existingId = existingLead[0].id;
      }
    }

    let response;
    if (isUpdate) {
        const updateData = { ...data, leadStatus: 'New Lead' };
        delete updateData.id;

        response = await supabase
            .from('submissions')
            .update(updateData)
            .eq('id', existingId)
            .select();
    } else {
        // Ensure default status for new submissions is 'New Lead'
        if (!data.leadStatus || data.leadStatus === 'Agent Saved') {
            data.leadStatus = 'New Lead';
        }
        
        response = await supabase
            .from('submissions')
            .insert([data])
            .select();
    }

    if (response.error) {
      console.error("Supabase Error:", response.error);
      return res.status(500).json({ success: false, error: response.error.message });
    }

    // Success response
    return res.status(200).json({ success: true, message: isUpdate ? "Lead Finalised and Updated" : "Form submitted successfully" });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, error: "An unexpected error occurred." });
  }
}

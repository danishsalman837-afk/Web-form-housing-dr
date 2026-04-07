const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure env variables are configured in Vercel
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const data = req.body;
    
    // We already generate a timestamp in DB default NOW(), but we can add one if needed.
    // data.timestamp is handled by DB.
    
    // 1. Check if an existing entry exists for this phone number
    let isUpdate = false;
    let existingId = null;

    if (data.phone) {
      const { data: existingLead } = await supabase
        .from('submissions')
        .select('id')
        .eq('phone', data.phone)
        .maybeSingle();
        
      if (existingLead) {
        isUpdate = true;
        existingId = existingLead.id;
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

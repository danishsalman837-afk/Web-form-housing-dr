const { createSupabaseClient, normalizeLead } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const supabase = createSupabaseClient();
    const strippedPhone = phone.replace(/\D/g, '');

    // Search by both raw and stripped phone to be robust against dialer formatting
    const orQuery = strippedPhone && strippedPhone !== phone
      ? `phone.eq."${phone}",mobile_number.eq."${phone}",phone.eq."${strippedPhone}",mobile_number.eq."${strippedPhone}"`
      : `phone.eq."${phone}",mobile_number.eq."${phone}"`;

    // Fetch the most recent submission (created_at is more reliable than timestamp)
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .or(orQuery)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (data && data.length > 0) {
      return res.status(200).json(normalizeLead(data[0]));
    }
    
    return res.status(200).json(null);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
}

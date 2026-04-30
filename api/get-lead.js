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
    let variations = [phone, strippedPhone];
    
    // Handle UK variations (07... vs 447...)
    if (strippedPhone.startsWith('44') && strippedPhone.length > 2) {
      variations.push('0' + strippedPhone.substring(2));
    } else if (strippedPhone.startsWith('0') && strippedPhone.length > 1) {
      variations.push('44' + strippedPhone.substring(1));
    }

    const uniqueVariations = [...new Set(variations.filter(v => v))];
    const orQuery = uniqueVariations
      .map(v => `phone.eq."${v}"`)
      .join(',');


    // Fetch the most recent submission
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .or(orQuery)
      .order('timestamp', { ascending: false })
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

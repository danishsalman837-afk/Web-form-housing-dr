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
    
    // Handle UK variations (07... vs 447... vs 7...)
    if (strippedPhone.startsWith('44') && strippedPhone.length > 2) {
      variations.push('0' + strippedPhone.substring(2));
      variations.push(strippedPhone.substring(2)); // raw without prefix
    } else if (strippedPhone.startsWith('0') && strippedPhone.length > 1) {
      variations.push('44' + strippedPhone.substring(1));
      variations.push(strippedPhone.substring(1)); // raw without leading 0
    } else if (strippedPhone.length >= 10) {
      // Dialler often strips leading 0 — try adding it back
      variations.push('0' + strippedPhone);
      variations.push('44' + strippedPhone);
    }

    const uniqueVariations = [...new Set(variations.filter(v => v))];
    // Search BOTH phone and mobile_number columns to find older leads
    const orQuery = uniqueVariations
      .map(v => `phone.eq."${v}",mobile_number.eq."${v}"`)
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

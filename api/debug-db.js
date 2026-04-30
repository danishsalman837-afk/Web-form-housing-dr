const { createSupabaseClient } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

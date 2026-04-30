const { createSupabaseClient } = require("./_supabaseClient");

module.exports = async function handler(req, res) {
  try {
    const supabase = createSupabaseClient();
    
    // Check what tables are available
    const { data: tables, error: tableError } = await supabase
      .from('submissions')
      .select('count', { count: 'exact', head: true });

    const { data: sample, error: sampleError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);

    return res.status(200).json({
      count: tables,
      tableError,
      sample,
      sampleError,
      env: {
        url: process.env.SUPABASE_URL ? "SET" : "NOT SET",
        key: (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? "SET" : "NOT SET"
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

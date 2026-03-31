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
    
    // Insert into the 'submissions' table
    const { error } = await supabase
      .from('submissions')
      .insert([data]);

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Success response
    return res.status(200).json({ success: true, message: "Form submitted successfully" });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, error: "An unexpected error occurred." });
  }
}

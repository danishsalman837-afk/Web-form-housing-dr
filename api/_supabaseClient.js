const { createClient } = require('@supabase/supabase-js');

function createSupabaseClient(type = 'service') {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase Environment Variables");
  return createClient(url, key);
}

function assertEnv(type, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Server Configuration Error: Missing Supabase Keys" });
    return false;
  }
  return true;
}

function normalizeLead(lead) {
  if (!lead) return lead;
  const n = (dbKey, formKey) => {
    if (lead[dbKey] !== undefined && lead[formKey] === undefined) {
      lead[formKey] = lead[dbKey];
    }
  };

  // Map database CamelCase to frontend form names
  n('livingDuration', 'tenancyDuration');
  n('dampRooms', 'roomsAffected');
  n('dampSurface', 'affectedSurface');
  n('dampDuration', 'issueDuration');
  n('dampCause', 'issueCause');
  n('dampDamage', 'damageBelongings');
  n('dampHealth', 'healthProblems');
  n('leakCracks', 'cracksDamage');
  n('issuesElectrics', 'faultyElectrics');
  n('issuesHeating', 'heatingIssues');
  n('issuesStructural', 'structuralDamage');
  n('reported', 'reportedOverMonth');
  n('arrears', 'rentalArrears');
  n('agentName', 'agentName');
  
  return lead;
}

module.exports = { createSupabaseClient, assertEnv, normalizeLead };

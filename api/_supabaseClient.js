const { createClient } = require("@supabase/supabase-js");

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

function normalizeLead(lead) {
  if (!lead) return lead;
  
  const n = (dbKey, formKey) => { 
    // If dbKey exists but formKey doesn't, map dbKey -> formKey
    if (lead[dbKey] !== undefined && lead[dbKey] !== null) {
      if (lead[formKey] === undefined || lead[formKey] === null) {
        lead[formKey] = lead[dbKey];
      }
    }
    // If formKey exists but dbKey doesn't, map formKey -> dbKey
    if (lead[formKey] !== undefined && lead[formKey] !== null) {
      if (lead[dbKey] === undefined || lead[dbKey] === null) {
        lead[dbKey] = lead[formKey];
      }
    }
  };

  // Mappings between newer form keys and older/dashboard keys
  n('dob', 'dateOfBirth');
  n('livingDuration', 'tenancyDuration');
  n('damp', 'hasDampMould');
  n('dampRooms', 'roomsAffected');
  n('dampSurface', 'affectedSurface');
  n('dampDuration', 'issueDuration');
  n('dampCause', 'issueCause');
  n('dampDamage', 'damageBelongings');
  n('dampHealth', 'healthProblems');
  n('leak', 'hasLeaks');
  n('leakCracks', 'cracksDamage');
  n('issues_electrics', 'faultyElectrics');
  n('issues_heating', 'heatingIssues');
  n('issues_structural', 'structuralDamage');
  n('reported', 'reportedOverMonth');
  n('arrears', 'rentalArrears');

  // Sub-questions and additional details
  n('dampLocation', 'dampLocation');
  n('leakLocation', 'leakLocation');
  n('leakSource', 'leakSource');
  n('leakStart', 'leakStart');
  n('leakDamage', 'leakDamage');
  n('leakBelongings', 'leakBelongings');
  n('reportCount', 'reportCount');
  n('reportFirst', 'reportFirst');
  n('reportLast', 'reportLast');
  n('reportResponse', 'reportResponse');
  n('reportAttempt', 'reportAttempt');
  n('reportStatus', 'reportStatus');
  n('arrearsAmount', 'arrearsAmount');
  n('alreadySubmitted', 'alreadySubmitted');
  n('additionalNotes', 'additionalNotes');
  n('agent_name', 'agentName');

  return lead;
}

module.exports = { createSupabaseClient, normalizeLead };

const { createClient } = require("@supabase/supabase-js");

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  // Use Anon Key by default, fallback to Service Role if set (Vercel env vars)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
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
      // CRITICAL: Remove the formKey if it's different from dbKey so Supabase doesn't crash
      if (formKey !== dbKey) {
        delete lead[formKey];
      }
    }
  };

  // Name fallback for older leads (combining first/last into full name)
  if (!lead.name && (lead.first_name || lead.lastName || lead.last_name)) {
    lead.name = ((lead.first_name || '') + ' ' + (lead.lastName || lead.last_name || '')).trim();
  }

  // 1. Core Contact & Basic Details
  n('phone', 'Mobile');
  n('email', 'Email');
  n('address', 'Address');
  n('postcode', 'Postcode');
  n('dob', 'dateOfBirth');
  n('livingDuration', 'tenancyDuration');
  
  // 2. Disrepair Main Toggles (Old names vs New names)
  n('damp', 'hasDampMould');
  n('leak', 'hasLeaks');
  n('reported', 'reportedOverMonth');
  n('arrears', 'rentalArrears');
  n('issues_electrics', 'faultyElectrics');
  n('issues_heating', 'heatingIssues');
  n('issues_structural', 'structuralDamage');

  // 3. Sub-questions & Specific Details
  n('dampLocation', 'dampLocation');
  n('dampRooms', 'roomsAffected');
  n('dampSurface', 'affectedSurface');
  n('dampDuration', 'issueDuration');
  n('dampCause', 'issueCause');
  n('dampDamage', 'damageBelongings');
  n('dampHealth', 'healthProblems');
  
  n('leakLocation', 'leakLocation');
  n('leakSource', 'leakSource');
  n('leakStart', 'leakStart');
  n('leakDamage', 'leakDamage');
  n('leakCracks', 'cracksDamage');
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
  
  // 4. Tenancy & Property Details
  n('infestation', 'infestation');
  n('property_type', 'property_type');
  n('tenancy_on_name', 'tenancy_on_name');
  n('tenancy_type', 'tenancy_type');
  n('is_name_on_joint', 'is_name_on_joint');
  n('other_tenant_name', 'other_tenant_name');
  n('actual_tenant_fullname', 'actual_tenant_fullname');

  // 5. Agent Info
  n('agent_name', 'agentName');
  n('agent_name', 'dialler');
  n('agent_name', 'agent');

  return lead;
}

module.exports = { createSupabaseClient, normalizeLead };

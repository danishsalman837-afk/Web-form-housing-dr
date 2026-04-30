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
  n('phone', 'phone');
  n('phone', 'Mobile');
  n('email', 'email');
  n('address', 'address');
  n('address', 'Address');
  n('postcode', 'postcode');
  n('dob', 'dob');
  n('dob', 'dateOfBirth');
  n('livingDuration', 'livingDuration');
  n('livingDuration', 'tenancyDuration');
  
  // 2. Disrepair Main Toggles
  n('damp', 'damp');
  n('damp', 'hasDampMould');
  n('leak', 'leak');
  n('leak', 'hasLeaks');
  n('reported', 'reported');
  n('reported', 'reportedOverMonth');
  n('arrears', 'arrears');
  n('arrears', 'rentalArrears');
  n('issues_electrics', 'faultyElectrics');
  n('issues_heating', 'heatingIssues');
  n('issues_structural', 'structuralDamage');

  // 3. Sub-questions & Specific Details (CamelCase as per your SQL)
  n('dampLocation', 'dampLocation');
  n('dampRooms', 'dampRooms');
  n('dampRooms', 'roomsAffected');
  n('dampSurface', 'dampSurface');
  n('dampSurface', 'affectedSurface');
  n('dampDuration', 'dampDuration');
  n('dampDuration', 'issueDuration');
  n('dampCause', 'dampCause');
  n('dampCause', 'issueCause');
  n('dampDamage', 'dampDamage');
  n('dampDamage', 'damageBelongings');
  n('dampHealth', 'dampHealth');
  n('dampHealth', 'healthProblems');
  
  n('leakLocation', 'leakLocation');
  n('leakSource', 'leakSource');
  n('leakStart', 'leakStart');
  n('leakDamage', 'leakDamage');
  n('leakCracks', 'leakCracks');
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

  // 5. System Fields (Must exist in DB)
  n('leadStatus', 'leadStatus');
  n('is_submitted', 'is_submitted');
  n('agent_data', 'agent_data');
  n('agent_name', 'agent_name');
  n('agent_name', 'agentName');

  return lead;
}

module.exports = { createSupabaseClient, normalizeLead };

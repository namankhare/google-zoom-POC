function getSuggestedCRMRecords(domains) {
  var normalizedDomains = (domains || []).map(function (domain) {
    return String(domain || "").trim().toLowerCase();
  });

  var seen = {};
  var results = [];

  normalizedDomains.forEach(function (domain) {
    if (!domain) {
      return;
    }

    var companyRecord = findCompanyByDomain_(domain);
    if (!companyRecord) {
      return;
    }

    (companyRecord.leads || []).forEach(function (lead) {
      var key = "lead:" + lead.id;
      if (seen[key]) {
        return;
      }

      seen[key] = true;
      results.push({
        id: lead.id,
        type: "Lead",
        title: lead.title,
        company: companyRecord.company,
      });
    });

    (companyRecord.deals || []).forEach(function (deal) {
      var key = "deal:" + deal.id;
      if (seen[key]) {
        return;
      }

      seen[key] = true;
      results.push({
        id: deal.id,
        type: "Deal",
        title: deal.title,
        company: companyRecord.company,
      });
    });
  });

  return results;
}

function getAllCRMRecords() {
  var seen = {};
  var results = [];

  for (var i = 0; i < MOCK_CRM.length; i++) {
    var companyRecord = MOCK_CRM[i];

    (companyRecord.leads || []).forEach(function (lead) {
      results.push({
        id: lead.id,
        type: "Lead",
        title: lead.title,
        company: companyRecord.company,
      });
    });

    (companyRecord.deals || []).forEach(function (deal) {
      results.push({
        id: deal.id,
        type: "Deal",
        title: deal.title,
        company: companyRecord.company,
      });
    });
  }

  return results;
}

function getCompanyName(domain) {
  var companyRecord = findCompanyByDomain_(domain);
  return companyRecord ? companyRecord.company : null;
}

function findCompanyByDomain_(domain) {
  var normalizedDomain = String(domain || "").trim().toLowerCase();

  if (!normalizedDomain) {
    return null;
  }

  for (var i = 0; i < MOCK_CRM.length; i += 1) {
    if (String(MOCK_CRM[i].domain).toLowerCase() === normalizedDomain) {
      return MOCK_CRM[i];
    }
  }

  return null;
}

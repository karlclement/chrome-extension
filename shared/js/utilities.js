// Find if a subdomain can be removed and do it
//
function withoutSubDomain(domain) {
  var subdomainsCount = (domain.match(/\./g) || []).length;
  if (subdomainsCount > 1) {
    newdomain = domain;
    newdomain = newdomain.substring(newdomain.indexOf(".") + 1);

    if (newdomain.length > 5) {
     return newdomain;
    }
    else {
      return false;
    }
  }
  return false;
}
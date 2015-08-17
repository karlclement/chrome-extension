//
// --- linkedin-dom.js ---
//
// Every element depending on Linkedin DOM is put in this file.
// This should be updated on regular basis to make sure it works in every cases.
// Linkedin DOM changes depending on the type of account (free or premium versions
// like Sales Navigator)
//


//
// Determine whether user is on sales navigator or classic LinkedIn
//
function isSalesNavigator() {
  if ($(".logo").text().trim() == "Sales Navigator") { return true; }
  else { return false; }
}


//
// Get first name, last name, title and company
//
var full_name = $("title").text().substring(0, $("title").text().indexOf(" |"));
full_name_array = full_name.split(" ");

// First name
window.first_name = full_name_array[0];
full_name_array.shift();

// Last name
window.last_name = full_name_array.join(" ");

// Job title and company
if (isSalesNavigator()) {
  window.job_title = $(".title").text()
  window.last_company = $(".company-name").first().text();
  window.last_company_path = $(".company-name a").first().attr("href");
}
else {
  window.job_title = $("#headline .title").text()
  window.last_company = $(".current-position h5:last-child a").first().text();
  window.last_company_path = $(".current-position .new-miniprofile-container a").first().attr("href");
}


//
// Website parse in company page
//
function websiteFromCompanyPage(html) {
  if (isSalesNavigator()) {
    html = $(html).find("code").last().html();
    json = html.replace("<!--", "").replace("-->", "");
    return JSON.parse(json)["account"]["website"];
  } else {
    if (typeof $(html).find(".website a").text() != "undefined") {
      return $(html).find(".website a").text();
    }
    else {
      return false;
    }
  }
}

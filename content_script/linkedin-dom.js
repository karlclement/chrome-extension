//
// --- linkedin-dom.js ---
//
// Every element depending on Linkedin DOM is put in this file.
// This should be updated on regular basis to make sure it works in every cases.
// Linkedin DOM changes depending on the type of account (free or premium versions
// like Sales Navigator or Recruiting)
//


//
// Determine whether user is on sales navigator or classic LinkedIn
//
function isSalesNavigator() {
  if ($(".logo").text().trim() == "Sales Navigator") { return true; }
  else { return false; }
}

function isRecruiter() {
  if ($(".product span").first().text().trim() == "Recruiter") { return true; }
  else { return false; }
}

//
// Get first name, last name, title and company
//
if (isRecruiter()) {
  var full_name = $("title").text();
}
else {
  var full_name = $("title").text().substring(0, $("title").text().indexOf(" |"));
}

full_name_array = full_name.split(" ");

// First name
window.first_name = full_name_array[0];
full_name_array.shift();

// Last name
window.last_name = full_name_array.join(" ");

// Last company
if (isSalesNavigator()) {
  window.last_company = $(".company-name").first().text();
  window.last_company_path = $(".company-name a").first().attr("href");
} else if (isRecruiter()) {
  window.last_company = $(".position-header h5").first().text();

  if ($(".position-header h5 a").first().attr("href").indexOf("search?") == -1) {
    window.last_company_path = $(".position-header h5 a").first().attr("href");
  }
}
else {
  window.last_company = $(".current-position h5:last-child a").first().text();
  window.last_company_path = $(".current-position .new-miniprofile-container a").first().attr("href");
}


//
// Profile main content
// TO DO: verify the DOM for Sales Navigator
//

if (isRecruiter()) {
  window.profile_main_content = $("#profile-ugc").html();
} else if (!isSalesNavigator()) {
  window.profile_main_content = $("#background").html();
}


//
// Website parse in company page
//
function websiteFromCompanyPage(html) {
  if (isSalesNavigator()) {
    html = $(html).find("code").last().html();
    json = html.replace("<!--", "").replace("-->", "");
    return JSON.parse(json)["account"]["website"];
  } else if(isRecruiter()) {
    html = $(html).find("#page-data").html();
    json = html.replace("<!--", "").replace("-->", "");
    console.log(JSON.parse(json)["company"]["websiteUrl"]);
    return JSON.parse(json)["company"]["websiteUrl"];
  }
  else {
    if (typeof $(html).find(".website a").text() != "undefined") {
      return $(html).find(".website a").text();
    }
    else {
      return false;
    }
  }
}

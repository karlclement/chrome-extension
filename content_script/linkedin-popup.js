// Launch popup
//
function launchPopup() {
  appendOverlay(function() {
    openPopup(function() {
      launchSearch();
    });
  });

  // Drag popup
  $("#eh_popup").draggable({ handle: ".eh_popup_drag" });

  // Close popup
  $("#eh_overlay, .eh_popup_close").click(function() {
    closePopup();
  });
  $(document).keyup(function(e) {
    if (e.keyCode == 27) {
      closePopup();
    }
  });
}


// Destroy popup and overlay
//
function closePopup() {
  $("#eh_popup").remove();
  $("#eh_overlay").remove();
}


// Append overlay on the page
//
function appendOverlay(callback) {
  var docHeight = $(document).height();

  $("body").append('<div id="eh_overlay"></div>');

  $("#eh_overlay")
    .height(docHeight)
    .css({
      'opacity' : 0.2,
      'position': 'absolute',
      'top': 0,
      'left': 0,
      'background-color': 'black',
      'width': '100%',
      'z-index': 11000
  });

  callback();
}


// Open popup
//
function openPopup(callback) {
  var windowHeight = $(window).height();
  var windowWidth = $(window).width();

  $("body").append('<div id="eh_popup"><a href="https://emailhunter.co/chrome?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup#faq" target="_blank"><i class="fa fa-question-circle eh_popup_question"></i></a><i class="fa fa-ellipsis-v eh_popup_drag"></i><div class="eh_popup_close">&times;</div><div class="eh_popup_name">' + window.first_name + ' ' + window.last_name + '</div><div class="eh_popup_job_title">' + window.job_title + '</div><div id="eh_popup_error"></div><form id="eh_popup_ask_domain"><div id="eh_popup_ask_domain_message"></div><input placeholder="company.com" id="eh_popup_ask_domain_field" type="text" name="domain"><button class="clear_cta" type="submit">Find</button></form><div id="eh_popup_content_container"><div id="eh_popup_content"></div></div><div class="eh_popup_confidence_score"></div><div id="eh_popup_results_link_container"></div><div id="eh_popup_results_show"></div><div id="eh_popup_legal_mention">Email Hunter\'s button and this popup are added by Email Hunter\'s Chrome extension. Email Hunter is not affiliated to LinkedIn. <a href="https://emailhunter.co/chrome?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup#faq" target="_blank">Learn more</a>.</div></div>');

  $("#eh_popup")
    .css({
      'position': 'absolute',
      'top': windowHeight / 2 - 150,
      'left': windowWidth / 2 - 300,
      'padding': '30px',
      'width': '560px',
      'z-index': 11001
  });

  callback();
}


// Launch email search
//
function launchSearch() {
  if (window.last_company.length) {

    // Looking for domain name
    mainMessagePopup('Looking for ' + window.first_name + '\'s email address...', true);
    getWebsite(function(website) {
      if (typeof website !== "undefined") {
        window.domain = cleanDomain(website);

        $('#eh_popup_results_link_container').html('<div class="eh_popup_results_message">Looking for ' + window.domain + ' email addresses...</div>');

        // Use or not API key
        chrome.storage.sync.get('api_key', function(value){
          if (typeof value["api_key"] !== "undefined" && value["api_key"] !== "") {
            api_key = value["api_key"];
          }
          else { api_key = ''; }

          // Generate the email
          generate_email_endpoint = 'https://api.emailhunter.co/v1/generate?domain=' + window.domain + '&first_name=' + window.first_name + '&last_name=' + window.last_name;
          apiCall(api_key, generate_email_endpoint, function(email_json) {

            // We count call to measure use
            countCall();

            // Count how much email addresses there is on the domain
            count_endpoint = 'https://api.emailhunter.co/v1/email-count?domain=' + window.domain;
            apiCall(api_key, count_endpoint, function(count_json) {

              // If email addresses has NOT been found
              if (email_json.email == null) {

                // Maybe try to remove a subdomain if there is one
                if (withoutSubDomain(window.domain)) {
                  window.domain = withoutSubDomain(window.domain);
                  launchSearch();
                }
                else {
                  $("#eh_popup_content_container").css({'background-color': '#FFFCF4'});
                  mainMessagePopup("No result.");
                  showResultsCountMessage(count_json.count);

                  // If we have at least one email on the domain, we show it to help
                  if (count_json.count > 0) {
                    showEmailList();
                  }

                  // Maybe there are email addresses directly on the profile! Let's show them :)
                  showParsedEmailAddresses()
                }
              }

              // If email has been found
              else {
                showFoundEmailAddress(email_json, count_json);
                showParsedEmailAddresses();
              }

            askNewDomainListener();
            });
          });
        });
      }
      else {
        askDomainName(true);
      }
    });
  }
  else {
    showError(window.first_name + ' has no current professional experience.');
  }
}


// Show the main email address found
//
function showFoundEmailAddress(email_json, count_json) {
  $("#eh_popup_content_container").css({'background-color': '#FFFCF4'});
  mainMessagePopup(email_json.email);
  showConfidence(email_json.score);

  if (count_json.count > 1) { es = 'es' }
  else { es = '' }
  $('#eh_popup_results_link_container').html('<a class="eh_popup_results_link" href="https://emailhunter.co/search/' + window.domain + '?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup" target="_blank">' + count_json.count + ' email address' + es + ' for ' + window.domain + '<i class="fa fa-external-link"></i></a> <span class="eh_popup_separator">•</span> <span class="eh_popup_ask_domain">Try with an other domain name</span>');

  $("#eh_popup_results_link_container").slideDown(300);
}


// Show the number of email found on a domain name
//
function showResultsCountMessage(results_number) {
  if (results_number == 0) {
    $("#eh_popup_results_show").append('<p>Nothing found on <strong>' + window.domain + '</strong>. Maybe <span class="eh_popup_ask_domain">try another domain name</span>?</p>');
  } else if (results_number == 1) {
    $("#eh_popup_results_show").append('<p>One address found on ' + window.domain + ':</p>');
  } else {
    $("#eh_popup_results_show").append('<p>' + results_number + ' addresses found on ' + window.domain + ':</p>');
  }
}


// Search for email addresses on a string (in this case, the page body)
//
function parseProfileEmailAddresses(string) {
  return string.match(/([a-zA-Z][\w+\-.]+@[a-zA-Z\d\-]+(\.[a-zA-Z]+)*\.[a-zA-Z]+)/gi);
}


//
//
function showParsedEmailAddresses() {
  email_addresses = parseProfileEmailAddresses($("#background").html());

  if (email_addresses != null && email_addresses.length > 0) {
    if (email_addresses.length == 1) {
      $("#eh_popup_results_show").append('<p>One email address found on this profile:</p>');
    }
    else {
      $("#eh_popup_results_show").append('<p>' + email_addresses.length + ' email addresses found on this profile:</p>');
    }

    $.each(email_addresses.slice(0,10), function(email_key, email_val) {
      $("#eh_popup_results_show").append('<div class="eh_popup_email_list">' + email_val + '</div>');
    });

    $("#eh_popup_results_show").slideDown(300);
  }
}

// Show a list of email addresses found on the domain name
//
function showEmailList() {
  domain_search_endpoint = 'https://api.emailhunter.co/v1/search?domain=' + window.domain;
  apiCall(api_key, domain_search_endpoint, function(domain_json) {
    $.each(domain_json.emails.slice(0,10), function(email_key, email_val) {
      $("#eh_popup_results_show").append('<div class="eh_popup_email_list">' + email_val.value + '</div>');
    });

    $("#eh_popup_results_show").append('<div class="eh_popup_email_list"><a class="eh_popup_results_link" href="https://emailhunter.co/search/' + window.domain + '?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup" target="_blank">See results for ' + window.domain + '<i class="fa fa-external-link"></i></a> <span class="eh_popup_separator">•</span> <span class="eh_popup_ask_domain">Try with another domain name</span></div>');
    askNewDomainListener();
  });

  $("#eh_popup_results_show").slideDown(300);
}


// Ask a new domain on click
//
function askNewDomainListener() {
  $(".eh_popup_ask_domain").click(function () {
    $("#eh_popup_results_link_container").hide();
    $("#eh_popup_results_show").hide();
    askDomainName(false);
  });
}


// Show the main message in popup on LinkedIn
//
function mainMessagePopup(message, loader) {
  console.log(message);
  loader = loader || false;
  if (loader == true) {
    loader_html = '<img class="loader" src="' + chrome.extension.getURL('shared/img/loader.gif') + '" alt="Loading...">';
  }
  else { loader_html = ''; }

  $("#eh_popup_content").html(loader_html + message);
}


// Show confidence score
//
function showConfidence(score) {
  $(".eh_popup_confidence_score").html('<div class="eh_popup_confidence">' + score + '% confidence</div><div class="eh_popup_confidence_bar"><div class="eh_popup_confidence_level" style="width: ' + score + '%;"></div></div>');
  $(".eh_popup_confidence_score").show();
}


// Ask for the domain name
// Appends in two cases :
// - no domain name has been found
// - a domain has been found but gives no result
//
function askDomainName(showMessage) {
  $(".eh_popup_confidence_score").slideUp(300);

  $("#eh_popup_content_container").slideUp(300, function() {
    $("#eh_popup_ask_domain").slideDown(300, function() {
      $("#eh_popup_ask_domain_field").focus();
    });

    if (showMessage == true) {
      if (typeof window.domain == "undefined") {
        $("#eh_popup_ask_domain_message").html('We couldn\'t find <strong>' + window.last_company + '</strong> website. Please enter the domain name to launch the search. <a href="https://google.com/search?q= ' + window.last_company + '" target="_blank">Search the website on Google &#187;</a>');
      }
      else {
        $("#eh_popup_ask_domain_message").text('No email found with <strong>' + window.domain + '</strong>. Maybe try another domain name?');
      }
    }

    $("#eh_popup_ask_domain").submit(function() {
      $("#eh_popup_ask_domain").slideUp(300);
      $("#eh_popup_content_container").slideDown(300);
      window.domain = $("#eh_popup_ask_domain_field").val();
      launchSearch();

      return false;
    });
  });
}


// Throw an error
//
function showError(error) {
  $("#eh_popup_content_container").slideUp(300);
  $("#eh_popup_error").html(error).slideDown(300);
}


// Finds the domain name of the last experience or returns false
//
function getWebsite(callback) {
  if (typeof window.domain == "undefined") {
    if (typeof window.last_company != "undefined") {
      linkedin_company_page = "https://www.linkedin.com" + window.last_company_path;
      $.ajax({
        url : linkedin_company_page,
        type : 'GET',
        success : function(response){
          if (websiteFromCompanyPage(response) == "http://" || websiteFromCompanyPage(response) == false) {
            askDomainName(true);
          }
          else {
            callback(websiteFromCompanyPage(response));
          }
        },
        error : function() {
          askDomainName(true);
        }
      });
    }
    else {
      askDomainName(true);
    }
  }
  else {
    callback(window.domain);
  }
}


// Ajax API call
// Use the API key if it is defined. If there is a limitation issue, show the right limitation message
//
function apiCall(api_key, endpoint, callback) {

  if (api_key != '') {
    api_key_param = '&api_key=' + api_key;
  }
  else if (endpoint.indexOf("email-count") == -1) {
    endpoint = endpoint.replace("https://api.emailhunter.co/v1/", "https://api.emailhunter.co/trial/v1/");
    api_key_param = '';
  } else {
    api_key_param = '';
  }

  $.ajax({
    url : endpoint + api_key_param,
    headers: {"Email-Hunter-Origin": "chrome_extension"},
    type : 'GET',
    dataType : 'json',
    success : function(json){
      callback(json);
    },
    statusCode: {
      400: function(xhr) {
        showError('Sorry, something went wrong on the query.');
      },
      401: function(xhr) {
        showError('Email Hunter Chrome extension seems not to be associated to your account. Please sign in to continue.<br/><br/><a href="https://emailhunter.co/users/sign_in?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup" class="clear_cta" target="_blank">Sign in</a>');
      },
      500: function(xhr) {
        showError('Sorry, something went wrong on our side. Please try again later.');
      },
      429: function(xhr) {
        if (api_key != '') {
          showError('You\'ve reached your monthly quota. Please upgrade your account to continue using Email Hunter.<br/><br/><a href="https://emailhunter.co/subscription?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup" class="clear_cta" target="_blank">Upgrade my account</a>');
        }
        else {
          showError('You\'ve reached your daily limit, please connect to your Email Hunter account to continue. It\'s free and takes 30 seconds.<br/><br/><a href="https://emailhunter.co/users/sign_up?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup" class="clear_cta" target="_blank">Create a free account</a><a href="https://emailhunter.co/users/sign_in?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=linkedin_popup" class="eh_popup_signin_link" target="_blank">Sign in</a>');
        }
      }
    }
  });
}

// Clean domain functions
//
function cleanDomain(website){
  domain = website.toLowerCase();
  domain = domain.allReplace({'https://': '', 'http://': '', 'www.': ''});
  domain = cleanUrlEnd(domain);

  return domain;
}

function cleanUrlEnd(str) {
  if (str.indexOf('/') != -1) {
    str = str.substring(0, str.indexOf('/'));
  }
  if (str.indexOf('?') != -1) {
    str = str.substring(0, str.indexOf('?'));
  }

  return str;
}

String.prototype.allReplace = function(obj) {
  var retStr = this
  for (var x in obj) {
    retStr = retStr.replace(new RegExp(x, 'g'), obj[x])
  }
  return retStr
}
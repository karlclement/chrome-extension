// Get first name, last name, title and company
//
full_name_array = $(".full-name").text().split(" ");
window.first_name = full_name_array[0];
full_name_array.shift();
window.last_name = full_name_array.join(" ");

window.job_title = $("#headline .title").text()
window.last_company = $(".current-position h5:last-child a").first().text();


// Open popup on Linkedin profile
//
$(".eh_linkedin_button").click(function() {
  launchPopup();
});


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

  $("body").append('<div id="eh_popup"><i class="fa fa-ellipsis-v eh_popup_drag"></i><div class="eh_popup_close">&times;</div><div class="eh_popup_name">' + window.first_name + ' ' + window.last_name + '</div><div class="eh_popup_job_title">' + window.job_title + '</div><div id="eh_popup_error"></div><form id="eh_popup_ask_domain"><div id="eh_popup_ask_domain_message"></div><input placeholder="company.com" id="eh_popup_ask_domain_field" type="text" name="domain"><button class="clear_cta" type="submit">Find</button></form><div id="eh_popup_content_container"><div id="eh_popup_content"></div></div><div class="eh_popup_confidence_score"></div><div id="eh_popup_results_link_container"></div><div id="eh_popup_results_show"></div></div>');

  $("#eh_popup")
    .css({
      'position': 'absolute',
      'top': windowHeight / 2 - 150,
      'left': windowWidth / 2 - 300,
      'padding': '30px',
      'width': '520px',
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
          generate_email_endpoint = 'https://api.emailhunter.co/v1/generate?domain=' + window.domain + '&first_name=' + window.first_name + '&last_name=' + window.last_name;

          // Generate the email
          apiCall(api_key, generate_email_endpoint, function(json) {
            $("#eh_popup_content_container").css({'background-color': '#FFFCF4'});
            if (json.email == null) {
              mainMessagePopup("No result.");
              $("#eh_popup_results_show").show();
            }
            else {
              mainMessagePopup(json.email);
              showConfidence(json.score);

              $("#eh_popup_results_link_container").show();
            }
          });

          domain_search_endpoint = 'https://api.emailhunter.co/v1/search?domain=' + window.domain;
          apiCall(api_key, domain_search_endpoint, function(json) {

            if (json.results > 1) { es = '' }
            else { es = 'es' }

            $('#eh_popup_results_link_container').html('<a class="eh_popup_results_link" href="https://emailhunter.co/search/' + window.domain + '" target="_blank">' + json.results + ' email address' + es + ' for ' + window.domain + '</a> <span class="eh_popup_separator">•</span> <span class="eh_popup_ask_domain">Try with an other domain name</span>');

            if (json.results == 0) {
              $("#eh_popup_results_show").html('<p>We found nothing on <strong>' + window.domain + '</strong>. Maybe <span class="eh_popup_ask_domain">try another domain name</span>?</p>');
            } else if (json.results == 1) {
              $("#eh_popup_results_show").html('<p>One address found on ' + window.domain + ':</p>');
            } else {
              $("#eh_popup_results_show").html('<p>' + json.results + ' addresses found on ' + window.domain + ':</p>');
            }

            $.each(json.emails.slice(0,10), function(email_key, email_val) {
              $("#eh_popup_results_show").append('<div class="eh_popup_email_list">' + email_val.value + '</div>');
            });

            if (json.results > 0) {
              $("#eh_popup_results_show").append('<div class="eh_popup_email_list"><a class="eh_popup_results_link" href="https://emailhunter.co/search/' + window.domain + '" target="_blank">See results for ' + window.domain + '</a> <span class="eh_popup_separator">•</span> <span class="eh_popup_ask_domain">Try with another domain name</span></div>');
            }

            $(".eh_popup_ask_domain").click(function () {
              $("#eh_popup_results_link_container").hide();
              $("#eh_popup_results_show").hide();
              askDomainName(false);
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
}


// Ask for the domain name
// Appends in two cases :
// - no domain name has been found
// - a domain has been found but gives no result
//
function askDomainName(showMessage) {
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
    if (typeof $(".current-position h4 a").first().attr("href") != "undefined") {
      linkedin_company_page = "https://www.linkedin.com" + $(".current-position .new-miniprofile-container a").first().attr("href");
      $.ajax({
        url : linkedin_company_page,
        type : 'GET',
        success : function(response){
          if ($(response).find(".website a").text() == "http://") {
            askDomainName(true);
          }
          else {
            callback($(response).find(".website a").text());
          }
        },
        error : function() {
          askDomainName(true);
        }
      });
    }
  }
  else {
    callback(window.domain);
  }
}


// Calls Email Hunter API to look for the email pattern
// Use the API key if it is defined. If there is a limitation problem, show the right limitation message
//
function apiCall(api_key, endpoint, callback) {

  if (api_key != '') { api_key_param = '&api_key=' + api_key; }
  else { api_key_param = '' }

  $.ajax({
    url : endpoint + api_key_param,
    type : 'GET',
    dataType : 'json',
    success : function(json){
      callback(json);
    },
    statusCode: {
      401: function(xhr) {
        showError('Your API key seems not valid. Please connect to your account an generate a new key in your dashboard.');
      },
      500: function(xhr) {
        showError('Something went wrong on our side. Please try again later.');
      },
      429: function(xhr) {
        if (typeof api_key == "undefined") {
          showError('You\'ve reached your daily limit, please connect to your Email Hunter account to continue. It\'s free and take 30 seconds.<br/><br/><a href="https://emailhunter.co/users/sign_up" class="clear_cta" target="_blank">Create a free account</a>');
        }
        else {
          showError('You\'ve reached your monthly quota. Please upgrade your account to continue using Email Hunter.<br/><br/><a href="https://emailhunter.co/subscription" class="clear_cta" target="_blank">Upgrade my account</a>');
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
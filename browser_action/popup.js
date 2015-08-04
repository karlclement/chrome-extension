// Verify the API key and launch the popup search
//
chrome.tabs.getSelected(null, function(tab) {
  window.domain = new URL(tab.url).hostname.replace("www.", "");
  $("#currentDomain").text(window.domain);
  $("#completeSearch").attr("href", "https://emailhunter.co/search/" + window.domain + "?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=browser_popup");

  // Alternative search
  withoutSudomainLink();

  launchSearch();
  linkedinNotification();
});


// Suggest to search without subdomain
//
function withoutSudomainLink() {
  var subdomainsCount = (window.domain.match(/\./g) || []).length;
  if (subdomainsCount > 1) {
    newdomain = window.domain
    newdomain = newdomain.substring(newdomain.indexOf(".") + 1);
    $("#currentDomain").append("<span class='new-domain-link' title='Search just \"" + newdomain + "\"'>" + newdomain + "</a>");

    $(".new-domain-link").click(function() {
      newSearch(newdomain);
    });
  }
}


// Start a new search with a new domain
//
function newSearch(domain) {
  window.domain = domain;

  $("#currentDomain").text(window.domain);
  $("#completeSearch").attr("href", "https://emailhunter.co/search/" + window.domain + "?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=browser_popup");
  $(".loader").show();
  $("#resultsNumber").text("");

  $(".result").remove();
  $(".see_more").remove();

  launchSearch();
}


// Launch domain search
//
function launchSearch() {
  chrome.storage.sync.get('api_key', function(value){
    if (typeof value["api_key"] !== "undefined" && value["api_key"] !== "") {
      loadResults(value["api_key"]);
    }
    else {
      loadResults();
    }
  });
}


// Load the email addresses search of the current domain
//
function loadResults(api_key) {

  if (typeof api_key == "undefined") {
    url = 'https://api.emailhunter.co/trial/v1/search?domain=' + window.domain;
  }
  else {
    url = 'https://api.emailhunter.co/v1/search?domain=' + window.domain + '&api_key=' + api_key;
  }

  $.ajax({
    url : url,
    type : 'GET',
    dataType : 'json',
    success : function(json){
      $(".results").slideDown(300);
      resultsMessage(json.results);
      $(".loader").hide();

      // Each email
      $.each(json.emails.slice(0,20), function(email_key, email_val) {
        $(".results").append('<div class="result"><p class="sources-link">' + sourcesText(email_val.sources.length) + '<i class="fa fa-caret-down"></i></p><p class="email-address">' + email_val.value + '</p><div class="sources-list"></div></div>');

        // Each source
        $.each(email_val.sources, function(source_key, source_val) {

          if (source_val.uri.length > 60) { show_link = source_val.uri.substring(0, 50) + "..."; }
          else { show_link = source_val.uri; }

          $(".sources-list").last().append('<div class="source"><a href="' + source_val.uri + '" target="_blank">' + show_link + '</a></div>');
        });
      });

      if (json.emails.length > 20) {
        $(".results").append('<a class="see_more" target="_blank" href="https://emailhunter.co/search/' + window.domain + '?utm_source=chrome_extension&utm_medium=extension&utm_campaign=extension&utm_content=browser_popup">See all the emails</a>');
      }

      // Deploy sources
      $(".sources-link").click(function () {
        if ($(this).parent().find(".sources-list").is(":visible")) {
          $(this).parent().find(".sources-list").slideUp(300);
          $(this).find(".fa-caret-up").removeClass("fa-caret-up").addClass("fa-caret-down")
        }
        else {
          $(this).parent().find(".sources-list").slideDown(300);
          $(this).find(".fa-caret-down").removeClass("fa-caret-down").addClass("fa-caret-up")
        }
      });
    },
    statusCode: {
      401: function(xhr) {
        $(".connect-container").slideDown(300);
        $(".loader").hide();
      },
      500: function(xhr) {
        $(".error-message").text("Something went wrong on our side, please try again later.");
        $(".error").slideDown(300);
        $(".loader").hide();
      },
      429: function(xhr) {
        if (typeof api_key == "undefined") {
          $(".connect-container").slideDown(300);
          $(".loader").hide();
        }
        else {
          $(".upgrade-container").slideDown(300);
          $(".loader").hide();
        }
      }
    }
  });
}


// Show the success message with the number of email addresses
//
function resultsMessage(results_number) {
  if (results_number == 0) {
    $("#resultsNumber").text('No email address found.');
  }
  else if (results_number == 1) {
    $("#resultsNumber").text('One email address found.');
  }
  else {
    $("#resultsNumber").text(results_number + ' email addresses found.');
  }
}


// Show the number of sources
//
function sourcesText(sources) {
  if (sources == 1) {
    sources = "1 source";
  }
  else if (sources < 20) {
    sources = sources + " sources";
  }
  else {
    sources = "20+ sources";
  }
  return sources;
}


// Show a notification to explain how to use EH on Linkedin if user is on Linkedin
//
function linkedinNotification() {
  if (window.domain == "linkedin.com") {
    $('.linkedin-notification').slideDown(300);
  }
}
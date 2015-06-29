// Verify the API key and launch the popup search
//
chrome.tabs.getSelected(null, function(tab) {
  window.domain = new URL(tab.url).hostname.replace("www.", "");
  $("#currentDomain").text(domain);
  $("#completeSearch").attr("href", "https://emailhunter.co/search/" + window.domain);

  chrome.storage.sync.get('api_key', function(value){
    if (typeof value["api_key"] !== "undefined" && value["api_key"] !== "") {
      loadResults(value["api_key"]);
    }
    else {
      loadResults();
    }
  });
});


// Load the email addresses search of the current domain
//
function loadResults(api_key) {
  if (typeof api_key == "undefined") { api_key_param = ""; }
  else { api_key_param = "&api_key=" + api_key; }

  $.ajax({
    url : 'https://api.emailhunter.co/v1/search?domain=' + window.domain + '&api_key=' + api_key,
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
        $(".results").append('<a class="see_more" target="_blank" href="https://emailhunter.co/search/' + window.domain + '">See all the emails</a>');
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
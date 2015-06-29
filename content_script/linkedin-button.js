// Inject Email Hunter button on Linkedin profile
//
var icon = chrome.extension.getURL('shared/img/icon48_white.png');

if ($(".button-secondary").length) {
  $('.profile-actions.view-actions [data-action-name="add-to-network"]').after('<button class="eh_linkedin_button"><img src="' + icon + '">Email</button>');
}
else {
  $(".profile-actions.view-actions .katy-button-menu").after('<button class="eh_linkedin_button eh_linked_connected"><img src="' + icon + '">Email</button>');
}
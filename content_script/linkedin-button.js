//
// Email Hunter icon for button
//
var icon = chrome.extension.getURL('shared/img/icon48_white.png');

//
// Inject Email Hunter button on Linkedin profile
//
if (isSalesNavigator()) {
  $(".profile-actions").prepend('<button style="margin: 0 10px 0 0;" class="eh_linkedin_button eh_linked_connected"><img src="' + icon + '">Email</button>');
}
else {
  $(".profile-aux .profile-actions").prepend('<button style="margin: 0 5px 0 0;" class="eh_linkedin_button eh_linked_connected"><img src="' + icon + '">Email</button>');
}

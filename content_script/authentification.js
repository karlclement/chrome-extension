// Email Hunter extension can be used without authentification but with low
// limitation. When the quota is reached, user is invited to connect to its EH
// account. The extention will read the API key on EH website and store it in
// Chrome local storage.
//
if (window.location.href == "https://emailhunter.co/chrome/welcome" ||
    window.location.href == "https://emailhunter.co/dashboard") {
  api_key = document.getElementById("api_key").innerHTML;
  chrome.storage.sync.set({'api_key': api_key}, function() {
    console.log("Email Hunter extension successfully installed.");
  });
}
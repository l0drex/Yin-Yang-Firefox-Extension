/*
On startup, connect to the "yin_yang" app.
*/
var time_day, time_night;
var theme_light = "firefox-compact-light@mozilla.org";
var theme_dark = "firefox-compact-dark@mozilla.org";
    
function checkTime() {
  date = new Date();
  hours = date.getHours();
  if ((hours >= time_day) && (hours < time_night)) {
    browser.management.setEnabled(theme_light, true);
  } else {
    browser.management.setEnabled(theme_dark, true);
  }
}

function onResponse(response) {
  var theme_active = ''
  if (response.schedule) {
    time_day = response.time_day;
    time_night = response.time_night;
    theme_light = response.theme_light;
    theme_dark = response.theme_dark;
    console.log("Time Day: " + response.time_day);
    console.log("Time Night: " + time_night);
    console.log("Theme Light: " + theme_light);
    console.log("Theme Dark: " + theme_dark);

    checkTime();
    browser.alarms.create('checkTime', {periodInMinutes: 2});
  } else {
    theme_active = response.theme_active;
    browser.management.setEnabled(theme_active, true);
    console.log(`Switched to theme ${theme_active}`)
  }
}

function onError(error) {
  console.log(`Error: ${error}`);
}


// Check settings from yin_yang
console.log("Check settings.")
var sending = browser.runtime.sendNativeMessage("yin_yang", "GetSettings");
sending.then(onResponse, onError);

browser.alarms.onAlarm.addListener(checkTime);

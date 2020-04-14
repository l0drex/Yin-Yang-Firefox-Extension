/*
On startup, connect to the "yin_yang" app.
*/
var schedule = false;
var time_day = new Object(), time_night = new Object();
var theme_light = "firefox-compact-light@mozilla.org",
    theme_dark = "firefox-compact-dark@mozilla.org";
    
function checkTime() {
  console.log("Check time");
  date = new Date();
  hours = date.getHours();
  minutes = date.getMinutes();
  if ((hours >= time_day[0]) && (minutes >= time_day[1]) && (hours < time_night[0]) && (minutes >= time_day[1])) {
    browser.management.setEnabled(theme_light, true);
  } else {
    browser.management.setEnabled(theme_dark, true);
  }
}

function onResponse(response) {
  var theme_active = '';
  if (response.schedule) {
    time_day = response.time_day;
    time_night = response.time_night;
    theme_light = response.theme_light;
    theme_dark = response.theme_dark;
    console.log("Time Day: " + time_day[0] + ":" + time_day[1]);
    console.log("Time Night: " + time_night[0] + ":" + time_night[1]);
    console.log("Theme Light: " + theme_light);
    console.log("Theme Dark: " + theme_dark);

    checkTime();
  } else {
    theme_active = response.theme_active;
    browser.management.setEnabled(theme_active, true);
    console.log(`Switched to theme ${theme_active}`);
  }
}

function onError(error) {
  console.log(`Error: ${error}`);
}


// Check settings from yin_yang
console.log("Check settings.");
var sending = browser.runtime.sendNativeMessage("yin_yang", "GetSettings");
sending.then(onResponse, onError);

if (schedule) {
    browser.alarms.create('checkTime', {periodInMinutes: 2});
}

browser.alarms.onAlarm.addListener(checkTime);

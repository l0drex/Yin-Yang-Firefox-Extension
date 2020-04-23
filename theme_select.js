/*
On startup, connect to the "yin_yang" app.
*/
var schedule = false;
var Time_schedule = new Date();
var time_day = new Object(), time_night = new Object();
var theme_light = "firefox-compact-light@mozilla.org",
    theme_dark = "firefox-compact-dark@mozilla.org";

// every time the theme has changed

function setTime(time) {
    // set time to next schedule
    Time_schedule.setHours(time[0]);
    Time_schedule.setMinutes(time[1]);
    if (Time_schedule.getTime() < Date.now()) {
        Time_schedule.setDate(Time_schedule.getDate() + 1)
    }
    console.log("Time for next schedule: " + Time_schedule.toLocaleString());
}

function setDay() {
    console.log("Enable light theme");
    // apply light theme
    browser.management.setEnabled(theme_light, true);
    // set alarm for night mode
    setTime(time_night);
    browser.alarms.create('alarm_night', {when: Time_schedule.getTime()});
}

function setNight() {
    // apply dark theme
    console.log("Enable dark theme");
    browser.management.setEnabled(theme_dark, true);
    // set alarm for day mode
    setTime(time_day);
    browser.alarms.create('alarm_day', {when: Time_schedule.getTime()});
}

// only on startup
function onResponse(response) {
    // if the theme should change automatically
    if (response.schedule) {
        // apply settings
        schedule = response.schedule;
        time_day = response.time_day;
        time_night = response.time_night;
        theme_light = response.theme_light;
        theme_dark = response.theme_dark;
        console.log("Time Day: " + time_day[0] + ":" + time_day[1]);
        console.log("Time Night: " + time_night[0] + ":" + time_night[1]);
        console.log("Theme Light: " + theme_light);
        console.log("Theme Dark: " + theme_dark);
        // decide which theme to choose
        checkTime();
        // if the theme is static
    } else {
        // apply the active theme
        var theme_active = response.theme_active;
        browser.management.setEnabled(theme_active, true);
        console.log(`Switched to theme ${theme_active}`);
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function checkTime() {
    // get current time
    date = new Date();
    hours = date.getHours();
    minutes = date.getMinutes();
    var time = hours + ":" + minutes
    // if its time for light theme
    if ((hours >= time_day[0]) && (minutes >= time_day[1]) && (hours <= time_night[0]) && (minutes < time_night[1])) {
        setDay();
        // else choose nigh theme
    } else {
        setNight();
    }
}

// Check settings from yin_yang
console.log("Check settings.");
var sending = browser.runtime.sendNativeMessage("yin_yang", "GetSettings");
sending.then(onResponse, onError);

browser.alarms.onAlarm.addListener((alarm_day) => {
    setDay();
});

browser.alarms.onAlarm.addListener((alarm_night) => {
    setNight();
})

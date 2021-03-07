let time_light, time_dark;
let theme_light, theme_dark;

function setTheme(theme) {
    browser.management.setEnabled(theme, true);
    console.log(`Switched to theme ${theme}`);
}

function shouldBeDark() {
    // get current time
    let time_current = new Date();

    // increment day if alarms have passed
    if (time_current > time_light) time_dark.day++;
    if (time_current > time_dark) time_dark.day++;

    if (time_light < time_dark) {
        return !(time_light <= time_current < time_dark);
    } else {
        return time_dark <= time_current < time_light;
    }
}

function onResponse(response) {
    // if the theme should change automatically
    if (response.schedule) {
        // apply settings
        time_light = new Date()
        time_light.setHours(response.time_day[0], response.time_day[1])
        theme_light = response.theme_light;
        console.log(theme_light + " will be activated at " + time_light.toTimeString())

        time_dark = new Date()
        time_dark.setHours(response.time_night[0], response.time_night[1])
        theme_dark = response.theme_dark;
        console.log(theme_dark + " will be activated at " + time_dark.toTimeString())

        if (shouldBeDark()) {
            setTheme(theme_dark);
        } else {
            setTheme(theme_light);
        }
        browser.alarms.create('alarm_day', {when: time_light})
        browser.alarms.create('alarm_night', {when: time_dark})
    } else {
        // apply the theme
        setTheme(response.theme_active);
    }
}

function onError(error) {
    console.error(`Error: ${error}`);
}

// Check settings from yin_yang
console.debug("Loading settings from native application");
browser.runtime.sendNativeMessage("yin_yang", "GetSettings").then(onResponse, onError);

browser.alarms.onAlarm.addListener((alarm_day) => {
    setTheme(theme_light);
    browser.alarms.create('alarm_night', {when: time_dark});
});

browser.alarms.onAlarm.addListener((alarm_night) => {
    setTheme(theme_dark);
    browser.alarms.create('alarm_day', {when: time_light});
});

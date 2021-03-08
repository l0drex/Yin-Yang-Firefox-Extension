var themes = [0, 1];
var times = [0, 1];

function setTheme(dark_mode) {
    console.log((dark_mode ? 'Enabling' : 'Disabling')+ ' dark mode');
    let theme;
    if (dark_mode) {
        theme = themes[1];
    } else {
        theme = themes[0];
    }

    if (!browser.management.get(theme).enabled) {
        browser.management.setEnabled(theme, true);
        console.debug(`Switched to theme ${theme}`);
    }
}

function shouldBeDark(time_light, time_dark) {
    // get current time
    let time_current = Date.now();

    // if light is activated first
    if (time_light < time_dark) {
        // true, if current time is not in light period
        return !(time_light <= time_current < time_dark);
    } else {
        // true, if current time is in dark period
        return time_dark <= time_current < time_light;
    }
}

function onResponse(response) {
    if (!response.enabled) {
        console.log("Yin Yang is disabled")
        return;
    }

    themes = response.themes;
    setTheme(response.dark_mode);

    if (!response.scheduled) {
        console.log("Automatic theme switching is disabled");
        return;
    }

    // if the theme should change automatically
    times = response.times;
    for (let i of [0, 1]) { // 1: dark_mode
        // create an alarm
        const when = times[i];
        const periodInMinutes = 60 * 24;

        console.debug('Creating alarm at ' + when + ' for every ' + periodInMinutes);
        browser.alarms.create("alarm_" + i, {
            when,
            periodInMinutes
        });

        // check that it was successful
        browser.alarms.get("alarm_" + i).then((alarm) => {
            console.debug(themes[i] + " will be activated at " + alarm.scheduledTime);
        }, () => {
            console.error("Alarm was not created correctly.");
        });
    }

    // add listener
    browser.alarms.onAlarm.addListener((alarm) => {
        console.debug("Alarm: " + alarm.name);
        switch (alarm.name) {
            case "alarm_0":
                setTheme(false);
                break;
            case "alarm_1":
                setTheme(true);
                break;
            default:
                break;
        }
    });
}

function onError(error) {
    console.error(`Error: ${error}`);
}

// Ask for settings from yin_yang
console.debug("Loading settings from native application");
browser.runtime.sendNativeMessage("yin_yang", "GetSettings").then(onResponse, onError);

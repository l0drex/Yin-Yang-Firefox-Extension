var themes = [0, 1];
var times = [0, 1];

function setTheme(dark_mode) {
    console.log((dark_mode ? 'Enabling' : 'Disabling')+ ' dark mode');
    let theme = themes[dark_mode ? 1 : 0];

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

function changeTheme() {
    let dark_mode = shouldBeDark()
    // set appropriate theme
    setTheme(dark_mode)
    // increase time for next alarm by on day
    console.debug('old time: ' + times[dark_mode ? 1 : 0]);
    times[dark_mode ? 1 : 0] += 60 * 60 * 24;
    console.debug('new time: ' + times[dark_mode ? 1 : 0]);

    // create an alarm
    browser.alarms.clearAll();
    const when = times[dark_mode ? 1 : 0];
    console.debug('Creating alarm at ' + when);
    browser.alarms.create("auto_dark_mode", {
        when
    });

    // check that it was successful
    browser.alarms.get("auto_dark_mode").then((alarm) => {
        console.debug(themes[!dark_mode ? 1 : 0] + " will be activated at " + alarm.scheduledTime);
    }, () => {
        console.error("Alarm was not created correctly.");
    });
}

function onResponse(response) {
    console.debug('received response')
    if (!response.enabled) {
        console.log("Yin Yang is disabled")
        return;
    }

    themes = response.themes;

    if (!response.scheduled) {
        console.log("Automatic theme switching is disabled");
        setTheme(response.dark_mode);
        return;
    }

    // if the theme should change automatically:
    times = response.times;
    changeTheme();

    // add listener for alarms
    browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === "auto_dark_mode") {
            changeTheme();
        }
    });
}

function onError(error) {
    console.error(`Error: ${error}`);
}

// Ask for settings from yin_yang
console.debug("Loading settings from native application");
browser.runtime.sendNativeMessage("yin_yang", "GetSettings").then(onResponse, onError);

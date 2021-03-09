let themes = [0, 1];
let times = [0, 1];

function setTheme(dark) {
    let theme = themes[dark ? 1 : 0];

    browser.management.get(theme).then(theme => {
        if (!theme.enabled) {
            browser.management.setEnabled(theme, true);
            console.log(`Switched to theme ${theme}`);
        }
    }, () => {
        console.error('Theme is not installed.')
    })
}

function shouldBeDark(time_light, time_dark) {
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

function update_alarm() {
    // get currently used mode
    let dark_mode = shouldBeDark()

    // increase time for next alarm by one day
    times[dark_mode ? 1 : 0] += 60 * 60 * 24;

    // create a new alarm to switch to other theme
    browser.alarms.clearAll();
    const when = times[!dark_mode ? 1 : 0];
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

function applyConfig(response) {
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
    setTheme(shouldBeDark())
    update_alarm();
}

// Ask for settings from yin_yang
console.debug("Loading settings from native application");
browser.runtime.sendNativeMessage("yin_yang", "GetSettings").then(
    applyConfig,
    () => console.error(`Error: ${error}`)
);

// add listener for alarms
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "auto_dark_mode") {
        console.log('alarm ' + alarm.name + ' went off');
        setTheme(shouldBeDark())
        update_alarm();
    }
});

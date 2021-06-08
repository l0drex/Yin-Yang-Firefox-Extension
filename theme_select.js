let themes = [0, 1];
let times = [0, 1];

function setTheme(dark) {
    let theme_id = themes[dark ? 1 : 0];

    browser.management.get(theme_id).then(theme => {
        if (!theme.enabled) {
            console.info(`Switching to theme ${theme.name}`);
            browser.management.setEnabled(theme.id, true);
        } else {
            console.warn(theme.name, ' is already enabled!')
        }
    }, () => {
        console.error('Theme is not installed.')
    })
}

function shouldBeDark() {
    let time_dark = times[1];

    return Date.now() >= time_dark;
}

function update_alarm(dark_mode) {
    // create a new alarm to switch to other theme
    browser.alarms.clearAll();
    const when = times[(!dark_mode) ? 1 : 0];
    console.debug("Creating new alarm for theme", themes[(!dark_mode) ? 1 : 0], 'for', new Date(when).toLocaleString());
    console.assert(when > Date.now(),
        "The scheduled alarm time", new Date(when).toLocaleString(), "is in the past!");
    browser.alarms.create("auto_dark_mode", {
        when
    });

    // check that it was successful
    browser.alarms.get("auto_dark_mode").then((alarm) => {
        console.assert(alarm.scheduledTime === when, "The time for the scheduled alarm is incorrect!");
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
    setTheme(response.dark_mode);

    if (!response.scheduled) {
        console.log("Automatic theme switching is disabled");
        return;
    }

    // if the theme should change automatically:
    for (let i of [0, 1]) {
        times[i] = response.times[i]*1000;
    }
    console.assert(shouldBeDark() === response.dark_mode,
        "Expected dark mode and active dark mode differ!");
    update_alarm(response.dark_mode);
}


// Ask for settings from yin_yang
console.debug("Loading settings from native application");
browser.runtime.sendNativeMessage("yin_yang", 'firefox').then(
    applyConfig,
    (error) => console.error(`Error: ${error}`)
);

// add listener for alarms
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "auto_dark_mode") {
        console.debug('alarm ' + alarm.name + ' went off');
        let dark_mode = shouldBeDark();
        setTheme(dark_mode);

        // increase time for next alarm by one day
        times[dark_mode ? 1 : 0] += 60 * 60 * 24 * 1000;
        update_alarm(shouldBeDark());
    }
});

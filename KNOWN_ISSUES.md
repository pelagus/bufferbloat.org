# Known Issues

## Limited device testing

The current UX has only been manually tested on a limited set of devices and screen sizes.

Known tested surfaces include:

- desktop browser
- iPhone-sized mobile viewport
- iPad-sized tablet viewport

More testing is needed across:

- Android phones
- smaller iPhones
- large desktop monitors
- Safari
- Firefox
- Chromium-based browsers
- low-powered devices

## Methodology can be improved

The current browser-based methodology is useful but not final.

Areas for improvement include:

- latency sampling strategy
- upload stress calibration
- download stress calibration
- outlier handling
- grading thresholds
- browser scheduling effects
- Wi-Fi variability
- VPN/proxy effects
- mobile network behavior

## Browser limitations

A browser-based test cannot fully control:

- background traffic
- device CPU load
- router behavior
- Wi-Fi interference
- ISP congestion
- browser scheduling
- operating system networking behavior

The test should avoid claiming certainty from a single run.

## Production signup storage

The current email signup mechanism is simple and should eventually move to durable storage.

Potential options:

- database
- mailing list provider
- privacy-preserving backend service

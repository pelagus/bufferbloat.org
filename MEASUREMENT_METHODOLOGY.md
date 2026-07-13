# Measurement Methodology

bufferbloat.org is a browser-based bufferbloat test for measuring internet
reliability under load.

The goal is to estimate whether latency increases significantly when a
connection is busy. The test is designed as a transparent diagnostic signal, not
as a laboratory-grade replacement for controlled network instrumentation.

In practical terms, the test asks a narrow question:

> Does this connection continue to respond while download and upload traffic are
> active?

## Test phases

Before recording samples, the browser performs a short session warm-up. This
warms DNS/TLS/CORS/fetch paths with small ping, download, and upload requests,
then gives the connection a brief moment to settle. Warm-up samples are not
included in the reported medians.

Latency probes use a small Cloudflare Speed endpoint instead of the large
download-file origin. This avoids treating same-origin browser/CDN contention as
network latency under load.

The visible run is organized as five stages:

1. Warm-up
2. Quiet-line latency
3. Download latency under load
4. Upload latency under load
5. Result computation

Only three stages produce scored latency medians:

1. Quiet-line latency
2. Download latency under load
3. Upload latency under load

The result page shows these three scored phases as a latency trace. Quiet
samples are shown in black, download-loaded samples in blue, and upload-loaded
samples in purple. Final phase medians are overlaid in red on the completed
chart.

For accuracy, the running test asks the user to keep the tab in the foreground.
If the tab leaves the foreground, the run is stopped instead of silently
producing a questionable result.

## Quiet-line latency

The quiet-line phase measures baseline response time before intentionally adding traffic pressure.

This establishes the reference point for later comparison.

## Download latency under load

The download phase creates download pressure and measures whether ping latency increases while data is being received.

The browser starts several download streams, lets the load settle briefly, and
then records loaded-latency samples while the download pressure continues. The
early settling period is excluded from the reported median.

The current public browser test uses a 100 MB download payload repeated across
four parallel download streams. Parallel streams are used to create sustained
pressure from a webpage without requiring a local helper application.

## Upload latency under load

The upload phase creates upload pressure and measures whether ping latency increases while data is being sent.

Upload pressure is often especially important because many consumer connections have much lower upload capacity than download capacity.

The upload phase follows the same settling rule as download: pressure starts
first, then loaded-latency samples are recorded after the initial ramp period.

Upload pressure uses repeated small chunks sent to Cloudflare Speed's upload
endpoint. Throughput is an estimate based on server-confirmed completed bytes,
not a laboratory-grade upload-speed measurement.

The current public browser test sends repeated 1 MB upload chunks across three
parallel upload streams.

## Aggregation

The test favors median-style reporting over highly sensitive single samples.

This helps reduce noise from isolated spikes.

The primary latency values are:

- quiet median latency
- download-loaded median latency
- upload-loaded median latency
- download stress, calculated as download-loaded median minus quiet median
- upload stress, calculated as upload-loaded median minus quiet median
- worst loaded latency, calculated as the higher of the two loaded medians

The result page also exposes a technical-details table with the measurement
record used for the scorecard, including phase medians, stress deltas,
throughput estimates, scored sample counts, recorded sample ranges, traffic
generation notes, and application-fit scoring. That table can be exported as a
CSV file for independent inspection or comparison.

## Grading

The bufferbloat grade compares quiet latency with latency under download and
upload pressure.

Grades should be stable enough that repeated tests on the same connection do not jump wildly because of one noisy sample.

Low throughput should influence explanatory wording, but should not automatically be treated as bufferbloat.

The current grade scale runs from A+ to F. The grade is primarily about latency
stability under load. Throughput is reported because it matters for many real
applications, but low bandwidth by itself is not scored as bufferbloat.

The application-fit list on the result page is an interpretation layer. It ranks
common uses of the connection using measured latency under load, latency
movement, and relevant throughput. It is intentionally kept separate from the
core bufferbloat grade so that the raw measurement remains inspectable.

## Privacy and exported data

The core test does not require an account, a local helper application, or a
browser extension.

The technical-details export contains measurement data only. It does not include
IP address, location, browser fingerprint, user-agent string, or device identity.

## Known limitations

Browser-based measurement is inherently noisy.

Results can be affected by:

- browser scheduling
- device performance
- Wi-Fi conditions
- VPNs
- background apps
- background downloads
- router queue behavior
- ISP congestion
- mobile network variability

The test should be treated as a useful diagnostic signal, not a laboratory-grade network measurement.

## Open questions

Areas where community input would be valuable:

- better browser-safe latency sampling
- better load generation strategy
- more stable grading thresholds
- more accurate upload stress measurement
- comparison with established bufferbloat tools
- cross-browser validation
- mobile network behavior

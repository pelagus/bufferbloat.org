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
then gives the connection a brief moment to settle. Warm-up latency samples are
shown during the live run as unscored context, but they are not included in the
reported medians or grade.

Immediately before quiet-line scoring, the browser also sends a short series of
unscored latency probes. These warm the baseline ping path without adding
download or upload pressure. The reported quiet median is calculated only from
the scored samples collected after that quiet-line warm-up.

Latency probes use a small Cloudflare Speed endpoint instead of the large
download-file origin. This avoids treating same-origin browser/CDN contention as
network latency under load.

The visible run emphasizes the three stages that produce scored latency
medians:

1. Quiet-line latency
2. Download latency under load
3. Upload latency under load

Warm-up and result computation still happen, but they are shown as preparation
and calculation states rather than scored measurement phases. The warm-up
download and upload checks are real network requests used to prepare the fetch
paths; they are not part of the scored throughput result.

The result page shows these three scored phases as rolling median trend lines,
with final phase median markers and upper-tail latency-spread bands overlaid on
the completed chart. The live chart shows raw ping dots while the run is in
progress, including grey warm-up pings that are explicitly excluded from the
result.

The chart uses a robust vertical scale so a one-off extreme ping does not
flatten the main pattern. The visible scale is based on the upper end of the
sample distribution and the median-plus-spread anchors. Samples above the
visible scale are clipped to the top edge and marked as high spikes. Their raw
values are still preserved in the tooltip, technical table, CSV export, and
score calculation.

For accuracy, the running test asks the user to keep the tab in the foreground.
If the tab leaves the foreground, the run is stopped instead of silently
producing a questionable result.

## Quiet-line latency

The quiet-line phase measures baseline response time before intentionally adding traffic pressure.

The browser first warms the latency probe path with unscored quiet pings. It
then records the scored quiet samples that establish the reference point for
later comparison.

## Download latency under load

The download phase creates download pressure and measures whether ping latency increases while data is being received.

The browser starts several download streams, lets the load settle briefly, and
keeps sending latency probes during that settling period. Those early probes are
excluded from the reported median. The scored loaded-latency samples begin only
after the download pressure has had time to stabilize.

The current public browser test uses a 100 MB download payload repeated across
four parallel download streams. Parallel streams are used to create sustained
pressure from a webpage without requiring a local helper application.

## Upload latency under load

The upload phase creates upload pressure and measures whether ping latency increases while data is being sent.

Upload pressure is often especially important because many consumer connections have much lower upload capacity than download capacity.

The upload phase follows the same settling rule as download: pressure starts
first, latency probes continue during the ramp period, and only later
loaded-latency samples are recorded for scoring.

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
- latency spread, calculated for each phase as 95th percentile latency minus
  median latency

The result page also exposes a technical-details table with the measurement
record used for the scorecard, including phase medians, stress deltas,
latency spread, throughput estimates, scored sample counts, raw scored
latency sample lists, recorded sample ranges, traffic generation notes, and
application-fit scoring. That table can be exported as a CSV file for
independent inspection or comparison.

Latency spread uses a 95th-percentile spread rather than the single worst
sample. This is intended to capture the upper-end ping instability a user is
likely to feel while reducing the chance that one isolated browser or network
hiccup dominates the interpretation.

Because each browser phase may only contain a few dozen scored samples, p95 is
treated as a diagnostic tail-latency signal rather than the main estimate of
network quality. Rare stalls remain visible in the chart, raw samples, technical
details, and CSV export, but application-fit scoring uses a more robust
upper-tail estimate when sample counts are small. In those smaller runs the
application layer leans closer to p90-style spread, so one or two isolated
spikes can raise spike-risk wording without overwhelming ratings that should be
based on sustained behavior.

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
movement, robust tail latency, and relevant throughput. It is intentionally kept
separate from the core bufferbloat grade so that the raw measurement remains
inspectable.

## Privacy and exported data

The core test does not require an account, a local helper application, or a
browser extension.

The technical-details export contains measurement data only. It does not include
IP address, location, browser fingerprint, user-agent string, or device identity.

Bufferbloat.org stores first-party operational analytics for test quality and
shared result links: session/test events, success or failure, coarse location
from hosting headers, broad browser/OS/device category, bucketed viewport,
measured results, chart samples, and application-fit scores. It does not store
IP addresses, precise geolocation, full user-agent strings, or fingerprinting
signals.

Shared result pages are backed by the same completed-test analytics record;
they do not create a second copy of the result. Analytics and shared result
records are retained for up to 180 days and are deleted automatically after
that window.

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

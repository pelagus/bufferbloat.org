# Measurement Methodology

bufferbloat.org measures responsiveness under load in the browser.

The goal is to estimate whether latency increases significantly when a connection is busy.

## Test phases

The test currently runs three phases:

1. Quiet-line latency
2. Download latency under load
3. Upload latency under load

## Quiet-line latency

The quiet-line phase measures baseline response time before intentionally adding traffic pressure.

This establishes the reference point for later comparison.

## Download latency under load

The download phase creates download pressure and measures whether ping latency increases while data is being received.

## Upload latency under load

The upload phase creates upload pressure and measures whether ping latency increases while data is being sent.

Upload pressure is often especially important because many consumer connections have much lower upload capacity than download capacity.

## Aggregation

The test favors median-style reporting over highly sensitive single samples.

This helps reduce noise from isolated spikes.

## Grading

The responsiveness grade compares quiet latency with latency under download and upload pressure.

Grades should be stable enough that repeated tests on the same connection do not jump wildly because of one noisy sample.

Low throughput should influence explanatory wording, but should not automatically be treated as bufferbloat.

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

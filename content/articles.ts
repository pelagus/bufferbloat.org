import type { Metadata } from "next";

export type LearnArticle = {
  slug: string;
  metadata: {
    title: string;
    description: string;
    openGraphTitle?: string;
  };
  guide: {
    eyebrow: string;
    title: string;
    intro: string;
    calloutLabel: string;
    calloutTitle: string;
    calloutBody: string;
    cards: Array<{
      label: string;
      title: string;
      body: string;
    }>;
    notes: Array<{
      title: string;
      body: string[];
    }>;
    related: Array<{
      href: string;
      label: string;
    }>;
    deepDive?: {
      href: string;
      label: string;
      title: string;
      body: string;
    };
    applicationRatings?: {
      title: string;
      body: string;
      caption: string;
      labels: Array<{
        label: string;
        body: string;
      }>;
    };
  };
};

export const learnArticles: LearnArticle[] = [
  {
    slug: "internet-reliability-test",
    metadata: {
      title: "Internet Reliability Is More Than Speed - Internet Reliability Test",
      description:
        "An internet reliability test should answer whether your connection stays usable in real life, not only how many Mbps it can report.",
      openGraphTitle: "Internet Reliability Is More Than Speed",
    },
    guide: {
      eyebrow: "internet reliability test",
      title: "Internet reliability is more than speed",
      intro:
        "When people search for an internet reliability test, they are usually not asking for a bigger speed number. They are asking whether the connection can be trusted for calls, work, gaming, streaming, uploads, and normal household use. Bufferbloat.org answers that practical question by checking what happens when the line is busy.",
      calloutLabel: "test real-life reliability",
      calloutTitle: "Run the bufferbloat test",
      calloutBody:
        "The test measures quiet-line ping, ping while download is active, ping while upload is active, throughput, and p95 latency spread.",
      cards: [
        {
          label: "1",
          title: "Reliability is about use",
          body:
            "A reliable connection is one you can depend on while real things are happening: calls, uploads, streaming, browsing, and other people sharing the line.",
        },
        {
          label: "2",
          title: "Speed is only capacity",
          body:
            "Throughput tells you how much data can move. It does not prove that small, time-sensitive packets still move promptly when the line is full.",
        },
        {
          label: "3",
          title: "Bufferbloat is the hidden failure",
          body:
            "A connection can look fast and still become unreliable under load. That is why a reliability test needs to measure ping while traffic is active.",
        },
      ],
      notes: [
        {
          title: "What reliability means here",
          body: [
            "Reliability is not uptime alone. For everyday internet use, it means the connection keeps responding while it is doing work. A line that only behaves well when quiet is not reliable enough for how people actually use the internet.",
            "Bufferbloat matters because it is one of the common ways a connection fails this test: queues grow, delay rises, and the line feels unreliable even while data is still moving.",
          ],
        },
        {
          title: "Why this is the right question",
          body: [
            "People were trained to ask how fast the connection is because Mbps is easy to sell and compare. But the better question is whether the connection stays usable in real life.",
            "That is why Bufferbloat.org compares quiet-line behavior with behavior under download and upload load. If you want the deeper mechanics, read what a bufferbloat speed test measures and why latency under load matters.",
          ],
        },
        {
          title: "What to read next",
          body: [
            "If the result looks bad, the next step is not to obsess over one number. Look at the scorecard: quiet-line ping, download on, upload on, p95 latency spread, and the application performance panel together explain the reliability story.",
            "For a separate but related question, the internet stability test page explains consistency: whether the connection jumps around, spikes, or behaves predictably during a run.",
          ],
        },
      ],
      related: [
        { href: "/learn/what-bufferbloat-speed-test-measures", label: "What a bufferbloat test measures" },
        { href: "/learn/latency-under-load", label: "What latency under load means" },
        { href: "/learn/internet-stability-test", label: "Internet stability test" },
        { href: "/learn/internet-connection-quality", label: "How to judge connection quality" },
      ],
    },
  },
  {
    slug: "internet-stability-test",
    metadata: {
      title: "How Do You Test the Stability of an Internet Connection? - Internet Stability Test",
      description:
        "An internet stability test should show whether your connection stays consistent under real use, including bufferbloat and latency spikes under load.",
      openGraphTitle: "How Do You Test the Stability of an Internet Connection?",
    },
    guide: {
      eyebrow: "internet stability test",
      title: "How do you test the stability of an internet connection?",
      intro:
        "Stability is the part people notice when the internet feels jumpy. A page loads, then hangs. A call is fine, then glitches. A game feels playable, then spikes. The useful test is not just whether the connection can move data, but whether delay stays controlled while the connection is actually being used.",
      calloutLabel: "check consistency under load",
      calloutTitle: "Run the bufferbloat test",
      calloutBody:
        "The scorecard shows quiet-line ping, download on, upload on, p95 latency spread, throughput, and application performance.",
      cards: [
        {
          label: "1",
          title: "Stable means predictable",
          body:
            "A stable connection does not have to be the fastest. It should behave predictably enough that calls, games, work, and browsing do not keep hitting sudden delay spikes.",
        },
        {
          label: "2",
          title: "Spikes matter more than averages",
          body:
            "Average numbers can hide bad moments. Bufferbloat.org uses median ping and p95 latency spread so the result is not dominated by one outlier, but still catches repeated high-delay behavior.",
        },
        {
          label: "3",
          title: "Load reveals instability",
          body:
            "Many connections look stable while quiet. The harder question is whether they stay stable while downloads and uploads are active.",
        },
      ],
      notes: [
        {
          title: "Stability is not the same as reliability",
          body: [
            "Reliability asks whether you can depend on the connection for real-life use. Stability asks a narrower question: does performance stay consistent, or does delay jump around?",
            "A connection can be slow but stable, fast but unstable, or fast and stable. That is why stability needs to be measured separately from throughput.",
          ],
        },
        {
          title: "Where bufferbloat fits",
          body: [
            "Bufferbloat is one reason a connection becomes unstable under load. When queues fill, latency rises, and the connection can suddenly feel delayed even though the speed number still looks good.",
            "The test makes this visible by comparing quiet-line ping with ping while download and upload load are active. For the measurement details, read what a bufferbloat speed test actually measures.",
          ],
        },
        {
          title: "How to read the result",
          body: [
            "Look for whether the loaded phases stay close to the quiet line and whether p95 latency spread stays controlled. If the spread is large, the connection may have repeated spikes even if the median looks acceptable.",
            "If you want the deeper reasoning, the latency spread article explains why Bufferbloat.org uses p95 spread instead of average jitter or worst ping.",
          ],
        },
      ],
      related: [
        { href: "/learn/latency-spread-vs-jitter", label: "Why we use latency spread, not jitter" },
        { href: "/learn/median-ping-vs-average-ping", label: "Why we use median ping" },
        { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
        { href: "/learn/what-bufferbloat-speed-test-measures", label: "What a bufferbloat test measures" },
      ],
    },
  },
  {
    slug: "internet-latency-test",
    metadata: {
      title: "Internet Latency Test",
      description:
        "Run an internet latency test that checks ping in normal conditions and under download and upload load, so you can see whether the connection stays usable when busy.",
    },
    guide: {
      eyebrow: "internet latency test",
      title: "Internet latency test",
      intro:
        "An internet latency test should do more than report idle ping. Bufferbloat.org measures ping before traffic is added, then checks whether latency stays stable while download and upload traffic are active.",
      calloutLabel: "browser-based latency test",
      calloutTitle: "Test ping where it matters: while the line is busy.",
      calloutBody:
        "The test normally takes about a minute and produces a shareable scorecard with quiet-line ping, download on, upload on, throughput, and technical samples.",
      cards: [
        {
          label: "01",
          title: "Quiet-line ping",
          body:
            "The baseline ping measurement shows how quickly the connection responds before the test adds load.",
        },
        {
          label: "02",
          title: "Download-loaded ping",
          body:
            "The test checks whether latency rises while the downstream path is busy receiving data.",
        },
        {
          label: "03",
          title: "Upload-loaded ping",
          body:
            "The test checks the upstream path too, because uploads are often where home connections develop the most delay.",
        },
      ],
      notes: [
        {
          title: "Why idle ping is not enough",
          body: [
            "A connection can show a low ping while nothing else is happening and still feel bad during video calls, games, backups, or shared household use.",
            "That difference is latency under load. It is the practical measurement behind a useful internet latency test, because it captures whether small interactive packets keep moving while bulk traffic is active.",
          ],
        },
        {
          title: "What the result means",
          body: [
            "Bufferbloat.org does not try to replace laboratory tools. It gives a fast, browser-based view of whether ping stays close to normal during realistic download and upload pressure.",
            "If the loaded latency rises sharply, the connection may feel unreliable even when an ordinary speed test reports good megabits per second.",
          ],
        },
      ],
      related: [
        { href: "/learn/latency-under-load", label: "Latency under load" },
        { href: "/learn/what-bufferbloat-speed-test-measures", label: "What a bufferbloat test measures" },
        { href: "/docs", label: "Measurement methodology" },
      ],
    },
  },
  {
    slug: "calls-internet-test",
    metadata: {
      title: "Calls Internet Test",
      description:
        "Run a calls internet test that checks whether ping stays stable during download and upload load, the condition that affects video and audio calls.",
    },
    guide: {
      eyebrow: "calls internet test",
      title: "Calls internet test",
      intro:
        "A connection can have enough megabits per second for calls and still feel delayed, choppy, or unstable. Bufferbloat.org tests the latency behavior that matters when calls share the connection with downloads and uploads.",
      calloutLabel: "video and audio calls",
      calloutTitle: "Check whether calls stay usable when the connection is busy.",
      calloutBody:
        "Run the browser test to see quiet ping, ping during download load, ping during upload load, and an application performance estimate for calls.",
      cards: [
        {
          label: "Video calls",
          title: "Delay and turn-taking",
          body:
            "Calls suffer when ping rises under load, because speech and video packets wait behind bulk traffic.",
        },
        {
          label: "Audio calls",
          title: "Stable response time",
          body:
            "Audio can use little bandwidth, but it still needs stable latency and low variation to avoid awkward pauses.",
        },
        {
          label: "Shared networks",
          title: "Busy-line behavior",
          body:
            "The important question is not only whether a call works alone, but whether it works while other devices are active.",
        },
      ],
      notes: [
        {
          title: "Why calls can fail on a fast connection",
          body: [
            "Throughput measures capacity. Calls depend heavily on timely delivery. When upload or download queues fill, packets can be delayed even though the connection still has high speed-test numbers.",
            "The bufferbloat signal is the increase in latency while traffic is active.",
          ],
        },
        {
          title: "What the result tells you",
          body: [
            "The scorecard ranks application performance and shows the measured latency trace, so you can see whether the line stayed close to normal or became unstable under pressure.",
            "For calls, the most important signals are loaded latency and latency spread, not only download speed.",
          ],
        },
      ],
      related: [
        { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
        { href: "/learn/latency-under-load", label: "Latency under load" },
        { href: "/learn/what-bufferbloat-speed-test-measures", label: "What a bufferbloat test measures" },
      ],
    },
  },
  {
    slug: "gaming-network-test",
    metadata: {
      title: "Gaming Network Test",
      description:
        "Run a gaming network test that checks ping stability, latency under load, and bufferbloat behavior while download and upload traffic are active.",
    },
    guide: {
      eyebrow: "gaming network test",
      title: "Gaming network test",
      intro:
        "Online games are sensitive to latency and latency spread. Bufferbloat.org checks whether ping stays stable when download and upload traffic are active, instead of only measuring idle ping.",
      calloutLabel: "low-latency games",
      calloutTitle: "Check whether load makes your ping jump.",
      calloutBody:
        "Run the test to see quiet-line ping, loaded ping, latency spread, and an application performance estimate for low-latency games.",
      cards: [
        {
          label: "Ping",
          title: "Baseline delay",
          body:
            "A low quiet-line ping helps games feel immediate, but it does not guarantee the line stays stable.",
        },
        {
          label: "Load",
          title: "Bufferbloat spikes",
          body:
            "Games can suffer when downloads, uploads, or other devices make packets wait in queues.",
        },
        {
          label: "Spread",
          title: "Consistency matters",
          body:
            "Even when average ping looks acceptable, a large latency spread can make movement and hit registration feel uneven.",
        },
      ],
      notes: [
        {
          title: "Why gaming tests should include load",
          body: [
            "A game rarely has the whole connection to itself. Other devices, background downloads, updates, and uploads can create queueing delay.",
            "This test measures whether the connection stays responsive during that pressure.",
          ],
        },
        {
          title: "What this test cannot know",
          body: [
            "The browser cannot test the route to a specific game server. It can test the local connection behavior that often explains lag on otherwise fast connections.",
            "For a full assessment, combine this result with in-game ping to the actual server region.",
          ],
        },
      ],
      related: [
        { href: "/learn/internet-latency-test", label: "Internet latency test" },
        { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
        { href: "/learn/latency-under-load", label: "Latency under load" },
      ],
    },
  },
  {
    slug: "video-meeting-test-results",
    metadata: {
      title: "How to Read Video-Meeting Test Results",
      description:
        "How to read a Bufferbloat.org result for Zoom, video calls, screen sharing, and meeting reliability.",
      openGraphTitle: "How to Read Video-Meeting Test Results",
    },
    guide: {
      eyebrow: "video meeting results",
      title: "How to read the test result for video meetings",
      intro:
        "A video meeting can fail for several different reasons. A Bufferbloat.org result helps separate them by showing whether the connection stays responsive while download and upload traffic are active.",
      calloutLabel: "test meeting reliability",
      calloutTitle: "Run the bufferbloat test",
      calloutBody:
        "Then compare quiet-line ping with the loaded phases and the application performance ratings for calls.",
      cards: [
        {
          label: "Upload",
          title: "Start with upload load",
          body:
            "Your camera, voice, and screen share leave through the upload path. If upload-loaded latency rises far above quiet-line ping, other people may see or hear you late.",
        },
        {
          label: "Download",
          title: "Then check download load",
          body:
            "Receiving everyone else's video and shared screens uses the download path. Added download delay can make the meeting feel late or uneven.",
        },
        {
          label: "Spread",
          title: "Read spread as wobble",
          body:
            "Latency spread shows how far the high-delay samples moved away from the typical ping. Repeated spikes become freezes, clipped speech, and awkward pauses.",
        },
      ],
      notes: [
        {
          title: "Start with upload load",
          body: [
            "Your camera, voice, and screen share leave your network through the upload path. If upload-loaded latency rises far above quiet-line ping, other people may see or hear you late even when download speed looks fine.",
          ],
        },
        {
          title: "Then check download load",
          body: [
            "Receiving everyone else's video and shared screens uses the download path. If download load adds delay, the meeting can feel late or uneven even though the connection can still move a lot of data.",
          ],
        },
        {
          title: "Read latency spread as the wobble",
          body: [
            "Median ping tells you the typical delay. Latency spread shows how far the high-delay samples moved away from that typical value. For video meetings, repeated spikes can matter because they turn into freezes, clipped speech, and awkward pauses.",
          ],
        },
        {
          title: "If the result looks good",
          body: [
            "A good bufferbloat result does not prove Zoom, Wi-Fi, VPN, device CPU, or a specific meeting route is perfect. It means the browser test did not find the local busy-line delay pattern that often explains meeting instability.",
          ],
        },
      ],
      applicationRatings: {
        title: "Use the application ratings as a translation layer",
        body:
          "The scorecard also summarizes the same measurements as application performance ratings. For meeting problems, read the Audio calls and Video calls rows first. They are not tests of Zoom's servers; they translate your local latency, spread, and capacity into the kind of experience those apps usually need.",
        caption:
          "Example of the rating area you will see after a test. For video meetings, the call rows matter more than the browsing, streaming, gaming, or backup rows.",
        labels: [
          {
            label: "Very reliable or Reliable",
            body:
              "The local line stayed responsive enough for calls in this browser test. If the meeting still fails, look next at Wi-Fi, VPN, device load, or the meeting service path.",
          },
          {
            label: "Usable",
            body:
              "The call may work, but it has less room for competing traffic. Watch the upload-loaded and download-loaded sections to see which direction is putting the meeting at risk.",
          },
          {
            label: "Poor",
            body:
              "The test found enough delay, wobble, or capacity pressure that calls are likely to freeze, clip speech, or show instability when the connection is busy.",
          },
        ],
      },
      related: [
        { href: "/learn/zoom-internet-test", label: "Back to the Zoom guide" },
        { href: "/learn/calls-internet-test", label: "Calls internet test" },
        { href: "/docs", label: "Methodology hub" },
      ],
    },
  },
  {
    slug: "zoom-internet-test",
    metadata: {
      title: 'Why Zoom Says "Your Internet Connection Is Unstable"',
      description:
        "Why Zoom can report an unstable internet connection even when speed tests look fine, and how Bufferbloat.org tests the network behavior behind it.",
      openGraphTitle: 'Why Zoom Says "Your Internet Connection Is Unstable"',
    },
    guide: {
      eyebrow: "video meeting reliability",
      title: 'Why Zoom says "Your internet connection is unstable"',
      intro:
        "That warning can feel unfair when your connection looks fast everywhere else. But Zoom is often pointing at a real problem: the connection may have enough capacity, yet still become unstable when upload, download, Wi-Fi, or other household traffic puts pressure on the line.",
      calloutLabel: "test meeting reliability",
      calloutTitle: "Check whether your connection stays usable under load.",
      calloutBody:
        "Bufferbloat.org is not affiliated with Zoom and does not test Zoom servers. It tests the local network behavior that often makes video meetings freeze, lag, or report instability.",
      cards: [
        {
          label: "Upload path",
          title: "Your camera, voice, and screen share",
          body:
            "Video meetings depend on outbound traffic. If upload queues fill, your audio, camera, and screen sharing can be delayed even when download speed looks good.",
        },
        {
          label: "Download path",
          title: "Everyone else in the meeting",
          body:
            "Receiving video and shared screens can also add pressure. Download load can make the line respond late if buffering builds up.",
        },
        {
          label: "Responsiveness",
          title: "The part speed tests miss",
          body:
            "Meetings need timely delivery. Stable ping under load is usually more relevant than a big Mbps number alone.",
        },
      ],
      notes: [
        {
          title: "Why the warning can be right",
          body: [
            "A speed test can report good megabits per second while small interactive packets are still waiting behind bulk traffic. That waiting is the kind of delay people experience as lag, frozen video, awkward pauses, or unstable calls.",
            "This is where bufferbloat matters. If queues grow too large when the connection is busy, the line can keep moving data while becoming less responsive.",
          ],
        },
        {
          title: "What this test checks",
          body: [
            "Bufferbloat.org compares quiet-line ping with ping while download and upload load are active. It also reports throughput and p95 latency spread, because a meeting can suffer from delay spikes even when the typical ping looks acceptable.",
            "A good result means the connection stayed close to normal while the line was busy. A poor result suggests the warning is not just a vague app complaint: the connection may really be unstable under real-life use.",
          ],
        },
        {
          title: "How to run a cleaner test",
          body: [
            "Keep the tab in the foreground, disable VPN if possible, and pause other heavy activity during the run. The test stops if the tab loses focus because browser background behavior can compromise the measurement.",
            "Repeat the test with VPN disabled and other activity paused if the result is unexpectedly bad.",
          ],
        },
      ],
      deepDive: {
        href: "/learn/video-meeting-test-results",
        label: "How to read video-meeting test results",
        title: "Want the deeper result-reading guide?",
        body:
          "After you run the test, the useful question is which part of the scorecard explains the meeting problem: upload load, download load, quiet ping, or latency spread.",
      },
      related: [
        { href: "/learn/video-meeting-test-results", label: "How to read video-meeting test results" },
        { href: "/learn/calls-internet-test", label: "Calls internet test" },
        { href: "/learn/latency-under-load", label: "Latency under load" },
        { href: "/learn/internet-connection-quality", label: "Internet connection quality" },
        { href: "/docs", label: "Methodology hub" },
      ],
    },
  },
];

export function getLearnArticle(slug: string): LearnArticle {
  const article = learnArticles.find((item) => item.slug === slug);

  if (!article) {
    throw new Error(`Missing learn article content for slug: ${slug}`);
  }

  return article;
}

export function metadataForLearnArticle(article: LearnArticle): Metadata {
  const url = `https://bufferbloat.org/learn/${article.slug}`;
  const title = article.metadata.title;
  const description = article.metadata.description;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.metadata.openGraphTitle ?? title,
      description,
      url,
    },
  };
}

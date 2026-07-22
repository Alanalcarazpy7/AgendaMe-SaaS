export function scenarioFor(profile) {
  const profiles = {
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
    },
    baseline: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "2m", target: 5 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "15s",
    },
    probe10: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 10 },
        { duration: "4m", target: 10 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    probe20: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "4m", target: 20 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    probe30: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 30 },
        { duration: "4m", target: 30 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    probe40: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 40 },
        { duration: "4m", target: 40 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    probe50: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "4m", target: 50 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 30 },
        { duration: "10m", target: 30 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 30 },
        { duration: "3m", target: 100 },
        { duration: "3m", target: 200 },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 200 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "15s",
    },
    soak: {
      executor: "constant-vus",
      vus: 30,
      duration: "60m",
    },
  };

  const selected = profiles[profile];

  if (!selected) {
    throw new Error(`PROFILE invalido: ${profile}`);
  }

  return selected;
}

const url = `http://127.0.0.1:${process.env.PORT || 5000}/health`;

fetch(url, { signal: AbortSignal.timeout(2500) })
  .then((response) => {
    process.exitCode = response.ok ? 0 : 1;
  })
  .catch(() => {
    process.exitCode = 1;
  });

const check = Bun.spawn(["bun", "run", "check"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    MONGODB_URL: process.env.MONGODB_URL
      || "mongodb://build-only.invalid:27017/myapp?authSource=admin",
  },
  stdout: "inherit",
  stderr: "inherit",
});

process.exitCode = await check.exited;

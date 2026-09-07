const FP = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function parseAssetlinksCsv(csv: string): { package: string; sha256: string }[] {
  const out: { package: string; sha256: string }[] = [];
  for (const raw of csv.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.toLowerCase().startsWith("package,")) continue;
    const [pkg, sha] = line.split(",").map((s) => s.trim());
    const sha256 = (sha || "").toUpperCase();
    if (!pkg || !FP.test(sha256)) continue;
    out.push({ package: pkg, sha256 });
  }
  return out;
}

export function assetlinks(rows: { package: string; sha256: string }[]) {
  return rows.map((r) => ({
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: r.package, sha256_cert_fingerprints: [r.sha256] },
  }));
}

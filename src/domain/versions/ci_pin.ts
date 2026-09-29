/** The Cruze package CI runs through `npx --package=<spec>`, kept at the version the project installed. */

export interface Repin {
  text: string;
  /** Each spec that now names the new version, as it reads after the edit. */
  repinned: string[];
  /** Specs Cruze doesn't know how to move, such as a branch or a local path, left as they were. */
  unrecognised: string[];
}

const FORMS: Array<(spec: string, version: string) => string | null> = [
  // The npm package: @printpractical/cruze@0.0.1
  (spec, version) => (/^@printpractical\/cruze@[^/\s]+$/.test(spec) ? `@printpractical/cruze@${version}` : null),
  // The release tarball: .../releases/download/v0.0.1/printpractical-cruze-0.0.1.tgz
  (spec, version) => {
    const m = /^(.*\/releases\/download\/)v[^/]+\/printpractical-cruze-[^/]+\.tgz$/.exec(spec);
    return m === null ? null : `${m[1]}v${version}/printpractical-cruze-${version}.tgz`;
  },
  // The git repository at a release tag: github:PrintPractical/cruze#v0.0.1
  (spec, version) => {
    const m = /^(.*cruze(?:\.git)?)#v\d[^\s]*$/.exec(spec);
    return m === null ? null : `${m[1]}#v${version}`;
  },
];

/** Moves every `--package=<spec>` that runs Cruze in a CI workflow to the version. */
export function repinCruze(ciText: string, version: string): Repin {
  const repinned: string[] = [];
  const unrecognised: string[] = [];
  const text = ciText.replace(/--package=(\S+)(?=\s+cruze\b)/g, (whole, spec: string) => {
    const moved = FORMS.map((form) => form(spec, version)).find((result) => result !== null);
    if (moved === undefined || moved === null) {
      if (!unrecognised.includes(spec)) unrecognised.push(spec);
      return whole;
    }
    if (!repinned.includes(moved)) repinned.push(moved);
    return `--package=${moved}`;
  });
  return { text, repinned, unrecognised };
}

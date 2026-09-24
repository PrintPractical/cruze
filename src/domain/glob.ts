/**
 * Glob matching for config paths: `**` matches any number of directories,
 * `*` anything within one path segment, `?` one character, `{a,b}` either.
 */

const cache = new Map<string, RegExp>();

export function matchesGlob(path: string, glob: string): boolean {
  let regex = cache.get(glob);
  if (regex === undefined) {
    regex = new RegExp(`^${globToRegex(glob)}$`);
    cache.set(glob, regex);
  }
  return regex.test(path);
}

export function matchesAny(path: string, globs: readonly string[]): boolean {
  return globs.some((glob) => matchesGlob(path, glob));
}

function globToRegex(glob: string): string {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i] ?? "";
    if (char === "*" && glob[i + 1] === "*") {
      const slashAfter = glob[i + 2] === "/";
      out += slashAfter ? "(?:.*/)?" : ".*";
      i += slashAfter ? 2 : 1;
    } else if (char === "*") {
      out += "[^/]*";
    } else if (char === "?") {
      out += "[^/]";
    } else if (char === "{") {
      const close = glob.indexOf("}", i);
      if (close === -1) {
        out += "\\{";
        continue;
      }
      out += `(?:${glob.slice(i + 1, close).split(",").map(globToRegex).join("|")})`;
      i = close;
    } else {
      out += char.replace(/[.+^$()|[\]\\]/g, "\\$&");
    }
  }
  return out;
}

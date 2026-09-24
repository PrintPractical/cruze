/** The assets shipped inside the Cruze package: skills and templates. */

export interface BundledFile {
  /** Path relative to the skill folder, using forward slashes. */
  path: string;
  text: string;
}

export interface BundledSkill {
  /** The skill's folder name in the bundle, such as `plan`. */
  folder: string;
  files: BundledFile[];
}

export interface Bundle {
  readonly version: string;
  skills(): Promise<BundledSkill[]>;
  /** A template's text, by path relative to the templates directory. */
  template(path: string): Promise<string>;
  /** A document template from the cruze-formats skill, such as `feature.md`. */
  formatTemplate(name: string): Promise<string>;
}

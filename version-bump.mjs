import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
const minAppVersion = process.argv[3];

// read minAppVersion from manifest.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { versions } = JSON.parse(readFileSync("versions.json", "utf8"));
const currentVersion = manifest.version;

// update versions.json with target version
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify({ versions }, null, "\t"));

// update version in manifest.json
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update version in package.json
const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));
packageJSON.version = targetVersion;
writeFileSync("package.json", JSON.stringify(packageJSON, null, "\t"));

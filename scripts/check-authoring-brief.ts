#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  hashContent,
  extractHashesFromBrief,
  AUTHORING_BRIEF_OUTPUT_PATH,
  AUTHORING_BRIEF_SOURCES,
  AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH,
} from "./build-authoring-brief.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main(): void {
  const outputPath = path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH);

  if (!fs.existsSync(outputPath)) {
    process.stderr.write(
      `warn: ${AUTHORING_BRIEF_OUTPUT_PATH} does not exist — run \`npm run build-authoring-brief\` to generate it.\n`,
    );
    process.exit(0);
  }

  const [wiringRelPath, directionRelPath] = AUTHORING_BRIEF_SOURCES;
  const wiringPath = path.join(repoRoot, wiringRelPath);
  const directionPath = path.join(repoRoot, directionRelPath);

  if (!fs.existsSync(wiringPath) || !fs.existsSync(directionPath)) {
    process.stderr.write(`warn: one or more source files missing — skipping authoring-brief drift check.\n`);
    process.exit(0);
  }

  const wiringContent = fs.readFileSync(wiringPath, "utf8");
  const directionContent = fs.readFileSync(directionPath, "utf8");
  const currentWiringHash = hashContent(wiringContent);
  const currentDirectionHash = hashContent(directionContent);

  const briefContent = fs.readFileSync(outputPath, "utf8");
  const briefHashes = extractHashesFromBrief(briefContent);

  if (!briefHashes) {
    process.stderr.write(
      `warn: ${AUTHORING_BRIEF_OUTPUT_PATH} has no recognisable hash stamps — run \`npm run build-authoring-brief\` to regenerate.\n`,
    );
    process.exit(0);
  }

  const wiringDrifted = briefHashes.wiringHash !== currentWiringHash;
  const directionDrifted = briefHashes.directionHash !== currentDirectionHash;
  // THR-1185: the generator's hardcoded Sections D/E are a third source. Before they were
  // stamped, a reword of those constants was invisible to this check by construction — which
  // is how the brief spent months telling authors to write the rejected approach-card model
  // while this check reported "up to date" every single run.
  const sectionsDrifted = briefHashes.sectionsHash !== AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH;

  if (wiringDrifted || directionDrifted || sectionsDrifted) {
    const drifted = [
      wiringDrifted ? wiringRelPath : null,
      directionDrifted ? directionRelPath : null,
      sectionsDrifted ? "generator sections D/E (scripts/build-authoring-brief.ts)" : null,
    ]
      .filter(Boolean)
      .join(", ");
    process.stderr.write(
      `warn: ${AUTHORING_BRIEF_OUTPUT_PATH} is stale — source(s) changed: ${drifted}. ` +
        `Run \`npm run build-authoring-brief\` to update.\n`,
    );
    process.exit(0);
  }

  console.info(`info: ${AUTHORING_BRIEF_OUTPUT_PATH} is up to date.`);
  process.exit(0);
}

main();

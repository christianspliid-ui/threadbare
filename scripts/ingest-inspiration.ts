import { runInspirationIngest } from './inspiration-ingest/runIngest';

function printUsage(): void {
  console.log('Usage: npm run ingest -- <source>');
  console.log('');
  console.log('Source supports:');
  console.log('  - local markdown file');
  console.log('  - local directory (recursive .md)');
  console.log('  - URL (minimal readability extraction)');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length === 1 ? 0 : 1);
  }

  const source = args[0];
  console.log(`Ingesting inspiration source: ${source}`);
  const result = await runInspirationIngest(source);
  console.log(`Created: ${result.created}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Total records: ${result.total}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Ingest failed: ${message}`);
  process.exit(1);
});


#!/usr/bin/env node
import { runCli } from '../src/cli.js';
runCli(process.argv.slice(2)).catch((error) => { console.error(`[feature] ${error.message}`); if (error.reportPath) console.error(`[feature] relatório: ${error.reportPath}`); process.exitCode = error.exitCode || 1; });

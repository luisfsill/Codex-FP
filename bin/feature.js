#!/usr/bin/env node
import { runCli } from '../src/cli.js';
runCli(process.argv.slice(2)).catch((error) => { console.error(`[feature] ${error.message}`); process.exitCode = error.exitCode || 1; });

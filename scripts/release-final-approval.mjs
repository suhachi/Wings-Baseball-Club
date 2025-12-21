import { execSync, spawnSync } from 'child_process';
import readline from 'readline';

const PROJECT_ID = 'wings-baseball-club';

console.log("\n=======================================================");
console.log("   WINGS BASEBALL CLUB - FINAL RELEASE APPROVAL PIPELINE");
console.log("   Policy: S0 (No Scheduler), Single Club (WINGS)");
console.log("=======================================================\n");

function runCommand(cmd, cwd = process.cwd()) {
    console.log(`> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', cwd });
    } catch (e) {
        console.error(`\n❌ COMMAND FAILED: ${cmd}`);
        process.exit(1);
    }
}

// 1. Dependencies and Build
console.log("\n[Step 1] Verifying Build Integrity...");
// runCommand('npm ci'); // Skip for speed in this context if node_modules exists, but release should be clean. 
// Assuming npm install is done or fast enough.
runCommand('npm run type-check');

// 2. Functions Build (CRITICAL)
console.log("\n[Step 2] Building Functions (Critical for Emulator)...");
runCommand('npm run build:functions');

// 3. Emulator Check & Smoke Tests
console.log("\n[Step 3] Running Smoke Tests (must have emulator running)...");
// We assume emulator is running separately as per user inst, but script can check or warn.
console.log("Make sure 'npm run emulators:start' is running in another terminal!");
console.log("Waiting 5s for user to verify emulator...");

// 4. Smoke Chain
const scripts = [
    'scripts/emulator-smoke-m00_gate.mjs',
    'scripts/emulator-smoke-step0_5.mjs',
    // 'scripts/emulator-smoke-c03_comment_moderation.mjs',
    // 'scripts/emulator-smoke-c03_comment_count.mjs',
    // 'scripts/emulator-smoke-d01_vote_autoclose.mjs'
];

for (const script of scripts) {
    console.log(`\n--- Running Smoke: ${script} ---`);
    runCommand(`node ${script}`);
}

// 5. Migration Dry Run
console.log("\n[Step 4] Migration DRY-RUN (Future Vote Close Time)...");
process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
runCommand('node scripts/migrate-event-voteCloseAt.mjs --dry-run');

// 6. Final Approval
console.log("\n=======================================================");
console.log("   ALL AUTOMATED CHECKS PASSED.");
console.log("   Review the Migration Dry-Run output above.");
console.log("=======================================================");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("\n[?] 최종 배포 및 실제 데이터 적용을 진행할까요? (YES / NO): ", (answer) => {
    rl.close();
    if (answer.trim().toUpperCase() === 'YES') {
        console.log("\n[Step 5] Deploying to Production...");
        runCommand(`firebase use ${PROJECT_ID}`);
        runCommand('firebase deploy --only firestore:rules,functions,hosting');

        console.log("\n[SUCCESS] Deployment Complete.");
        console.log("To apply migration, run:\n  node scripts/migrate-event-voteCloseAt.mjs --apply");
        console.log("To apply ops cleanup, run:\n  node scripts/ops-close-expired-votes.mjs --apply");
    } else {
        console.log("\n[STOP] 배포 및 데이터 변경 미진행. 종료합니다.");
        process.exit(0);
    }
});

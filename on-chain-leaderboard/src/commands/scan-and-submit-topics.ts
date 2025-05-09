import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { getSubmissionStatus } from "../actions/scripts";
import { submitTopic } from "../actions/transactions";
import {
    buildBlockchainContext,
    waitForTransaction,
    networks,
    type Network,
    type TopicInfo,
} from "../utils";
import fsSync from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMISSIONS_DIR = path.resolve(__dirname, "../../../submissions");
const PERIOD_ALIASES = ["week1", "week2", "week3", "week4"];

// Simple regex for Flow and EVM addresses
function isValidAddress(addr: string): boolean {
    // Flow: 0x + 16 hex chars, EVM: 0x + 40 hex chars
    return /^0x[a-fA-F0-9]{16}$/.test(addr) || /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// Recursively scan for valid topics
async function scanTopics(): Promise<TopicInfo[]> {
    const topics: TopicInfo[] = [];
    const userDirs = await fs.readdir(SUBMISSIONS_DIR);
    for (const userId of userDirs) {
        const userPath = path.join(SUBMISSIONS_DIR, userId);
        if (!(await fs.stat(userPath)).isDirectory() || !isValidAddress(userId)) continue;
        for (const periodAlias of PERIOD_ALIASES) {
            const periodPath = path.join(userPath, periodAlias);
            try {
                if (!(await fs.stat(periodPath)).isDirectory()) continue;
            } catch {
                continue;
            }
            const topicDirs = await fs.readdir(periodPath);
            for (const topic of topicDirs) {
                const topicPath = path.join(periodPath, topic);
                if (!(await fs.stat(topicPath)).isDirectory()) continue;
                topics.push({ userId, periodAlias, topic, topicPath });
            }
        }
    }
    return topics;
}

// Placeholder for reading completed array from topic directory
async function getCompletedArray(topicDirPath: string): Promise<string[]> {
    const completed: string[] = [];

    // 1. Check README.md
    const readmePath = path.join(topicDirPath, "README.md");
    let readmeContent = "";
    try {
        await fs.stat(readmePath);
        completed.push("readme-exists");
        readmeContent = await fs.readFile(readmePath, "utf-8");
        const wordCount = readmeContent.split(/\s+/).filter(Boolean).length;
        if (wordCount > 500) completed.push("readme-more-than-500-words");
        if (wordCount > 2500) completed.push("readme-more-than-2500-words");
    } catch {}

    // 2. Check flow.json
    const flowJsonPath = path.join(topicDirPath, "flow.json");
    try {
        await fs.stat(flowJsonPath);
        completed.push("includes-flow-json");
    } catch {}

    // 3. Check package.json and dependencies
    const packageJsonPath = path.join(topicDirPath, "package.json");
    let packageJson: Record<string, unknown> | null = null;
    try {
        await fs.stat(packageJsonPath);
        completed.push("includes-package-json");
        const pkgContent = await fs.readFile(packageJsonPath, "utf-8");
        packageJson = JSON.parse(pkgContent);
        const frameworks = [
            "react",
            "vue",
            "svelte",
            "next",
            "nuxt",
            "solid-js",
            "preact",
            "angular",
        ];

        // Extract dependencies and devDependencies as a single object
        const deps: Record<string, string> = {};
        if (packageJson && typeof packageJson === "object") {
            const { dependencies, devDependencies } = packageJson as {
                dependencies?: Record<string, unknown>;
                devDependencies?: Record<string, unknown>;
            };
            if (dependencies && typeof dependencies === "object") {
                Object.assign(deps, dependencies);
            }
            if (devDependencies && typeof devDependencies === "object") {
                Object.assign(deps, devDependencies);
            }
        }

        // Check for frontend frameworks (case-insensitive)
        if (Object.keys(deps).some((dep) => frameworks.includes(dep.toLowerCase()))) {
            completed.push("includes-frontend-framework");
        }

        // Check for Flow packages
        if (deps["@onflow/fcl"]) completed.push("use-onflow-fcl");
        if (deps["@onflow/kit"]) completed.push("use-onflow-kit");
    } catch {}

    // 4. Recursively scan for contract files and randomness usage
    let hasCadence = false;
    let hasSolidity = false;
    let hasRandomness = false;
    // Helper function to check for randomness keywords in contract content
    async function containsRandomnessKeyword(entryPath: string): Promise<boolean> {
        try {
            const content = await fs.readFile(entryPath, "utf-8");
            return (
                content.includes("revertibleRandom()") || content.includes("RandomBeaconHistory")
            );
        } catch {
            return false;
        }
    }
    async function scanDir(dir: string) {
        // Early exit if all found
        if (hasCadence && hasSolidity && hasRandomness) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (hasCadence && hasSolidity && hasRandomness) return;
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(entryPath);
            } else if (entry.isFile()) {
                if (entry.name.endsWith(".cdc")) {
                    hasCadence = true;
                    if (!hasRandomness && (await containsRandomnessKeyword(entryPath))) {
                        hasRandomness = true;
                    }
                } else if (entry.name.endsWith(".sol")) {
                    hasSolidity = true;
                    if (!hasRandomness && (await containsRandomnessKeyword(entryPath))) {
                        hasRandomness = true;
                    }
                }
            }
        }
    }
    await scanDir(topicDirPath);
    if (hasCadence) completed.push("contract-cadence-exists");
    if (hasSolidity) completed.push("contract-solidity-exists");
    if (hasRandomness) completed.push("use-onchain-randomness");

    return completed;
}

async function main() {
    const network = process.env.NETWORK as Network;
    if (!network || !networks.includes(network)) {
        console.error(
            `❌ [ERROR] Please set NETWORK environment variable to either ${networks.map((n) => `"${n}"`).join(" or ")}`,
        );
        process.exit(1);
    }

    const ctx = await buildBlockchainContext();
    if (!ctx.wallet) {
        console.error(
            "❌ [ERROR] No wallet in context, please set the FLOW_ADDRESS and FLOW_PRIVATE_KEY environment variables",
        );
        process.exit(1);
    }
    console.log("\n==============================");
    console.log(`👤 Signer address: ${ctx.wallet.address}`);
    console.log("==============================\n");

    // 1. Scan for all valid topics
    console.log("🔍 Scanning for valid topics in submissions directory...");
    const allTopics = await scanTopics();
    console.log(`✅ Found ${allTopics.length} valid topic(s).`);

    // 2. Group by userId + periodAlias
    console.log("\n📦 Grouping topics by user and period...");
    const groupMap = new Map<string, TopicInfo[]>();
    for (const t of allTopics) {
        const key = `${t.userId}::${t.periodAlias}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)?.push(t);
    }
    console.log(`✅ Grouped into ${groupMap.size} user/period group(s).`);

    // 3. For each group, filter out already submitted topics
    console.log("\n📝 Checking submission status for each group...");
    const toSubmit: TopicInfo[] = [];
    let groupIdx = 0;
    for (const topics of groupMap.values()) {
        if (!topics.length || !topics[0]) continue;
        const { userId, periodAlias } = topics[0];
        const topicNames = topics.map((t) => t.topic);
        console.log(
            `➡️  [${++groupIdx}/${groupMap.size}] Checking user "${userId}", period "${periodAlias}", topics: ${topicNames.join(", ")} ... `,
        );
        const statusList = await getSubmissionStatus(
            ctx.connector,
            userId,
            periodAlias,
            topicNames,
        );

        let filtered = 0;
        for (const status of statusList) {
            if (!status.isSubmitted) {
                const found = topics.find(
                    (t) =>
                        t.userId === userId &&
                        t.periodAlias === periodAlias &&
                        t.topic === status.topic,
                );
                if (found) {
                    toSubmit.push(found);
                    filtered++;
                }
            }
        }
        console.log(`✅ ${filtered} to submit, ${statusList.length - filtered} already submitted.`);
    }
    console.log("\n------------------------------");
    console.log(`📬 Total topics to submit: ${toSubmit.length}`);
    console.log("------------------------------\n");

    // 4. For each topic to submit, check completed array and submit
    let submitIdx = 0;
    for (const t of toSubmit) {
        const completed = await getCompletedArray(t.topicPath);
        console.log(
            `🚀 [${++submitIdx}/${toSubmit.length}] Submitting topic: userId="${t.userId}", period="${t.periodAlias}", topic="${t.topic}", completed: ${completed.join(", ")}`,
        );
        try {
            const txid = await submitTopic(ctx.wallet, t.userId, t.periodAlias, t.topic, completed);
            await waitForTransaction(ctx.connector, txid);
            console.log("✅  Submission successful!\n");
        } catch (err) {
            console.error(`❌  Failed to submit topic "${t.topic}" for user "${t.userId}":`, err);
        }
    }
    console.log("\n🎉 All done!");
}

main().catch(console.error);
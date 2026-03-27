import { runAgent } from './lib/agent2/graph';

async function main() {
  console.log("Starting test agent run...");
  try {
    await runAgent({
      userMessage: "create a simple diagram of hosptial manament system",
      userId: "test_user_123",
      aiMessageId: "msg_123",
      pageId: "061249f8-e9b2-4a21-8e94-5756868a0695" // The page ID from previous logs
    });
    console.log("Test agent run completed.");
  } catch (err) {
    console.error("Agent run failed:", err);
  }
}

main();

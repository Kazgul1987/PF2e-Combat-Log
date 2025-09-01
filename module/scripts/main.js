Hooks.once("init", () => {
  console.log("PF2e Combat Log | Initializing");
});

Hooks.once("ready", () => {
  console.log("PF2e Combat Log | Ready");
});

Hooks.on("createChatMessage", (message, context, userId) => {
  console.log("PF2e Combat Log | Chat message created:", message);
});

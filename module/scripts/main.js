Hooks.once("init", () => {
  console.log("PF2e Combat Log | Initializing");

  // Register other hooks
  Hooks.on("ready", () => {
    console.log("PF2e Combat Log | Ready");
  });

  Hooks.on("createChatMessage", (message) => {
    console.log("PF2e Combat Log | Chat message created:", message);
  });
});

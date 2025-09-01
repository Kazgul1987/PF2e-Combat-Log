Hooks.once("init", () => {
  console.log("PF2e Combat Log | Initializing");
});

let combatLogFolderId;
let combatLogJournalId;

Hooks.once("ready", async () => {
  console.log("PF2e Combat Log | Ready");

  let folder = game.folders.find(
    (f) => f.name === "Combat Log" && f.type === "JournalEntry"
  );
  if (!folder) {
    folder = await Folder.create({ name: "Combat Log", type: "JournalEntry" });
  }

  let journal = game.journal.find(
    (j) => j.name === "Combat Log" && j.folder?.id === folder.id
  );
  if (!journal) {
    journal = await JournalEntry.create({ name: "Combat Log", folder: folder.id });
  }

  combatLogFolderId = folder.id;
  combatLogJournalId = journal.id;
});

Hooks.on("createChatMessage", (message, context, userId) => {
  console.log("PF2e Combat Log | Chat message created:", message);
});

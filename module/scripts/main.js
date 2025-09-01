Hooks.once("init", () => {
  console.log("PF2e Combat Log | Initializing");
});

let combatLogFolderId;
let combatLogJournalId;
let combatMessages = [];

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

Hooks.on("chatMessage", (chatLog, message, chatData) => {
  if (game.combat?.started) {
    combatMessages.push(message);
  }
});

Hooks.on("createChatMessage", (message, context, userId) => {
  console.log("PF2e Combat Log | Chat message created:", message);
});

async function logCombat(combat) {
  if (!combatLogJournalId) return;
  const journal = game.journal.get(combatLogJournalId);
  if (!journal) return;

  const rows = combat.combatants
    .map(
      (c) =>
        `| ${c.token?.uuid ?? c.actor?.uuid ?? c.uuid} | ${c.initiative ?? ""} |`
    )
    .join("\n");
  const chatLog = combatMessages.map((m) => `> ${m}`).join("\n");
  const content =
    `| Combatant | Initiative |\n| --- | --- |\n${rows}` +
    (chatLog ? `\n\n### Chat Log\n${chatLog}` : "");
  await journal.createEmbeddedDocuments("JournalEntryPage", [
    {
      name: new Date().toLocaleString(),
      type: "text",
      text: {
        content,
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
      },
    },
  ]);
  combatMessages = [];
}

Hooks.on("updateCombat", (combat, changed, options, userId) => {
  if (Object.prototype.hasOwnProperty.call(changed, "active") && !changed.active) {
    logCombat(combat);
  }
});

Hooks.on("deleteCombat", (combat, options, userId) => {
  logCombat(combat);
});

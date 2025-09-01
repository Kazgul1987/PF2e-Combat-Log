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

async function updateIndexPage(journal) {
  const indexName = "Encounter Index";
  let indexPage = journal.pages.find((p) => p.name === indexName);
  const links = journal.pages
    .filter((p) => p.name !== indexName)
    .sort((a, b) => b.name.localeCompare(a.name))
    .map((p) => `- @UUID[${p.uuid}]{${p.name}}`)
    .join("\n");
  const content = `## Encounters\n${links}`;
  if (!indexPage) {
    await journal.createEmbeddedDocuments("JournalEntryPage", [
      {
        name: indexName,
        type: "text",
        text: {
          content,
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
        },
      },
    ]);
  } else {
    await indexPage.update({
      text: {
        content,
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
      },
    });
  }
}

async function logCombat(combat) {
  if (!combatLogJournalId) return;
  const journal = game.journal.get(combatLogJournalId);
  if (!journal) return;

  const timestamp = new Date().toLocaleString();
  const rows = combat.combatants
    .map((c) => {
      const uuid = c.token?.uuid ?? c.actor?.uuid ?? c.uuid;
      const name = c.token?.name ?? c.actor?.name ?? c.name ?? uuid;
      return `| @UUID[${uuid}]{${name}} | ${c.initiative ?? ""} |`;
    })
    .join("\n");
  const chatLog = combatMessages.map((m) => `> ${m}`).join("\n");
  const content =
    `<h2>${timestamp}</h2>\n\n| Combatant | Initiative |\n| --- | --- |\n${rows}` +
    (chatLog ? `\n\n### Chat Log\n${chatLog}` : "");
  await journal.createEmbeddedDocuments("JournalEntryPage", [
    {
      name: timestamp,
      type: "text",
      text: {
        content,
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
      },
    },
  ]);

  await updateIndexPage(journal);

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

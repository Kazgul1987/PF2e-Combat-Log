Hooks.once("init", () => {
  console.log("PF2e Combat Log | Initializing");
});

let combatLogFolderId;
let combatLogJournalId;
const combatLogs = new Map();

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
  if (message.startsWith("/retcombatlog")) {
    const combats = getSelectedCombats();
    for (const combat of combats) {
      let messages = combatLogs.get(combat.id);
      if (!messages) {
        messages = collectChatMessages(combat);
        combatLogs.set(combat.id, messages);
      }
      logCombat(combat, messages);
    }
    return false;
  }
  if (message.startsWith("/downloadportrait")) {
    downloadSelectedTokenAvatar();
    return false;
  }
  return true;
});

Hooks.on("createChatMessage", (message, context, userId) => {
  console.log("PF2e Combat Log | Chat message created:", message);
  if (game.combat?.started) {
    const id = game.combat.id;
    if (!combatLogs.has(id)) combatLogs.set(id, []);
    combatLogs.get(id).push(message);
  }
});

function getSelectedCombats() {
  // In Foundry V11 `ui.combat.element` is a regular DOM element instead of a
  // jQuery object. Use `querySelectorAll` and `Array.from` to collect the
  // selected combat IDs in a version‑agnostic way.
  const ids = Array.from(
    ui.combat?.element.querySelectorAll(
      "li.combat[data-combat-id].active, li.combat[data-combat-id].expanded"
    ) ?? []
  ).map((el) => el.dataset.combatId);

  if (ids.length === 0) {
    return game.combat ? [game.combat] : [];
  }
  return ids.map((id) => game.combats.get(id)).filter(Boolean);
}

function collectChatMessages(combat) {
  const start = combat.startTime ?? combat.updateTime;
  const end = combat.endTime ?? combat.updateTime;
  return game.messages.contents.filter(
    (m) =>
      m.timestamp >= start &&
      m.timestamp <= end &&
      (m.speaker?.token || m.flags?.combat === combat.id)
  );
}

async function downloadSelectedTokenAvatar() {
  const token = canvas?.tokens?.controlled[0];
  if (!token) {
    ui.notifications.warn("No token selected.");
    return;
  }
  if (!token.actor) {
    ui.notifications.error("Token has no actor.");
    return;
  }
  const src = token.actor?.img;
  if (!src) {
    ui.notifications.error("Actor has no image.");
    return;
  }
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = src.split("/").pop() || "portrait";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PF2e Combat Log | Failed to download avatar:", err);
    ui.notifications.error("Failed to download avatar.");
  }
}

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
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
          markdown: content,
        },
      },
    ]);
  } else {
    await indexPage.update({
      text: {
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
        markdown: content,
      },
    });
  }
}

async function logCombat(combat, messages) {
  if (!combatLogJournalId) return;
  const journal = game.journal.get(combatLogJournalId);
  if (!journal) return;

  messages = messages ?? collectChatMessages(combat);

  const timestamp = new Date().toLocaleString();
  const rows = combat.combatants
    .map((c) => {
      const uuid = c.token?.uuid ?? c.actor?.uuid ?? c.uuid;
      const name = c.token?.name ?? c.actor?.name ?? c.name ?? uuid;
      return `| @UUID[${uuid}]{${name}} | ${c.initiative ?? ""} |`;
    })
    .join("\n");
  const chatLog = messages
    .map((m) => {
      const actor = m.alias ?? m.speaker?.alias ?? "";
      const flavor = m.flavor ? `${m.flavor}: ` : "";
      return `> ${actor ? `${actor}: ` : ""}${flavor}${m.content ?? ""}`;
    })
    .join("\n");
  const content =
    `## ${timestamp}\n\n| Combatant | Initiative |\n| --- | --- |\n${rows}` +
    (chatLog ? `\n\n### Chat Log\n${chatLog}` : "");
  await journal.createEmbeddedDocuments("JournalEntryPage", [
    {
      name: timestamp,
      type: "text",
      text: {
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
        markdown: content,
      },
    },
  ]);

  await updateIndexPage(journal);

  combatLogs.set(combat.id, messages);
}

Hooks.on("updateCombat", (combat, changed, options, userId) => {
  if (Object.prototype.hasOwnProperty.call(changed, "active") && !changed.active) {
    logCombat(combat, combatLogs.get(combat.id));
  }
});

Hooks.on("deleteCombat", (combat, options, userId) => {
  logCombat(combat, combatLogs.get(combat.id));
});

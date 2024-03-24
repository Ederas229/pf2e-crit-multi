let waitingRoll = false;

Hooks.on("renderChatMessage", async function (message, html) {
  if (message.getFlag("pf2e", "context.type") === "attack-roll") {
    html
      .find(".message-buttons")
      .append(
        '<button type="button" class="triple-critical-success" data-action="tripleCritical" data-message="' +
          message.id +
          '">Critical 3x</button>'
      )
      .find(".triple-critical-success")
      .on("click", { message: message, html: html }, rollTripleDamage);
  }
});

Hooks.on("preCreateChatMessage", async function (message) {
  if (!(message.isDamageRoll && waitingRoll)) return;
  message.updateSource({ "flags.pf2e-crit-multi.ignoreDsN": true });
});

Hooks.on("createChatMessage", async function (message) {
  if (message.isDamageRoll && waitingRoll) {
    waitingRoll = false;
    changeMulti(message);
  }
});

Hooks.on("diceSoNiceRollStart", (messageId, context) => {
  //Hide this roll
  const message = game.messages.contents.find((e) => e.id == messageId);
  if (!message.getFlag("pf2e-crit-multi", "ignoreDsN")) return;
  context.blind = true;
});

async function rollTripleDamage(event) {
  const message = event.data.message;
  waitingRoll = true;
  event.data.html.find(".critical-success").trigger("click");
}

async function changeMulti(message) {
  const DamageRoll = CONFIG.Dice.rolls.find(
    (Roll) => Roll.name === "DamageRoll"
  );

  ui.chat.element.find(message.id).remove();
  ChatMessage.deleteDocuments([message.id]);
  const roll = new DamageRoll(
    message.rolls[0]._formula.replaceAll("2 *", "3 *")
  );
  await roll.evaluate();

  message.flags["pf2e-crit-multi"].ignoreDsN = false;
  ChatMessage.create({
    flavor: message.flavor,
    content: roll.total,
    type: message.type,
    speaker: message.speaker,
    flags: message.flags,
    rolls: [roll],
  });
}

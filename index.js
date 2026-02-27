const { 
  Client, 
  GatewayIntentBits 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

const LOG_CHANNEL_ID = "1476645987387965457";

const invites = new Map();
const userInvites = new Map();

client.once("ready", async () => {
  console.log(`${client.user.tag} aktif!`);

  for (const guild of client.guilds.cache.values()) {
    const guildInvites = await guild.invites.fetch();
    invites.set(guild.id, guildInvites);
  }
});

client.on("inviteCreate", async (invite) => {
  const guildInvites = await invite.guild.invites.fetch();
  invites.set(invite.guild.id, guildInvites);
});

client.on("guildMemberAdd", async (member) => {
  const guild = member.guild;

  const newInvites = await guild.invites.fetch();
  const oldInvites = invites.get(guild.id);

  if (!oldInvites) return;

  const inviteUsed = newInvites.find(i =>
    oldInvites.get(i.code)?.uses < i.uses
  );

  if (!inviteUsed) return;

  const inviter = inviteUsed.inviter;

  const current = userInvites.get(inviter.id) || 0;
  userInvites.set(inviter.id, current + 1);

  invites.set(guild.id, newInvites);

  const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);

  if (logChannel) {
    logChannel.send(
      `🎉 Sunucumuza **${member.user.tag}** katıldı!\n` +
      `👤 Davet Eden: **${inviter.tag}**\n` +
      `📊 Davet Edenin Toplam Daveti: **${userInvites.get(inviter.id)}**`
    );
  }
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!davet") {
    const count = userInvites.get(message.author.id) || 0;
    message.reply(`📊 Toplam davetin: **${count}**`);
  }
});

/* TOKEN KONTROLÜ */
if (!process.env.TOKEN) {
  console.error("TOKEN bulunamadı! Railway Variables kısmına TOKEN ekle.");
  process.exit(1);
}

client.login(process.env.TOKEN);

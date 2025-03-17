const Canvas = require("canvas");
const axios = require('axios');
const sharp = require("sharp");
const fs = require('fs');
const { Client, GatewayIntentBits,PermissionsBitField, ApplicationCommandOptionType, ActivityType, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType,} = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});



const TOKEN = 'MTM0NzY1NDEyNDMwMDE0NDc4Mw.GTj0lj.QhVIi5xGTr1ssoT3L4mQgCDMl25K5oBk9O0UE8';
const SETTINGS_FILE = './servers.json';

let serverSettings = {};
function loadServerSettings() {
    if (fs.existsSync(SETTINGS_FILE)) {
        try {
            serverSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
            
        } catch (error) {
            console.error('Error reading settings file:', error);
      }
    } else {
        console.warn('Settings file not found, creating a new one...');
        saveServerSettings();
    }
}
  
  
function saveServerSettings() {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(serverSettings, null, 2));
        loadServerSettings();
    } catch (error) {
        console.error('Error saving settings file:', error);
    }
  }
  
  
loadServerSettings();
  


const orange = '1321572932383670353';
const yellow = '1321573023689605212';
const green = '1321573173342371850';
const blue = '1321573365756072080';
const purple = '1321573590147268638';
const pink = '1321588563275550790';

const roles = {
    '1️⃣': orange,
    '2️⃣': yellow,
    '3️⃣': green,
    '4️⃣': blue,
    '5️⃣': purple,
    '6️⃣': pink,
};




client.on('interactionCreate', async (interaction) => {
    const { commandName, options, guildId } = interaction;

    
    if (commandName === "setup-welcome-role") {
        const role = options.getRole('role');
        serverSettings[guildId].welcomeRole = role.id;
        saveServerSettings();
        await interaction.reply(`Welcome role has been set to <@&${role.id}>!`);
    }   

    if (commandName === 'setup-welcome-channel') {
        const channel = options.getChannel("channel")
        serverSettings[guildId].welcomer = true;
        serverSettings[guildId].welcomerChannel = channel.id;
        saveServerSettings();
        await interaction.reply(`Welcome Channel has been set to: <#${channel.id}>`);
    }


    if (interaction.commandName === 'create-ticket') {
        const title = interaction.options.getString('title');
        const panelChannel = interaction.options.getChannel('channel');
        const ticketCategory = interaction.options.getChannel('category');
        const roles = interaction.options.getRole('role');
        const panelId = `panel-${Date.now()}`; 
    
        if (panelChannel.type !== ChannelType.GuildText || ticketCategory.type !== ChannelType.GuildCategory) {
            await interaction.reply({ content: 'Please provide a valid text channel and category!', ephemeral: true });
            return;
        }
    
        if (!serverSettings[interaction.guild.id]) {
            serverSettings[interaction.guild.id] = { ticketPanels: {}, userTickets: {} };
        }
    
        serverSettings[interaction.guild.id].ticketPanels[panelId] = {
            title,
            panelChannel: panelChannel.id,
            ticketCategory: ticketCategory.id,
            roles: roles ? [roles.id] : [], 
        };
    
        saveServerSettings();
    
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`open-ticket-${panelId}`)
                .setLabel('🎟 Open a Ticket')
                .setStyle(ButtonStyle.Primary)
        );
    
        await panelChannel.send({
            content: `**${title}**\nClick the button below to open a ticket.`,
            components: [row],
        });
    
        await interaction.reply({ content: 'Ticket panel created and saved!' });
    }
    
    if (interaction.isButton() && interaction.customId.startsWith('open-ticket-')) {
        const panelId = interaction.customId.split('-').slice(2).join('-'); // Extrahiere die Panel-ID
        const guildSettings = serverSettings[interaction.guild.id];
    
        if (!guildSettings || !guildSettings.ticketPanels[panelId]) {
            await interaction.reply({ content: 'Ticket panel settings not found. Please ask an admin to set it up.', ephemeral: true });
            return;
        }
    
        const panelSettings = guildSettings.ticketPanels[panelId];
    
        if (guildSettings.userTickets[interaction.user.id]) {
            await interaction.reply({ content: 'You already have an open ticket. Please close it before opening a new one.', ephemeral: true });
            return;
        }
    
        const modal = new ModalBuilder()
            .setCustomId(`ticket-modal-${panelId}`) // Panel-ID an das Modal anhängen
            .setTitle('Open a Ticket');
    
        const reasonInput = new TextInputBuilder()
            .setCustomId('ticket-reason')
            .setLabel('What is the reason for your ticket?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
    
        const actionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(actionRow);
    
        await interaction.showModal(modal);
    }
    
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket-modal-')) {
        const panelId = interaction.customId.split('-').slice(2).join('-');
        const reason = interaction.fields.getTextInputValue('ticket-reason');
        const guildSettings = serverSettings[interaction.guild.id];
    
        if (!guildSettings || !guildSettings.ticketPanels[panelId]) {
            await interaction.reply({ content: 'Ticket panel settings not found. Please ask an admin to set it up.', ephemeral: true });
            return;
        }
    
        const panelSettings = guildSettings.ticketPanels[panelId];
        const ticketCategory = interaction.guild.channels.cache.get(panelSettings.ticketCategory);
    
        if (!ticketCategory || ticketCategory.type !== ChannelType.GuildCategory) {
            await interaction.reply({ content: 'Ticket category is invalid or missing. Please ask an admin to fix the settings.', ephemeral: true });
            return;
        }
    
        const permissionOverwrites = [
            {
                id: interaction.guild.id, // Deny access to everyone
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id, // Allow access to the user
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
        ];
    
        if (panelSettings.roles && panelSettings.roles.length > 0) {
            panelSettings.roles.forEach(roleId => {
                permissionOverwrites.push({
                    id: roleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                });
            });
        }
    
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: ticketCategory.id,
            permissionOverwrites,
        });
    
        guildSettings.userTickets[interaction.user.id] = ticketChannel.id;
        saveServerSettings();

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username} Ticket`)
            .setDescription(`Reason: ${reason}`)
            .setColor(0x0099FF)
            .setTimestamp();
            

        await ticketChannel.send({ embeds: [embed], 
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                ),
            ],
        });
    
        await interaction.reply({ content: `Your ticket has been created: ${ticketChannel}`, ephemeral: true });
    }
    
    if (interaction.customId === 'close_ticket') {
        const ticketChannel = interaction.channel;
        const guildSettings = serverSettings[interaction.guild.id];
    
        for (const [userId, channelId] of Object.entries(guildSettings.userTickets)) {
            if (channelId === ticketChannel.id) {
                delete guildSettings.userTickets[userId];
                saveServerSettings();
                break;
            }
        }
    
        await interaction.reply({ content: 'Closing this ticket' });
        await ticketChannel.delete();
    }
    if (commandName === 'ban') {
        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.ban({ reason });

            const embed = new EmbedBuilder()
                .setTitle('User Banned')
                .setDescription(`${user.tag} has been banned.`)
                .addFields(
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setColor('Red')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: 'Failed to ban the user. Please check my permissions or the users status.', ephemeral: true });
        }

    } if (commandName === 'timeout') {
        const user = options.getUser('user');
        const time = options.getInteger('time');
        const unit = options.getString('unit');

        const duration = {
            seconds: time * 1000,
            minutes: time * 60 * 1000,
            hours: time * 60 * 60 * 1000,
            days: time * 24 * 60 * 60 * 1000
        }[unit];

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.timeout(duration, 'Timeout command executed');

            const embed = new EmbedBuilder()
                .setTitle('User Timed Out')
                .setDescription(`${user.tag} has been timed out for ${time} ${unit}.`)
                .addFields(
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setColor('Orange')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: 'Failed to timeout the user. Please check my permissions or the users status.', ephemeral: true });
        }
    } if (commandName === 'kick') {
        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.kick(reason);

            const embed = new EmbedBuilder()
                .setTitle('User Kicked')
                .setDescription(`${user.tag} has been kicked.`)
                .addFields(
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setColor('#FFFF00') // Hexadecimal for yellow
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: 'Failed to kick the user. Please check my permissions or the uses status.', ephemeral: true });
        }
    }    
    if (commandName === "selfroles") {
          const embed = new EmbedBuilder()
              .setTitle("Choose Your Role")
              .setDescription(
                  `Click the emojis to get the role:\n1️⃣ - <@&${orange}>\n2️⃣ - <@&${yellow}>\n3️⃣ - <@&${green}>\n4️⃣ - <@&${blue}>\n5️⃣ - <@&${purple}>\n6️⃣ - <@&${pink}>`
              )
              .setFooter({ text: "Capybara System - intenz" })
              .setColor(0xffa500);
    
          await interaction.reply({ content: "Sending role selection...", ephemeral: true });
          const message = await interaction.channel.send({ embeds: [embed] });
    
          for (const emoji of Object.keys(roles)) {
              await message.react(emoji);
          }
        }
    
        if (commandName === "embed") {
            const title = options.getString("title");
            const description = options.getString("description");
    
            
            await interaction.reply({content: "Sending Embed!", ephemeral: true});
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
    
            await interaction.channel.send({ embeds: [embed]});
        }
    

});


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    
    const inviteRegex = /discord\.gg\/|discord\.com\/invite\//i;
    if (inviteRegex.test(message.content)) {
        
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            await message.delete();
            await message.channel.send({ content: `🚨 ${message.author}, sharing server invites is not allowed!`, ephemeral: true });
        }
    }
});

client.on('guildMemberAdd', async (member) => {
  const settings = serverSettings[member.guild.id];

  if (settings && settings.welcomer) {
    const channelId = settings.welcomerChannel;
    const channel = member.guild.channels.cache.get(channelId);

    if (channel) {
        const username = member.user.username;
        let avatarURL = member.user.displayAvatarURL({ format: "webp", size: 128 });

        const defaultAvatars = [
            "https://cdn.discordapp.com/embed/avatars/0.png",
            "https://cdn.discordapp.com/embed/avatars/1.png",
            "https://cdn.discordapp.com/embed/avatars/2.png",
            "https://cdn.discordapp.com/embed/avatars/3.png",
            "https://cdn.discordapp.com/embed/avatars/4.png",
        ];
        if (defaultAvatars.includes(avatarURL)) {
            avatarURL = DISCORD_LOGO_URL; // Wenn Standard-Avatar, Discord-Logo verwenden
        }

            const response = await fetch(avatarURL);
            if (!response.ok) throw new Error(`HTTP-Fehler: ${response.status}`);
            const avatarBuffer = await response.arrayBuffer();
            const pngBuffer = await sharp(Buffer.from(avatarBuffer)).png().toBuffer();

            const canvas = Canvas.createCanvas(700, 250);
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const avatar = await Canvas.loadImage(pngBuffer);
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, 90, 64, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, (canvas.width / 2) - 64, 26, 128, 128);
            ctx.restore();

            ctx.fillStyle = "#ffffff";
            ctx.font = "28px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${username} joined the server`, canvas.width / 2, 200);

            const attachment = canvas.toBuffer();
            channel.send({ files: [{ attachment, name: "welcome-image.png" }] });
        }
    if (settings && settings.welcomeRole) {
        const role = member.guild.roles.cache.get(settings.welcomeRole);
        if (role) {
        await member.roles.add(role);
        }
    }
    }
});


client.once("ready", async () => {
    console.log(`${client.user.username} is ready!`);
    client.user.setActivity("Rover <3", { type: ActivityType.Watching });
    client.guilds.cache.forEach(async (guild) => {
        if (!serverSettings[guild.id]) {
            serverSettings[guild.id] = {
              welcomer: false,
              welcomerChannel: null,
              welcomeRole: null,
              ticketPanels: {},
              userTickets: {},
            };
            saveServerSettings();
          }
        await registerCommandsForGuild(guild);
  
    });


  const guildId = '1306693399075623002';
  const channelId = '1321572338432606208';
  const messageId = '1347666116226453537';

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return;
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isTextBased()) {
    return;
  }

  const message = await channel.messages.fetch(messageId).catch((error) => {
    return null;
  });

  if (!message) {
    return;
  }

  for (const emoji of Object.keys(roles)) {
    if (!message.reactions.cache.has(emoji)) {
        await message.react(emoji).catch((error) =>
            console.error(`Konnte Emoji ${emoji} nicht hinzufügen:`, error)
        );
    }
  }

  const filter = (reaction, user) =>
    Object.keys(roles).includes(reaction.emoji.name) && !user.bot;

  const collector = message.createReactionCollector({ filter, dispose: true });

  collector.on('collect', async (reaction, user) => {
    const roleId = roles[reaction.emoji.name];
    const member = await guild.members.fetch(user.id);

    if (!member.roles.cache.has(roleId)) {
      await member.roles.add(roleId);
      try {
        await user.send(`✅ You have received your role!`);
      } catch (error) {
        console.error(`Konnte keine DM an ${user.tag} senden.`);
      }
    }
  });

  collector.on('remove', async (reaction, user) => {
    const roleId = roles[reaction.emoji.name];
    const member = await guild.members.fetch(user.id);

    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      try {
        await user.send(`❌ You removed your role!`);
      } catch (error) {
        console.error(`Konnte keine DM an ${user.tag} senden.`);
      }
    }
  });


  
});
  
  
client.on("guildCreate", async (guild) => {
    await registerCommandsForGuild(guild);
    
    if (!serverSettings[guild.id]) {
        serverSettings[guild.id] = {
            welcomer: false,
            welcomerChannel: null,
            welcomeRole: null,
            ticketPanels: {},
            userTickets: {},
        };
        saveServerSettings();
    }

    
    try {
        const owner = await guild.fetchOwner();
        await owner.send(
            `Hello ${owner.user.tag}, thank you for adding me to your server "${guild.name}"! Use \`/help\` to see my commands.`
        );
        console.log(`Sent a DM to the owner of guild: ${guild.name}`);
    } catch (error) {
        console.error(`Could not send a DM to the owner of guild: ${guild.name}`, error);
    }
});

client.on("guildDelete", async (guild) => {
    if (serverSettings[guild.id]) {
        delete serverSettings[guild.id]; 
        saveServerSettings();
    }
});


async function registerCommandsForGuild(guild) {
try {


    const commands = [
        {
            name: "ban",
            description: "Ban a user from the server",
            default_member_permissions: '0x4',
            options: [
                {
                    name: "user",
                    description: "The user to ban",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "reason",
                    description: "Reason for banning the user",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                }
            ]
        },
        {
            name: "timeout",
            description: "Timeout a user for a specific duration",
            default_member_permissions: '0x4',
            options: [
                {
                    name: "user",
                    description: "The user to timeout",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "time",
                    description: "Amount of time to timeout the user",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
                {
                    name: "unit",
                    description: "Unit of time",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: "Seconds", value: "seconds" },
                        { name: "Minutes", value: "minutes" },
                        { name: "Hours", value: "hours" },
                        { name: "Days", value: "days" },
                    ]
                }
            ]
        },
        {
            name: "kick",
            description: "Kick a user from the server",
            default_member_permissions: '0x2',
            options: [
                {
                    name: "user",
                    description: "The user to kick",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "reason",
                    description: "Reason for kicking the user",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                }
            ]
        },


        {
            name: "setup-welcome-role",
            description: "Setup the role new members should receive",
            default_member_permissions: '0x8',
            options: [
                {
                name: "role",
                description: "Role the members should receive",
                type: ApplicationCommandOptionType.Role,
                required: true,
                }    
            ],
        },

        {
            name: "selfroles",
            default_member_permissions: "0x00000008",
            description: "create Embed for selfroles",
          },
          {
            name: "embed",
            description: "Create Embed (ADMIN ONLY)",
            default_member_permissions: "0x00000008",
            options: [
              {
                name: "title",
                type: ApplicationCommandOptionType.String,
                description: "Title of the Embed!",
                required: true,
              },
              {
                name: "description",
                type: ApplicationCommandOptionType.String,
                description: "Description of the Embed",
                required: true,
              },
            ],
          },
        
        {
            name: "setup-welcome-channel",
            description: "Setup the channel new members should be greeted in",
            default_member_permissions: '0x8',
            options: [
                {
                    name: "channel",
                    description: "Channel the members should be greeted in",
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [
                        0 
                    ],
                }
            ],
        },
        {
            name: "create-ticket",
            description: "Setup the role new members should receive",
            default_member_permissions: '0x8',
            options: [
                {
                    name: "title",
                    description: "Title of the ticket panel",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },    
                {
                    name: "channel",
                    description: "Channel for the Ticket Panel",
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [
                        0 
                    ],
                }, 
                {
                    name: "category",
                    description: "Category for the Open-Ticket",
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [
                        4 
                    ],
                },       
                {
                    name: "role",
                    description: "Role that can see the Open-Ticket",
                    type: ApplicationCommandOptionType.Role,
                    required: false,
                    
                },       
            ],

        },

        
    ];
    await guild.commands.set(commands);

    console.log(`Commands added to Guild: ${guild.name}!`);
} catch (error) {
    console.log(error)

}
}

client.login(TOKEN);

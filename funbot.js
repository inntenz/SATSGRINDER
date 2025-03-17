const { Client, GatewayIntentBits, ApplicationCommandOptionType, EmbedBuilder, ActivityType } = require('discord.js');
const translate = require('google-translate-api-x');
const { exec } = require('child_process');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });


let queue = [];
let isPlaying = false;

async function searchsong(searchQuery, interaction) {
    const sanitizedSongTitle = searchQuery.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const searchCommand = `yt-dlp "scsearch:${searchQuery}" --get-url`;

    exec(searchCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error searching for the song: ${error.message}`);
            interaction.editReply('Error searching for the song.');
            return;
        }

        const songUrl = stdout.trim();
        

        // Store song details (URL and name) in the queue
        queue.push({ name: searchQuery, url: songUrl});

        interaction.editReply(`Song added to queue: **${searchQuery}**`);

        if (!isPlaying) {
            playNextSong(interaction);
        }
    });
}

async function playNextSong(interaction) {
    if (queue.length === 0) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    const { url: songUrl, name: songName } = queue.shift();

    const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
        connection.destroy();
    });

    const player = createAudioPlayer();

    // Use ffmpeg to stream the audio from the URL
    const stream = exec(`ffmpeg -i "${songUrl}" -f mp3 -vn pipe:1`);

    const resource = createAudioResource(songUrl);

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Song finished!');
        playNextSong(interaction);
    });

    player.on('error', (error) => {
        console.error('Audio player error:', error);
        playNextSong(interaction);
    });
}

async function fetchRandomMeme() {
    try {
        // API-URL für zufällige Memes
        const response = await axios.get('https://meme-api.com/gimme');

        // URL des Meme-Bildes
        const memeImageUrl = response.data.url;

        return memeImageUrl; // Gebe die URL zurück
    } catch (error) {
        console.error('Fehler beim Abrufen des Memes:', error);
        return null; // Gebe null zurück, falls ein Fehler auftritt
    }
}



client.once('ready', async () => {
    console.log(`${client.user.username} is ready!`);
    client.user.setActivity("Rover <3", { type: ActivityType.Watching });

    client.guilds.cache.forEach(async (guild) => {
        await registerCommandsForGuild(guild);
    });
});

async function registerCommandsForGuild(guild) {
    try {
        const commands = [
            {
                name: 'translate',
                description: 'Translate text to a specified language.',
                options: [
                    {
                        name: 'text',
                        description: 'The text you want to translate.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'language',
                        description: 'The target language for translation.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            { name: 'English', value: 'en' },
                            { name: 'German', value: 'de' },
                            { name: 'French', value: 'fr' },
                            { name: 'Spanish', value: 'es' },
                            { name: 'Italian', value: 'it' },
                            { name: 'Portuguese', value: 'pt' },
                            { name: 'Russian', value: 'ru' },
                            { name: 'Japanese', value: 'ja' },
                            { name: 'Korean', value: 'ko' },
                            { name: 'Arabic', value: 'ar' },
                            { name: 'Hindi', value: 'hi' },
                            { name: 'Dutch', value: 'nl' },
                            { name: 'Polish', value: 'pl' },
                            { name: 'Swedish', value: 'sv' },
                            { name: 'Turkish', value: 'tr' },
                            { name: 'Czech', value: 'cs' },
                            { name: 'Greek', value: 'el' },
                            { name: 'Finnish', value: 'fi' },
                            { name: 'Hungarian', value: 'hu' },
                            { name: 'Thai', value: 'th' },
                            { name: 'Vietnamese', value: 'vi' },
                        ],
                    },
                ],
            },
            {
                name: 'song',
                description: 'Request a song to be played in the voice channel!',
                options: [
                    {
                        name: 'songname',
                        description: 'The name of the song you want to play',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'artist',
                        description: 'Optional: The artist of the song',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'queue',
                description: 'See the current song queue',
            },
            {
                name: 'skip',
                description: 'Skip the current song',
            },
            {
                name: 'meme',
                description: 'Sends a random meme',
            },
            {
                name: 'btc',
                description: 'Get Bitcoin info',
            },
        ];

        await guild.commands.set(commands);
        console.log(`Commands added to Guild: ${guild.name}!`);
    } catch (error) {
        console.error(error);
    }
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'btc') {
        try {
            // Abruf der Bitcoin-Daten von CoinGecko
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: {
                    ids: 'bitcoin',
                    vs_currencies: 'usd',
                    include_market_cap: 'false',
                    include_24hr_vol: 'false',
                    include_24hr_change: 'true',
                    include_last_updated_at: 'true',
                }
            });

            const btcData = response.data.bitcoin;
            const price = btcData.usd.toFixed(2);
            const change24h = btcData.usd_24h_change.toFixed(2);

            // Zusätzliche Daten abrufen
            const marketResponse = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin');
            const marketData = marketResponse.data.market_data;
            const high24h = marketData.high_24h.usd.toFixed(2);
            const low24h = marketData.low_24h.usd.toFixed(2);

            // Embed erstellen
            const embed = new EmbedBuilder()
                .setTitle('Bitcoin (BTC) Price')
                .setDescription('Current Bitcoin market statistics')
                .addFields(
                    { name: 'Current Price', value: `$${price}`, inline: false },
                    { name: '24h High', value: `$${high24h}`, inline: false },
                    { name: '24h Low', value: `$${low24h}`, inline: false },
                    { name: '24h Change', value: `${change24h}%`, inline: false },
                )
                .setColor('Gold')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error fetching Bitcoin data:', error);
            await interaction.reply({ content: 'Failed to fetch Bitcoin data. Please try again later.', ephemeral: true });
        }
    }

    if (commandName === "meme") {
        const memeLink = await fetchRandomMeme();
        
        if (memeLink) {
            const embed = new EmbedBuilder()
                
                
                .setImage(memeLink);  // Füge das Meme-Bild als Image hinzu
    
            await interaction.reply({ embeds: [embed]});
        } else {
            await interaction.reply({ content: "There was a problem while fetching the meme.", ephemeral: true });
        }
    }

    if (commandName === 'translate') {
        const text = options.getString('text');
        const language = options.getString('language');

        try {
            const result = await translate(text, { to: language });
            const embed = new EmbedBuilder()
                .setTitle('Translated Text')
                .setDescription(`\`\`\`${result.text}\`\`\``)
                .setColor(0x0000FF); // Hier kannst du die Farbe des Embeds anpassen

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while trying to translate the text.');
        }
    }
    if (commandName === 'song') {
        const songTitle = interaction.options.getString('songname');
        const artist = interaction.options.getString('artist'); 

        if (!songTitle) {
            return interaction.reply('Please enter the name of the song!');
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply('You must be in a voice channel to request a song!');
        }

        const searchQuery = artist ? `${songTitle} ${artist}` : songTitle;

        await interaction.reply(`Looking for the song: **${searchQuery}**...`);
        searchsong(searchQuery, interaction);
    }

    if (commandName === 'queue') {
        if (queue.length === 0) {
            await interaction.reply('The queue is currently empty.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x1abc9c)
            .setTitle('Current Song Queue')
            .setDescription(
                queue.map((song, index) => {
                    return `${index + 1}. **${song.name}**`; 
                }).join('\n') 
            );

        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'skip') {
        if (queue.length === 0 && !isPlaying) {
            await interaction.reply('No songs to skip.');
            return;
        }

        if (queue.length === 0){
            await interaction.reply("Can't skip song, because there is no next song.");
            return;
        }

        await interaction.reply('Skipping the current song...');
        isPlaying = false;
        playNextSong(interaction);
    }
});

const TOKEN = 'MTM0NTUwNTU1MzkwNzk3NDE2NA.G-IgRw.cgmBSzTVs1tIM-HioHitXhttl8JNBS4RA9QTQ8';
client.login(TOKEN);

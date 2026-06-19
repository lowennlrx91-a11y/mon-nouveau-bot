const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const http = require('http');

// ==========================================
// 🛡️ SÉCURITÉ ANTI-COUPURE RENDER (PORT BINDING)
// ==========================================
http.createServer((req, res) => {
    res.write("Bot en ligne !");
    res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// CONFIGURATION DES IDENTIFIANTS (IDs) ⚙️
// ==========================================
const CONFIG = {
    roleReglement: "1517222647958732861",      
    salonReglement: "1465392062227546236",     
    salonTicketPanel: "1465393346892795905", 
    categorieTickets: "1465393296410153117",   
    categorieLogs: "1465393296410153117",       
    roleStaff: "1465396190395764838"           
};

// 🖼️ URL DE TON IMAGE CONFIGURÉE AUTOMATIQUEMENT
const URL_IMAGE_PANEL = "https://i.imgur.com/8aJWlhy.png";

// Stockage temporaire des demandes de tickets en attente de validation
const pendingTickets = new Map();

client.once('ready', async () => {
    console.log('///////////////////////////////////////////////////////');
    console.log('//                                                   //');
    console.log('//   💎 Private Studio (PS) connecté avec succès !   //');
    console.log('//                                                   //');
    console.log('///////////////////////////////////////////////////////');
    
    client.user.setActivity('💎 Private Studio (PS) Mappings', { type: 3 });
    
    // Tout s'exécute automatiquement par ID au démarrage du bot
    await initialiserLogsChannel();
    await initialiserSalonStaff();
    await initialiserReglement();
    await initialiserTicketPanelAutomatique();
});

// ==========================================
// 📋 SYSTÈME DE LOGS AUTOMATIQUE (PAR ID CATÉGORIE)
// ==========================================
async function initialiserLogsChannel() {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        let logsChannel = guild.channels.cache.find(c => c.name === "📋-logs-serveur");

        if (!logsChannel) {
            logsChannel = await guild.channels.create({
                name: "📋-logs-serveur",
                type: ChannelType.GuildText,
                parent: CONFIG.categorieLogs,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: CONFIG.roleStaff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
            console.log("➡️ Salon des logs créé automatiquement dans la catégorie spécifiée !");
        }
    } catch (error) {
        console.error("Erreur création logs :", error);
    }
}

async function envoyerLog(guild, embed) {
    try {
        const logsChannel = guild.channels.cache.find(c => c.name === "📋-logs-serveur");
        if (logsChannel) {
            await logsChannel.send({ embeds: [embed] });
        }
    } catch (e) {
        console.error("Impossible d'envoyer le log :", e);
    }
}

// ==========================================
// CRÉATION AUTOMATIQUE DU SALON DE VALIDATION STAFF
// ==========================================
async function initialiserSalonStaff() {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        let staffChannel = guild.channels.cache.find(c => c.name === "🔒-demandes-tickets");

        if (!staffChannel) {
            staffChannel = await guild.channels.create({
                name: "🔒-demandes-tickets",
                type: ChannelType.GuildText,
                parent: CONFIG.categorieTickets,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: CONFIG.roleStaff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
        }
    } catch (error) {
        console.error("Erreur lors de la création du salon staff :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 1 : RÈGLEMENT (NETTOYAGE COMPLET SI BESOIN)
// ==========================================
async function initialiserReglement() {
    try {
        const channel = await client.channels.fetch(CONFIG.salonReglement);
        if (!channel) return;

        const messages = await channel.messages.fetch({ limit: 50 });
        
        // On vérifie s'il y a des messages d'autres personnes ou si le salon n'a pas exactement 1 message du bot
        const redirectionNecessaire = messages.size !== 1 || messages.first().author.id !== client.user.id;

        if (redirectionNecessaire) {
            console.log("🧹 Nettoyage des anciens messages dans le salon règlement...");
            if (messages.size > 0) {
                await channel.bulkDelete(messages, true).catch(() => {
                    messages.forEach(async (m) => await m.delete().catch(() => {}));
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('💎 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝙎𝙏𝙐𝘿𝙄𝙊 (𝙋𝙎) • 𝙍𝙀̀𝙂𝙇𝙀𝙈𝙀𝙉𝙏 𝘼̀ 𝙍𝙀𝙎𝙋𝙀𝘾𝙏𝙀𝙍')
                .setDescription(
                    'Welcome sur l\'espace de création de **Private Studio** ! Veuillez prendre connaissance de nos règles pour assurer le bon fonctionnement de la communauté.\n\n' +
                    '▬▬▬ 📋 𝙂𝙀𝙉𝙀𝙍𝘼𝙇 ▬▬▬\n\n' +
                    '🤝 `1.` **Respect & Courtoisie :** Tout comportement irrespectueux, insultant, toxique ou discriminatoire est strictement interdit.\n\n' +
                    '💬 `2.` **Langage Approprié :** Restez poli et évitez tout contenu inapproprié.\n\n' +
                    '🔒 `3.` **Confidentialité :** Ne partagez aucune information personnelle.\n\n' +
                    '▬▬▬ 🛠️ 𝙈𝘼𝙋𝙋𝙄𝙉𝙂 ▬▬▬\n\n' +
                    '🛒 `1.` **Commandes & Facturation :** Toute commande doit se faire via le système de ticket.\n\n' +
                    '✨ `2.` **Propriété Intellectuelle :** Toute œuvre achetée devient votre propriété exclusive.\n\n' +
                    '*Pour valider votre entrée et débloquer les 𝘿𝙞𝙨𝙘𝙪𝙩𝙞𝙤𝙣𝙨, veuillez cliquer sur le bouton ci-dessous.*'
                )
                .setImage(URL_IMAGE_PANEL)
                .setFooter({ text: '💎 Private Studio (PS) • Prenez soin de respecter ces règles', iconURL: client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel('Prendre connaissance & Accepter')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("➡️ Panel de règlement renvoyé proprement !");
        }
    } catch (error) {
        console.error("Erreur règlement :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 2 : PANEL TICKET (NETTOYAGE FORCE SI ANCIENS MESSAGES)
// ==========================================
async function initialiserTicketPanelAutomatique() {
    try {
        const channel = await client.channels.fetch(CONFIG.salonTicketPanel);
        if (!channel) return console.log("⚠️ Salon de ticket principal introuvable.");

        const messages = await channel.messages.fetch({ limit: 50 });
        
        // Force le reset si le salon contient plus d'un message, ou si le dernier message n'est pas du bot
        const besoinDeNettoyer = messages.size !== 1 || messages.first().author.id !== client.user.id;

        if (besoinDeNettoyer) {
            console.log("🧹 Nettoyage complet des anciens messages et commandes dans le salon tickets...");
            if (messages.size > 0) {
                await channel.bulkDelete(messages, true).catch(() => {
                    messages.forEach(async (m) => await m.delete().catch(() => {}));
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📦 𝘾𝙀𝙉𝙏𝙍𝙀 𝘿𝙀 𝙎𝙐𝙋𝙋𝙊𝙍𝙏 • 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝙎𝙏𝙐𝘿𝙄𝙊')
                .setDescription(
                    'Bienvenue sur l\'assistant de support de **Private Studio** ! Vous souhaitez concrétiser un projet de mapping ou rejoindre notre équipe ?\n\n' +
                    '🔹 **🛒 Acheter un Mapping :** Commandez une structure exclusive (Concession, Gendarmerie, Habitation VIP).\n' +
                    '🔹 **💳 Effectuer un Paiement :** Finalisez et sécurisez vos transactions avec notre équipe commerciale.\n' +
                    '🔹 **🛠️ Devenir Mappeur :** Déposez votre candidature pour intégrer l\'équipe.\n\n' +
                    '👇 *Cliquez sur le bouton ci-dessous pour formuler une demande d\'ouverture de ticket.*'
                )
                .setImage(URL_IMAGE_PANEL) 
                .setFooter({ text: '💎 Private Studio (PS) • Traitement automatisé', iconURL: client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket_hub')
                    .setLabel('Ouvrir l\'assistant de ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📩')
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("➡️ Nouveau panel de ticket unique et propre mis en place !");
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation automatique du panel ticket :", error);
    }
}

// ==========================================
// MANAGEMENT DES INTERACTIONS (BOUTONS & MENUS + LOGS)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isButton()) {
        
        if (interaction.customId === 'accept_rules') {
            await interaction.deferReply({ ephemeral: true });
            const role = interaction.guild.roles.cache.get(CONFIG.roleReglement);
            if (!role) return interaction.editReply({ content: "❌ Erreur : Rôle introuvable." });

            if (interaction.member.roles.cache.has(CONFIG.roleReglement)) {
                return interaction.editReply({ content: "ℹ️ Vous possédez déjà le statut de membre validé !" });
            }

            try {
                await interaction.member.roles.add(role);
                
                const log = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('✅ Règlement Accepté')
                    .setDescription(`L'utilisateur ${interaction.user} (\`${interaction.user.id}\`) a accepté le règlement et a reçu son rôle.`)
                    .setTimestamp();
                await envoyerLog(interaction.guild, log);

                return interaction.editReply({ content: "✨ **Règlement accepté !** Vos accès viennent d'être activés. Bienvenue dans nos salons de **𝘿𝙞𝙨𝙘𝙪𝙩𝙞𝙤𝙣𝙨** !" });
            } catch (err) {
                return interaction.editReply({ content: "❌ Permissions insuffisantes pour attribuer le rôle." });
            }
        }

        if (interaction.customId === 'open_ticket_hub') {
            await interaction.deferReply({ ephemeral: true });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select_type')
                .setPlaceholder('Sélectionnez la raison de votre demande...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Acheter un Mapping')
                        .setValue('ticket_mapping')
                        .setDescription('Commander une création ou modification')
                        .setEmoji('🛒'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Effectuer un Paiement')
                        .setValue('ticket_paiement')
                        .setDescription('Finaliser ou régulariser une facture')
                        .setEmoji('💳'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Devenir Mappeur')
                        .setValue('ticket_recrutement')
                        .setDescription('Soumettre votre profil pour rejoindre l\'équipe')
                        .setEmoji('🛠️')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);
            return interaction.editReply({ content: '📊 **Veuillez qualifier votre demande à l\'aide du menu ci-dessous :**', components: [row] });
        }

        if (interaction.customId.startsWith('staff_approve_')) {
            const ticketId = interaction.customId.replace('staff_approve_', '');
            const data = pendingTickets.get(ticketId);

            if (!data) return interaction.reply({ content: '❌ Cette demande a expiré ou a déjà été traitée.', ephemeral: true });
            
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Seul le staff peut valider les demandes.', ephemeral: true });
            }

            await interaction.deferUpdate();
            pendingTickets.delete(ticketId);
            await interaction.message.delete().catch(() => {});

            try {
                const ticketChannel = await interaction.guild.channels.create({
                    name: data.channelName,
                    type: ChannelType.GuildText,
                    parent: CONFIG.categorieTickets,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: data.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: CONFIG.roleStaff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                    ],
                });

                const infoEmbed = new EmbedBuilder()
                    .setColor(data.color)
                    .setTitle(data.title)
                    .setDescription(`${data.description}\n\n🛠 *Commandes de gestion :*\n👤 \`+add @Pseudo\`\n❌ \`-remove @Pseudo\``)
                    .setFooter({ text: '💎 Private Studio (PS) • Système Securisé' });

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ticket_add_user`).setLabel('Ajouter').setStyle(ButtonStyle.Secondary).setEmoji('➕'),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await ticketChannel.send({ content: `<@${data.userId}> | <@&${CONFIG.roleStaff}>`, embeds: [infoEmbed], components: [actionRow] });

                const log = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🔓 Ticket Créé & Approuvé')
                    .setDescription(`**Salon :** ${ticketChannel}\n**Client :** <@${data.userId}>\n**Approuvé par :** ${interaction.user}`)
                    .setTimestamp();
                await envoyerLog(interaction.guild, log);

            } catch (error) {
                console.error(error);
            }
        }

        if (interaction.customId.startsWith('staff_deny_')) {
            const ticketId = interaction.customId.replace('staff_deny_', '');
            const data = pendingTickets.get(ticketId);

            if (!interaction.member.roles.cache.has(CONFIG.roleStaff) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Accès refusé.', ephemeral: true });
            }
            
            pendingTickets.delete(ticketId);
            await interaction.message.delete().catch(() => {});

            const log = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Demande de Ticket Rejetée')
                .setDescription(`**Par :** ${interaction.user}\n**Pour la demande de :** <@${data ? data.userId : "Inconnu"}>`)
                .setTimestamp();
            await envoyerLog(interaction.guild, log);

            return interaction.reply({ content: '🗑️ Demande de ticket rejetée.', ephemeral: true });
        }

        if (interaction.customId === 'close_ticket') {
            const log = new EmbedBuilder()
                .setColor('#95a5a6')
                .setTitle('🔒 Ticket Fermé')
                .setDescription(`Le salon **${interaction.channel.name}** a été supprimé définitivement par ${interaction.user}.`)
                .setTimestamp();
            await envoyerLog(interaction.guild, log);

            await interaction.reply({ content: '🔒 **Fermeture demandée.** Suppression définitive de ce salon dans 5 secondes...' });
            setTimeout(async () => {
                try { await interaction.channel.delete(); } catch (e) {}
            }, 5000);
        }

        if (interaction.customId === 'ticket_add_user') {
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff)) return interaction.reply({ content: '❌ Action réservée au Staff.', ephemeral: true });
            return interaction.reply({ content: '💡 Pour ajouter un joueur ou un rôle, écris simplement : `+add @Nom` dans ce salon.', ephemeral: true });
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_type') {
        const choice = interaction.values[0];
        let prefix = "ticket";
        let title = "𝙏𝙞𝙘𝙠𝙚𝙩";
        let description = "";
        let color = "#5865F2";

        if (choice === 'ticket_mapping') {
            prefix = "🛒-mapping";
            title = "🛒 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙚 𝙙𝙚 𝙈𝙖𝙥𝙥𝙞𝙣𝙜 - 𝙋𝙧𝙞𝙫𝙖𝙩𝙚 𝙎𝙩𝙪𝙙𝙞ο";
            description = `Bonjour <@${interaction.user.id}>,\n\nMerci de détailler au maximum votre demande pour nos mappeurs :\n\n📌 **Type de projet :** (Concession, Gendarmerie...)\n🎨 **Textures souhaitées :** (Fibre de carbone...)\n⚡ **Optimisation :** Souhaitez-vous une structure allégée par chunks ?`;
            color = "#ffd700";
        } else if (choice === 'ticket_paiement') {
            prefix = "💳-paiement";
            title = "💳 𝙎𝙚𝙧𝙫𝙞𝙘𝙚 𝙙𝙚 𝙋𝙖𝙞𝙚𝙢𝙚𝙣𝙩 & 𝙁𝙖𝙘𝙩𝙪𝙧𝙖𝙩𝙞ο𝙣";
            description = `Bonjour <@${interaction.user.id}>,\n\nPour procéder à la facturation de votre mapping :\n• Veuillez rappeler le tarif conclu.\n• Un membre du pôle commercial va vous transmettre les liens officiels.`;
            color = "#2ecc71";
        } else if (choice === 'ticket_recrutement') {
            prefix = "🛠️-recrutement";
            title = "🛠️ 𝙍𝙚𝙘𝙧𝙪𝙩𝙚𝙢𝙚𝙣𝙩 • 𝙋𝙧𝙞𝙫𝙖𝙩𝙚 𝙎𝙩𝙪𝙙𝙞ο";
            description = `Bonjour <@${interaction.user.id}>,\n\nMerci de l'intérêt porté à notre équipe !\n• Veuillez envoyer des images de vos anciens mappings.\n• Indiquez vos motivations.`;
            color = "#3498db";
        }

        const channelName = `${prefix}-${interaction.user.username}`.toLowerCase();
        
        const existing = interaction.guild.channels.cache.find(c => c.name === channelName);
        if (existing) {
            return interaction.reply({ content: `❌ Vous possédez déjà un espace ouvert pour cette demande : ${existing}`, ephemeral: true });
        }

        const ticketId = `${interaction.user.id}-${Date.now()}`;
        pendingTickets.set(ticketId, {
            userId: interaction.user.id,
            channelName,
            title,
            description,
            color
        });

        const guild = interaction.guild;
        const staffChannel = guild.channels.cache.find(c => c.name === "🔒-demandes-tickets");

        const staffEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🔔 NOUVELLE DEMANDE DE TICKET')
            .setDescription(`👤 **Demandeur :** ${interaction.user}\n📋 **Type :** \`${prefix.toUpperCase()}\``)
            .setTimestamp();

        const staffRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`staff_approve_${ticketId}`).setLabel('✅ Accepter').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`staff_deny_${ticketId}`).setLabel('❌ Rejeter').setStyle(ButtonStyle.Danger)
        );

        if (staffChannel) {
            await staffChannel.send({ content: `⚠️ <@&${CONFIG.roleStaff}> • Nouvelle demande reçue !`, embeds: [staffEmbed], components: [staffRow] });
        }

        const log = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📩 Demande de Ticket Envoyée')
            .setDescription(`L'utilisateur ${interaction.user} a demandé l'ouverture d'un ticket de catégorie \`${prefix.toUpperCase()}\`. En attente du staff...`)
            .setTimestamp();
        await envoyerLog(interaction.guild, log);

        return interaction.reply({ content: '✅ **Demande envoyée avec succès !** Votre ticket est en attente de validation par l\'équipe de Private Studio.', ephemeral: true });
    }
});

// ==========================================
// CHAT COMMANDS : AJOUT / RETRAIT + LOGS ACTIONS
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.parentId !== CONFIG.categorieTickets) return;

    if (message.content.startsWith('+add')) {
        if (!message.member.roles.cache.has(CONFIG.roleStaff) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const targetMember = message.mentions.members.first();

        if (targetMember) {
            await message.channel.permissionOverwrites.edit(targetMember.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            const log = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('👤 Membre Ajouté au Ticket')
                .setDescription(`**Salon :** ${message.channel}\n**Action par :** ${message.author}\n**Membre ajouté :** ${targetMember}`)
                .setTimestamp();
            await envoyerLog(message.guild, log);

            return message.channel.send(`👤 ${targetMember} a été **ajouté** au ticket.`);
        }
    }

    if (message.content.startsWith('-remove')) {
        if (!message.member.roles.cache.has(CONFIG.roleStaff) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const targetMember = message.mentions.members.first();

        if (targetMember) {
            await message.channel.permissionOverwrites.delete(targetMember.id);

            const log = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('👤 Membre Retiré du Ticket')
                .setDescription(`**Salon :** ${message.channel}\n**Action par :** ${message.author}\n**Membre retiré :** ${targetMember}`)
                .setTimestamp();
            await envoyerLog(message.guild, log);

            return message.channel.send(`👤 ${targetMember} a été **retiré** du ticket.`);
        }
    }
});

client.login(process.env.TOKEN);

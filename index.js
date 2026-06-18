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
// CONFIGURATION DES IDENTIFIANTS (IDs)
// ==========================================
const CONFIG = {
    roleReglement: "1517222647958732861",      
    salonReglement: "1465392062227546236",     
    categorieTickets: "1465393296410153117",   
    roleStaff: "1465396190395764838"           
};

// 🖼️ URL DE TON IMAGE image_81130c.jpg HÉBERGÉE
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
    
    await initialiserReglement();
    await initialiserSalonStaff();
});

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
            console.log("➡️ Salon secret de gestion des tickets créé avec succès !");
        }
    } catch (error) {
        console.error("Erreur lors de la création du salon staff :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 1 : RÈGLEMENT PROFESSIONNEL
// ==========================================
async function initialiserReglement() {
    try {
        const channel = await client.channels.fetch(CONFIG.salonReglement);
        if (!channel) return;

        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(m => m.author.id === client.user.id);

        if (!botMessage) {
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('💎 PRIVATE STUDIO (PS) • RÈGLEMENT À RESPECTER')
                .setDescription(
                    'Welcome sur l\'espace de création de **Private Studio** ! Veuillez prendre connaissance de nos règles pour assurer le bon fonctionnement de la communauté.\n\n' +
                    '▬▬▬ 📋 **RÈGLES GÉNÉRALES** ▬▬▬\n\n' +
                    '🤝 `1.` **Respect & Courtoisie :** Tout comportement irrespectueux, insultant, toxique ou discriminatoire est strictement interdit.\n\n' +
                    '💬 `2.` **Langage Approprié :** Restez poli et évitez tout contenu inapproprié, déplacé ou sensitive (NSFW, politique, religieux).\n\n' +
                    '🔒 `3.` **Confidentialité :** Ne partagez aucune information personnelle, que ce soit les vôtres ou celles des autres membres.\n\n' +
                    '📢 `4.` **Publicité & Spam :** Toute promotion non autorisée (y compris le démarchage par message privé) est formellement interdite.\n\n' +
                    '👥 `5.` **Multi-Comptes :** L’utilisation de comptes secondaires pour contourner une sanction entraînera un bannissement définitif.\n\n' +
                    '▬▬▬ 🛠️ **GRAPHISME & MAPPING** ▬▬▬\n\n' +
                    '🛒 `1.` **Commandes & Facturation :** Toute commande doit se faire via le système de ticket. Les paiements s\'effectuent obligatoirement avant la livraison.\n\n' +
                    '✨ `2.` **Propriété Intellectuelle :** Toute œuvre achetée devient votre propriété exclusive dès validation complète, sauf mention contraire.\n\n' +
                    '❌ `3.` **Aucun Plagiat :** La copie, le vol ou l\'appropriation du travail d\'un autre créateur sera puni d\'une exclusion immédiate.\n\n' +
                    '▬▬▬ 💳 **TRANSACTIONS & COLLABORATIONS** ▬▬▬\n\n' +
                    '💵 `1.` **Système de Paiement :** Les transactions doivent uniquement utiliser les passerelles de paiement officielles et sécurisées du serveur.\n\n' +
                    '⚠️ `2.` **Litiges & Remboursements :** Une fois la commande lancée et validée, aucun remboursement ne sera effectué sans l\'accord explicite du vendeur.\n\n' +
                    '🤝 `3.` **Engagement :** Soyez précis dans vos cahiers des charges et respectez vos engagements lors des projets collaboratifs.\n\n' +
                    '▬▬▬ ⚖️ **SANCTIONS** ▬▬▬\n\n' +
                    '🛑 Tout manquement à ce protocole donnera lieu à des sanctions adaptées (Avertissement ➔ Sourdine ➔ Exclusion ➔ Bannissement Définitif).\n\n' +
                    '*Pour valider votre entrée et débloquer l\'intégralité des salons du serveur, veuillez cliquer sur le bouton ci-dessous.*'
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
            console.log("➡️ Panel de règlement propre envoyé !");
        }
    } catch (error) {
        console.error("Erreur règlement :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 2 : PANNEAU DES TICKETS
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        await message.delete().catch(() => {});
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📦 CENTRE DE SUPPORT & COMMANDES MAPPING')
            .setDescription(
                'Bienvenue sur l\'assistant de support de **Private Studio** ! Vous souhaitez concrétiser un projet de mapping Nova-Life ou rejoindre notre équipe ?\n\n' +
                '🔹 **🛒 Acheter un Mapping :** Commandez une structure exclusive (Concession, QG Gendarmerie/Sapeurs-Pompiers, Garage, Villa VIP).\n' +
                '🔹 **💳 Effectuer un Paiement :** Finalisez et sécurisez vos transactions avec notre équipe commerciale.\n' +
                '🔹 **🛠️ Devenir Mappeur :** Déposez votre candidature et présentez vos créations pour intégrer l\'équipe.\n\n' +
                '👇 *Cliquez sur le bouton ci-dessous pour formuler une demande d\'ouverture de ticket.*'
            )
            .setFooter({ text: '💎 Private Studio (PS) • Traitement automatisé', iconURL: client.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_hub')
                .setLabel('Ouvrir l\'assistant de ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// ==========================================
// MANAGEMENT DES INTERACTIONS (BOUTONS & MENUS)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isButton()) {
        
        // Clic acceptation règlement
        if (interaction.customId === 'accept_rules') {
            await interaction.deferReply({ ephemeral: true });
            const role = interaction.guild.roles.cache.get(CONFIG.roleReglement);
            if (!role) return interaction.editReply({ content: "❌ Erreur : Rôle introuvable." });

            if (interaction.member.roles.cache.has(CONFIG.roleReglement)) {
                return interaction.editReply({ content: "ℹ️ Vous possédez déjà le statut de membre validé !" });
            }

            try {
                await interaction.member.roles.add(role);
                return interaction.editReply({ content: "✨ **Règlement accepté !** Vos accès viennent d'être activés. Bienvenue chez Private Studio !" });
            } catch (err) {
                return interaction.editReply({ content: "❌ Permissions insuffisantes pour attribuer le rôle." });
            }
        }

        // Clic sur l'assistant de ticket (Envoie le menu déroulant)
        if (interaction.customId === 'open_ticket_hub') {
            await interaction.deferReply({ ephemeral: true });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select_type')
                .setPlaceholder('Sélectionnez la raison de votre demande...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Acheter un Mapping')
                        .setValue('ticket_mapping')
                        .setDescription('Commander une création ou modification Nova-Life')
                        .setEmoji('🛒'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Effectuer un Paiement')
                        .setValue('ticket_paiement')
                        .setDescription('Finaliser ou régulariser une facture en cours')
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

        // Action Staff : APPROBATION DU TICKET (Depuis le salon secret)
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
                        { 
                            id: interaction.guild.id, 
                            deny: [PermissionFlagsBits.ViewChannel] 
                        },
                        { 
                            id: data.userId, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
                        },
                        { 
                            id: CONFIG.roleStaff, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
                        }
                    ],
                });

                const infoEmbed = new EmbedBuilder()
                    .setColor(data.color)
                    .setTitle(data.title)
                    .setDescription(`${data.description}\n\n🛠️ **Commandes Rapides de gestion :**\n👤 \`+add @Pseudo\` ou \`+add ID_du_Rôle\`\n❌ \`-remove @Pseudo\` ou \`-remove ID_du_Rôle\``)
                    .setFooter({ text: '💎 Private Studio (PS) • Système Sécurisé' });

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ticket_add_user`).setLabel('Ajouter').setStyle(ButtonStyle.Secondary).setEmoji('➕'),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await ticketChannel.send({ content: `<@${data.userId}> | <@&${CONFIG.roleStaff}>`, embeds: [infoEmbed], components: [actionRow] });

            } catch (error) {
                console.error(error);
            }
        }

        // Action Staff : REFUS DU TICKET
        if (interaction.customId.startsWith('staff_deny_')) {
            const ticketId = interaction.customId.replace('staff_deny_', '');
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Accès refusé.', ephemeral: true });
            }
            pendingTickets.delete(ticketId);
            await interaction.message.delete().catch(() => {});
            return interaction.reply({ content: '🗑️ Demande de ticket rejetée.', ephemeral: true });
        }

        // Action : Fermeture définitive du ticket
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 **Fermeture demandée.** Suppression définitive de ce salon dans 5 secondes...' });
            setTimeout(async () => {
                try { await interaction.channel.delete(); } catch (e) {}
            }, 5000);
        }

        // Bouton d'aide pour l'ajout
        if (interaction.customId === 'ticket_add_user') {
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff)) return interaction.reply({ content: '❌ Action réservée au Staff.', ephemeral: true });
            return interaction.reply({ content: '💡 Pour ajouter un joueur ou un rôle, écris simplement : `+add @Nom` ou `+add ID_du_Rôle` dans ce salon.', ephemeral: true });
        }
    }

    // --- TRAITEMENT DE LA SÉLECTION DANS LE MENU (CORRIGÉ ICI !) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_type') {
        const choice = interaction.values[0];
        let prefix = "ticket";
        let title = "Ticket";
        let description = "";
        let color = "#5865F2";

        if (choice === 'ticket_mapping') {
            prefix = "🛒-mapping";
            title = "🛒 Commande de Mapping - Private Studio";
            description = `Bonjour <@${interaction.user.id}>,\n\nMerci de détailler au maximum votre demande pour nos mappeurs :\n\n📌 **Type de projet :** (Concession, Gendarmerie, Habitation VIP...)\n🎨 **Textures personnalisées souhaitées :** (Fibre de carbone, logos de marques...)\n⚡ **Optimisation :** Souhaitez-vous une structure allégée par chunks (Fast Loading PC) ?`;
            color = "#ffd700";
        } else if (choice === 'ticket_paiement') {
            prefix = "💳-paiement";
            title = "💳 Service de Paiement & Facturation";
            description = `Bonjour <@${interaction.user.id}>,\n\nPour procéder à la facturation de votre mapping :\n• Veuillez rappeler la commande concernée et le tarif conclu.\n• Un membre du pôle commercial va vous transmettre les liens de paiement officiels.`;
            color = "#2ecc71";
        } else if (choice === 'ticket_recrutement') {
            prefix = "🛠️-recrutement";
            title = "🛠️ Recrutement • Équipe Technique Private Studio";
            description = `Bonjour <@${interaction.user.id}>,\n\nMerci de l'intérêt porté à notre équipe !\n• Veuillez envoyer des images/vidéos de vos anciens mappings.\n• Indiquez vos motivations et vos disponibilités.`;
            color = "#3498db";
        }

        const channelName = `${prefix}-${interaction.user.username}`.toLowerCase();
        
        // CORRECTION ICI : Remplacement de "name" par "channelName"
        const existing = interaction.guild.channels.cache.find(c => c.name === channelName);
        if (existing) {
            return interaction.reply({ content: `❌ Vous possédez déjà un espace ouvert pour cette demande : ${existing}`, ephemeral: true });
        }

        const ticketId = `${interaction.user.id}-${Date.now()}`;
        pendingTickets.set(ticketId, {
            userId: interaction.user.id,
            channelName, // CORRECTION ICI
            title,
            description,
            color
        });

        const guild = interaction.guild;
        const staffChannel = guild.channels.cache.find(c => c.name === "🔒-demandes-tickets");

        const staffEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🔔 NOUVELLE DEMANDE DE TICKET EN ATTENTE')
            .setDescription(`👤 **Demandeur :** ${interaction.user} (\`${interaction.user.id}\`)\n📋 **Catégorie :** \`${prefix.toUpperCase()}\``)
            .setTimestamp();

        const staffRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`staff_approve_${ticketId}`).setLabel('✅ Accepter la demande').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`staff_deny_${ticketId}`).setLabel('❌ Rejeter').setStyle(ButtonStyle.Danger)
        );

        if (staffChannel) {
            await staffChannel.send({ content: `⚠️ <@&${CONFIG.roleStaff}> • Nouvelle demande reçue !`, embeds: [staffEmbed], components: [staffRow] });
        } else {
            await interaction.channel.send({ content: `⚠️ <@&${CONFIG.roleStaff}> • Salon secret introuvable, demande reçue ici !`, embeds: [staffEmbed], components: [staffRow] });
        }

        return interaction.reply({ content: '✅ **Demande envoyée avec succès !** Votre ticket est en attente de validation par l\'équipe de Private Studio.', ephemeral: true });
    }
});

// ==========================================
// CHAT COMMANDS : AJOUT / RETRAIT SÉCURISÉ (JOUEURS ET RÔLES)
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.parentId !== CONFIG.categorieTickets) return;

    if (message.content.startsWith('+add')) {
        if (!message.member.roles.cache.has(CONFIG.roleStaff) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const args = message.content.split(' ').slice(1).join(' ');
        const targetMember = message.mentions.members.first();
        const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(args);

        if (targetMember) {
            await message.channel.permissionOverwrites.edit(targetMember.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            return message.channel.send(`👤 ${targetMember} a été **ajouté** au ticket.`);
        } else if (targetRole) {
            await message.channel.permissionOverwrites.edit(targetRole.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            return message.channel.send(`🛡️ Le rôle **${targetRole.name}** a désormais accès à ce ticket.`);
        } else {
            return message.channel.send('❌ Cible introuvable. Exemple : `+add @Pseudo` ou `+add @NomDuRole` (ou son ID).');
        }
    }

    if (message.content.startsWith('-remove')) {
        if (!message.member.roles.cache.has(CONFIG.roleStaff) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const args = message.content.split(' ').slice(1).join(' ');
        const targetMember = message.mentions.members.first();
        const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(args);

        if (targetMember) {
            await message.channel.permissionOverwrites.delete(targetMember.id);
            return message.channel.send(`👤 ${targetMember} a été **retiré** du ticket.`);
        } else if (targetRole) {
            await message.channel.permissionOverwrites.delete(targetRole.id);
            return message.channel.send(`🛡️ Le rôle **${targetRole.name}** a été **retiré** du ticket.`);
        } else {
            return message.channel.send('❌ Cible introuvable. Exemple : `-remove @Pseudo` ou `-remove @NomDuRole`.');
        }
    }
});

client.login(process.env.TOKEN);

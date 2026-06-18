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
    res.write("Bot Vortex en ligne !");
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

// Stockage temporaire des demandes de tickets en attente de validation
const pendingTickets = new Map();

client.once('ready', async () => {
    console.log(`✅ Vortex Bot connecté avec succès : ${client.user.tag}`);
    client.user.setActivity('Nova-Life: Amboise Mappings', { type: 3 });
    await initialiserReglement();
});

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
                .setTitle('📜 RÈGLEMENT DU SERVEUR • À LIRE ET RESPECTER')
                .setDescription(
                    'Welcome sur notre espace de création ! Veuillez prendre connaissance de nos règles pour assurer le bon fonctionnement de la communauté.\n\n' +
                    '▬▬▬ 📋 **RÈGLES GÉNÉRALES** ▬▬▬\n\n' +
                    '🤝 `1.` **Respect & Courtoisie :** Tout comportement irrespectueux, insultant, toxique ou discriminatoire est strictement interdit.\n\n' +
                    '💬 `2.` **Langage Approprié :** Restez poli et évitez tout contenu inapproprié, déplacé ou sensible (NSFW, politique, religieux).\n\n' +
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
                .setFooter({ text: 'Vortex Bot • Prenez soin de respecter ces règles', iconURL: client.user.displayAvatarURL() });

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
            .setTitle('📦 CENTRE DE SUPPORT & COMMANDES')
            .setDescription(
                'Bienvenue sur notre plateforme d\'assistance ! Vous souhaitez concrétiser un projet ou rejoindre notre équipe ?\n\n' +
                '🔹 **Acheter un Mapping :** Demandez une création ou modification exclusive pour *Nova-Life: Amboise*.\n' +
                '🔹 **Effectuer un Paiement :** Finalisez et sécurisez vos transactions avec notre équipe commerciale.\n' +
                '🔹 **Devenir Mappeur :** Déposez votre candidature pour intégrer notre équipe technique.\n\n' +
                '👇 *Cliquez sur le bouton ci-dessous pour formuler une demande d\'ouverture de ticket.*'
            )
            .setFooter({ text: 'Weslé Auto & Mappings • Traitement automatisé', iconURL: client.user.displayAvatarURL() });

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
// INTERACTION MANAGEMENT
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // --- PARTIE 1 : BOUTONS GLOBAUX ---
    if (interaction.isButton()) {
        
        // Validation Règlement
        if (interaction.customId === 'accept_rules') {
            await interaction.deferReply({ ephemeral: true });
            const role = interaction.guild.roles.cache.get(CONFIG.roleReglement);
            if (!role) return interaction.editReply({ content: "❌ Erreur : Rôle de validation introuvable." });

            if (interaction.member.roles.cache.has(CONFIG.roleReglement)) {
                return interaction.editReply({ content: "ℹ️ Vous possédez déjà le statut de membre validé !" });
            }

            try {
                await interaction.member.roles.add(role);
                return interaction.editReply({ content: "✨ **Règlement accepté !** Vos accès viennent d'être activés. Bienvenue parmi nous !" });
            } catch (err) {
                return interaction.editReply({ content: "❌ Le bot n'a pas les permissions nécessaires pour vous accorder ce rôle." });
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

        // Action Staff : Validation et création du ticket réel
        if (interaction.customId.startsWith('staff_approve_')) {
            const ticketId = interaction.customId.replace('staff_approve_', '');
            const data = pendingTickets.get(ticketId);

            if (!data) return interaction.reply({ content: '❌ Cette demande a expiré ou a déjà été traitée.', ephemeral: true });
            
            // Sécurité : Seul le staff peut valider
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Seul le personnel autorisé peut valider les demandes.', ephemeral: true });
            }

            await interaction.deferUpdate();
            pendingTickets.delete(ticketId);

            // Suppression du message de demande d'approbation
            await interaction.message.delete().catch(() => {});

            try {
                // Création du salon de ticket final
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
                    .setDescription(`${data.description}\n\n⚙️ **Outils de Gestion du Staff :**\n👤 Utilisez les boutons ci-dessous pour ajouter/retirer un utilisateur externe du ticket si nécessaire.`)
                    .setFooter({ text: 'Fermeture complète via le bouton rouge sécurisé.' });

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ticket_add_user`).setLabel('Ajouter Membre').setStyle(ButtonStyle.Secondary).setEmoji('➕'),
                    new ButtonBuilder().setCustomId(`ticket_remove_user`).setLabel('Retirer Membre').setStyle(ButtonStyle.Secondary).setEmoji('➖'),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await ticketChannel.send({ content: `<@${data.userId}> | <@&${CONFIG.roleStaff}>`, embeds: [infoEmbed], components: [actionRow] });

            } catch (error) {
                console.error(error);
                return interaction.followUp({ content: "❌ Échec de la création physique du salon. Vérifiez les droits sur la catégorie.", ephemeral: true });
            }
        }

        // Action Staff : Refus de la demande
        if (interaction.customId.startsWith('staff_deny_')) {
            const ticketId = interaction.customId.replace('staff_deny_', '');
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Accès refusé.', ephemeral: true });
            }
            pendingTickets.delete(ticketId);
            await interaction.message.delete().catch(() => {});
            return interaction.reply({ content: '🗑️ Demande de ticket rejetée et supprimée.', ephemeral: true });
        }

        // Action Interne au Ticket : Fermeture
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 **Fermeture demandée.** Suppression définitive de ce salon dans 5 secondes...' });
            setTimeout(async () => {
                try { await interaction.channel.delete(); } catch (e) {}
            }, 5000);
        }

        // Action Interne au Ticket : Demander à ajouter un membre
        if (interaction.customId === 'ticket_add_user') {
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff)) return interaction.reply({ content: '❌ Action réservée au Staff.', ephemeral: true });
            return interaction.reply({ content: '💡 Pour ajouter quelqu\'un, écrivez simplement : `+add @Pseudo` dans le chat.', ephemeral: true });
        }

        // Action Interne au Ticket : Demander à retirer un membre
        if (interaction.customId === 'ticket_remove_user') {
            if (!interaction.member.roles.cache.has(CONFIG.roleStaff)) return interaction.reply({ content: '❌ Action réservée au Staff.', ephemeral: true });
            return interaction.reply({ content: '💡 Pour exclure quelqu\'un, écrivez simplement : `-remove @Pseudo` dans le chat.', ephemeral: true });
        }
    }

    // --- PARTIE 2 : MENU DÉROULANT (CRÉATION DE LA DEMANDE) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_type') {
        const choice = interaction.values[0];
        let prefix = "ticket";
        let title = "Ticket";
        let description = "";
        let color = "#5865F2";

        if (choice === 'ticket_mapping') {
            prefix = "🛒-mapping";
            title = "🛒 Commande de Mapping - Nova-Life";
            description = `Bonjour <@${interaction.user.id}>,\n\nMerci de détailler votre projet de mapping :\n1️⃣ Quel type de structure souhaitez-vous modifier ou implanter ?\n2️⃣ Possédez-vous des textures sur-mesure (ex: fibre de carbone, enseignes spécifiques) ?`;
            color = "#ffd700";
        } else if (choice === 'ticket_paiement') {
            prefix = "💳-paiement";
            title = "💳 Service de Paiement & Facturation";
            description = `Bonjour <@${interaction.user.id}>,\n\nPour finaliser votre achat :\n• Rappelez l'intitulé de la commande et le tarif validé.\n• Un agent commercial va prendre le relais pour l'envoi des coordonnées de paiement.`;
            color = "#2ecc71";
        } else if (choice === 'ticket_recrutement') {
            prefix = "🛠️-recrutement";
            title = "🛠️ Recrutement • Pôle Technique";
            description = `Bonjour <@${interaction.user.id}>,\n\nMerci de soumettre votre intérêt pour rejoindre l'équipe :\n• Joignez des aperçus de vos anciennes conceptions ou portfolios.\n• Présentez brièvement vos motivations.`;
            color = "#3498db";
        }

        const channelName = `${prefix}-${interaction.user.username}`.toLowerCase();
        
        // Vérification doublon actif
        const existing = interaction.guild.channels.cache.find(c => c.name === channelName);
        if (existing) {
            return interaction.reply({ content: `❌ Vous possédez déjà un espace ouvert pour cette demande : ${existing}`, ephemeral: true });
        }

        // Génération de la demande pour le staff
        const ticketId = `${interaction.user.id}-${Date.now()}`;
        pendingTickets.set(ticketId, {
            userId: interaction.user.id,
            channelName,
            title,
            description,
            color
        });

        // Alerte dans le salon actuel (reçu uniquement par le staff)
        const staffEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🔔 NOUVELLE DEMANDE DE TICKET EN ATTENTE')
            .setDescription(`👤 **Utilisateur :** ${interaction.user} (\`${interaction.user.id}\`)\n📋 **Type demandé :** \`${prefix.toUpperCase()}\``)
            .setTimestamp();

        const staffRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`staff_approve_${ticketId}`).setLabel('✅ Accepter la demande').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`staff_deny_${ticketId}`).setLabel('❌ Rejeter').setStyle(ButtonStyle.Danger)
        );

        // Envoie la demande d'approbation au staff dans le salon secret ou actuel
        await interaction.channel.send({ content: `⚠️ <@&${CONFIG.roleStaff}> • Une demande d'ouverture nécessite votre attention !`, embeds: [staffEmbed], components: [staffRow] });

        return interaction.reply({ content: '✅ **Demande envoyée avec succès !** Un membre de notre équipe va valider l\'ouverture de votre ticket d\'ici quelques instants.', ephemeral: true });
    }
});

// ==========================================
// FONCTIONNALITÉ 3 : CHAT COMMANDS (+add / -remove)
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Condition : On doit être dans un salon de la catégorie des tickets
    if (message.channel.parentId !== CONFIG.categorieTickets) return;

    // Commande textuelle d'ajout : +add @membre
    if (message.content.startsWith('+add')) {
        if (!message.member.roles.cache.has(CONFIG.roleStaff) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const target = message.mentions.members.first();
        if (!target) return message.channel.send('❌ Veuillez mentionner un utilisateur valide. Exemple: `+add @Pseudo`');

        await message.channel.permissionOverwrites.edit(target.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        return message.channel.send(`👤 ${target} a été **ajouté** au ticket avec succès par ${message.author}.`);
    }

    // Commande textuelle de retrait : -remove @membre
    if (message.content.startsWith('-remove')) {
        if (!message.member.roles.cache.has(CONFIG.roleStaff) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const target = message.mentions.members.first();
        if (!target) return message.channel.send('❌ Veuillez mentionner un utilisateur valide. Exemple: `-remove @Pseudo`');

        await message.channel.permissionOverwrites.delete(target.id);
        return message.channel.send(`👤 ${target} a été **retiré** du ticket par ${message.author}.`);
    }
});

client.login(process.env.TOKEN);

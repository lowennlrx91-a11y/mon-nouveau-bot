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
    roleReglement: "1517222647958732861",      // ID du rôle Membre validé
    salonReglement: "1465392062227546236",     // ID du salon Règlement
    categorieTickets: "1465393296410153117",   // ID de la catégorie des tickets
    roleStaff: "1465396190395764838"           // ID du rôle Staff/Vendeur/Mappeur
};

client.once('ready', async () => {
    console.log(`✅ Vortex Bot connecté avec succès : ${client.user.tag}`);
    client.user.setActivity('Nova-Life: Amboise Mappings', { type: 3 });
    await initialiserReglement();
});

// ==========================================
// FONCTIONNALITÉ 1 : TON RÈGLEMENT EXACT
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
                .setTitle('Règlement à lire et à respecter ✅')
                .setDescription(
                    ' Règlement du Serveur\n' +
                    ' Règles Générales\n\n' +
                    '1 - Respect et courtoisie : Tout comportement irrespectueux, insultant ou discriminatoire est interdit.\n\n' +
                    '2- Langage approprié : Restez poli et évitez tout contenu inapproprié (NSFW, politique, religieux, etc.).\n\n' +
                    '3 - Confidentialité : Ne partagez pas d’informations personnelles, que ce soit les vôtres ou celles des autres membres.\n\n' +
                    '4 - Publicité et spam : Toute promotion non autorisée, y compris par message privé, est interdite.\n\n' +
                    '5 - Multi-comptes : L’utilisation de plusieurs comptes pour contourner une sanction est prohibée. Règles liées au Graphisme et au Mapping\n\n' +
                    '1 - Commandes et paiements : Toute commande doit être passée dans les salons prévus à cet effet. Les paiements doivent être effectués avant la livraison.\n\n' +
                    '2 - Propriété des créations : Toute œuvre achetée devient la propriété de l’acheteur, sauf mention contraire du créateur.\n\n' +
                    '3 - Aucun plagiat : Toute copie ou appropriation du travail d’un autre créateur sera sanctionnée.\n' +
                    ' Achat, Vente et Collaboration\n\n' +
                    '1 - Système de paiement : Les transactions doivent être effectuées via les moyens de paiement acceptés par le serveur.\n\n' +
                    '2 - Évitez les litiges : Une fois un achat validé, aucun remboursement ne sera effectué sauf accord du vendeur.\n\n' +
                    '3 - Collaboration et engagement : Respectez vos engagements lors d’une collaboration et soyez clairs dans vos demandes. Sanctions\n' +
                    'Tout manquement à ce règlement peut entraîner des sanctions allant d’un avertissement à un bannissement définitif du serveur. L’équipe de modération se réserve le droit d’agir selon la gravité de la situation.\n\n' +
                    'Nous comptons sur votre sérieux et votre respect des règles pour que ce serveur reste un espace agréable et professionnel.'
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel('Accepter le règlement')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("➡️ Panel de règlement initialisé !");
        }
    } catch (error) {
        console.error("Erreur règlement :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 2 : TEXTE DE COMMANDE !SETUP-TICKET
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        await message.delete().catch(() => {});
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📦 Centre de Support & Commandes')
            .setDescription(
                'Besoin d\'un mapping exclusif pour Nova-Life, d\'effectuer un paiement sécurisé ou de postuler dans notre équipe ?\n\n' +
                'Clique sur le bouton ci-dessous pour ouvrir ton espace privé.'
            )
            .setFooter({ text: 'Weslé Auto & Mappings • Système automatisé' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_hub')
                .setLabel('Ouvrir un Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// ==========================================
// GESTIONNAIRE DES INTERACTION (Boutons & Menus)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    // --- GESTION DES BOUTONS ---
    if (interaction.isButton()) {
        
        // Validation Règlement
        if (interaction.customId === 'accept_rules') {
            await interaction.deferReply({ ephemeral: true });
            const role = interaction.guild.roles.cache.get(CONFIG.roleReglement);
            if (!role) return interaction.editReply({ content: "❌ Erreur : Rôle introuvable." });

            if (interaction.member.roles.cache.has(CONFIG.roleReglement)) {
                return interaction.editReply({ content: "ℹ️ Tu as déjà accepté le règlement !" });
            }

            try {
                await interaction.member.roles.add(role);
                return interaction.editReply({ content: "✅ Règlement accepté ! Bienvenue sur le serveur !" });
            } catch (err) {
                return interaction.editReply({ content: "❌ Permissions insuffisantes pour attribuer le rôle." });
            }
        }

        // Clic sur "Ouvrir un ticket" -> Envoi du menu des catégories
        if (interaction.customId === 'open_ticket_hub') {
            await interaction.deferReply({ ephemeral: true });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select_type')
                .setPlaceholder('Sélectionne le motif de ton ticket...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Acheter un Mapping')
                        .setValue('ticket_mapping')
                        .setDescription('Commander un mapping ou une modification Nova-Life')
                        .setEmoji('🛒'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Effectuer un Paiement')
                        .setValue('ticket_paiement')
                        .setDescription('Finaliser ou régulariser un achat en cours')
                        .setEmoji('💳'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Devenir Mappeur')
                        .setValue('ticket_recrutement')
                        .setDescription('Déposer sa candidature pour rejoindre l\'équipe')
                        .setEmoji('🛠️')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);
            return interaction.editReply({ content: 'Veuillez choisir la catégorie de votre demande :', components: [row] });
        }

        // Fermeture du ticket
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Fermeture et suppression du ticket dans 5 secondes...' });
            setTimeout(async () => {
                try { await interaction.channel.delete(); } catch (e) {}
            }, 5000);
        }
    }

    // --- GESTION DU MENU DE SÉLECTION (CRÉATION DU TICKET PAR CATÉGORIE) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_type') {
        await interaction.deferUpdate();

        const choice = interaction.values[0];
        let prefix = "ticket";
        let title = "Ticket";
        let description = "";
        let color = "#5865F2";

        if (choice === 'ticket_mapping') {
            prefix = "🛒-mapping";
            title = "🛒 Commande de Mapping - Nova-Life";
            description = `Bonjour ${interaction.user},\n\nMerci de détailler ton projet :\n1️⃣ Quel type de mapping ou modification souhaites-tu ?\n2️⃣ As-tu des textures personnalisées ou logos à intégrer (ex: carbon fiber) ?`;
            color = "#ffd700";
        } else if (choice === 'ticket_paiement') {
            prefix = "💳-paiement";
            title = "💳 Service de Paiement / Facturation";
            description = `Bonjour ${interaction.user},\n\nPour procéder au paiement de ton mapping :\n• Indique le modèle commandé et le montant convenu.\n• Un vendeur va te transmettre les options de paiement sécurisées du serveur.`;
            color = "#2ecc71";
        } else if (choice === 'ticket_recrutement') {
            prefix = "🛠️-recrutement";
            title = "🛠️ Recrutement - Équipe de Mappeurs";
            description = `Bonjour ${interaction.user},\n\nMerci de présenter ta candidature :\n• Quels sont tes anciens travaux ou portfolios de mapping ?\n• Décris brièvement ton expérience sur Nova-Life: Amboise.`;
            color = "#3498db";
        }

        const ticketName = `${prefix}-${interaction.user.username}`;
        const salonExiste = interaction.guild.channels.cache.find(c => c.name === ticketName.toLowerCase());
        
        if (salonExiste) {
            return interaction.followUp({ content: `❌ Tu as déjà un ticket ouvert dans cette section : ${salonExiste}`, ephemeral: true });
        }

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: CONFIG.categorieTickets,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: CONFIG.roleStaff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: 'Clique sur le bouton rouge pour clore la discussion.' });

            const rowTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Fermer le ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await ticketChannel.send({ content: `${interaction.user} | <@&${CONFIG.roleStaff}>`, embeds: [ticketEmbed], components: [rowTicket] });
            return interaction.followUp({ content: `✅ Ton ticket a été créé : ${ticketChannel}`, ephemeral: true });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: "❌ Impossible de créer le ticket. Vérifie que l'ID de ta catégorie est correct et que j'ai la permission d'y créer des salons.", ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);

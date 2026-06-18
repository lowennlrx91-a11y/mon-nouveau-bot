const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits 
} = require('discord.js');

// Configuration ultra-optimisée des Intents
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
    categorieTickets: "1465393346892795905",   // ID de la catégorie où créer les tickets
    roleStaff: "1465396190395764838"           // ID du rôle Staff/Vendeur pour voir les tickets
};

// ==========================================
// ÉVÉNEMENT : TOUT EST PRÊT (READY)
// ==========================================
client.once('ready', async () => {
    console.log(`✅ Vortex Bot connecté avec succès : ${client.user.tag}`);
    
    // Configuration du statut pro du bot
    client.user.setActivity('Nova-Life: Amboise Mappings', { type: 3 }); // 3 = "Regarde..."

    // Envoi automatique du panel de règlement s'il n'est pas déjà présent
    await initialiserReglement();
});

// ==========================================
// FONCTIONNALITÉ 1 : GÉNÉRATION DU RÈGLEMENT
// ==========================================
async function initialiserReglement() {
    try {
        const channel = await client.channels.fetch(CONFIG.salonReglement);
        if (!channel) return;

        // On vérifie si un message du bot existe déjà pour éviter le spam au reboot
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(m => m.author.id === client.user.id);

        if (!botMessage) {
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('📜 Règlement de la Boutique')
                .setDescription(
                    'Bienvenue sur notre serveur de vente de mappings pour **Nova-Life: Amboise**.\n\n' +
                    'En cliquant sur le bouton ci-dessous, tu acceptes les règles du serveur et de la boutique :\n' +
                    '• Respecter le staff et les autres clients.\n' +
                    '• Aucun remboursement après livraison du mapping.\n' +
                    '• Le partage ou la revente de nos fichiers est strictement interdit.\n\n' +
                    'Clique sur **Accepter** pour accéder à l\'intégralité du serveur !'
                )
                .setFooter({ text: 'Weslé Auto & Mappings • Système de vérification automatisé' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel('Accepter le règlement')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("➡️ Panel de règlement initialisé avec succès !");
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation du règlement :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 2 : CRÉATION DU PANEL TICKETS
// ==========================================
client.on('messageCreate', async (message) => {
    // Si un admin tape !setup-ticket, on génère le panel de commande de mappings
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        // Supprime le message de commande pour garder le salon propre
        await message.delete().catch(() => {});
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📦 Commander un Mapping Nova-Life')
            .setDescription(
                'Tu souhaites obtenir un mapping exclusif pour ton projet, une concession, des routes ou des textures sur-mesure ?\n\n' +
                'Clique sur le bouton ci-dessous pour ouvrir un ticket et discuter directement avec nos mappeurs et vendeurs.'
            )
            .setFooter({ text: 'Weslé Auto & Mappings' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Ouvrir un Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        console.log(`➡️ Panel de ticket créé par ${message.author.tag}`);
    }
});

// ==========================================
// GESTIONNAIRE DES INTERACTIONS (Boutons)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // --- LOGIQUE RÈGLEMENT ---
    if (interaction.customId === 'accept_rules') {
        await interaction.deferReply({ ephemeral: true });

        const role = interaction.guild.roles.cache.get(CONFIG.roleReglement);
        if (!role) return interaction.editReply({ content: "❌ Erreur : Rôle introuvable." });

        if (interaction.member.roles.cache.has(CONFIG.roleReglement)) {
            return interaction.editReply({ content: "ℹ️ Tu as déjà accepté le règlement !" });
        }

        try {
            await interaction.member.roles.add(role);
            return interaction.editReply({ content: "✅ Règlement accepté ! Les salons de la boutique viennent de s'ouvrir. Bienvenue !" });
        } catch (err) {
            console.error(err);
            return interaction.editReply({ content: "❌ Je n'ai pas la permission Discord requise pour te donner le rôle." });
        }
    }

    // --- LOGIQUE TICKET : OUVERTURE ---
    if (interaction.customId === 'open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const ticketName = `🛒-mapping-${interaction.user.username}`;
        
        // Anti-Spam : Vérifie si un ticket porte déjà son nom
        const salonExiste = interaction.guild.channels.cache.find(c => c.name === ticketName.toLowerCase());
        if (salonExiste) {
            return interaction.editReply({ content: `❌ Tu as déjà un ticket ouvert ici : ${salonExiste}` });
        }

        try {
            // Création du salon masqué pour le reste du serveur
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: CONFIG.categorieTickets,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: CONFIG.roleStaff,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#ffd700') // Couleur Or (Business / Vente)
                .setTitle(`🛒 Commande de ${interaction.user.username}`)
                .setDescription(
                    `Bonjour ${interaction.user}, bienvenue dans ton espace de vente privé.\n\n` +
                    '**Pour accélérer ta commande, merci de préciser :**\n' +
                    '1️⃣ Quel mapping ou modification Nova-Life tu souhaites ?\n' +
                    '2️⃣ As-tu des demandes ou textures spécifiques (ex: logos, détails carbon fiber) ?\n\n' +
                    '*Le staff / équipe de vente va s\'occuper de toi d\'ici quelques instants.*'
                )
                .setFooter({ text: 'Pour fermer ce ticket, clique sur le bouton rouge ci-dessous.' });

            const rowTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Fermer le ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await ticketChannel.send({ content: `${interaction.user} | <@&${CONFIG.roleStaff}>`, embeds: [ticketEmbed], components: [rowTicket] });
            return interaction.editReply({ content: `✅ Ton ticket a été créé avec succès : ${ticketChannel}` });

        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: "❌ Impossible de créer le ticket. Vérifie mes permissions de salons." });
        }
    }

    // --- LOGIQUE TICKET : FERMETURE ---
    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Fermeture et nettoyage du ticket dans 5 secondes...' });
        
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (err) {
                console.error("Impossible de supprimer le salon :", err);
            }
        }, 5000);
    }
});

// Connexion sécurisée au bot via Render
client.login(process.env.TOKEN);

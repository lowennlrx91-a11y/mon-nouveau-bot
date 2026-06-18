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

// Configuration ultra-optimisée des Intents (uniquement ce qui est nécessaire)
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
    roleReglement: "1251624647395016734",      // ID du rôle Membre validé
    salonReglement: "1251622359486201948",     // ID du salon Règlement
    categorieTickets: "1251624647395016735",   // ID de la catégorie où créer les tickets
    roleStaff: "1251624647395016736"           // ID du rôle Staff/Vendeur pour voir les tickets
};

// ==========================================
// ÉVÉNEMENT : TOUT EST PRÊT (READY)
// ==========================================
client.once('ready', async () => {
    console.log(`✅ Vortex Bot connecté avec succès : ${client.user.tag}`);
    
    // Configuration du statut du bot pour faire pro
    client.user.setActivity('Nova-Life: Amboise Mappings', { type: 3 }); // 3 = "Regarde..."

    // Envoi automatique des panels s'ils ne sont pas déjà présents
    await initialiserPanels();
});

// ==========================================
// FONCTIONNALITÉ 1 : SYSTÈME DE RÈGLEMENT (DraftBot style optimisé)
// ==========================================
async function initialiserPanels() {
    try {
        const channel = await client.channels.fetch(CONFIG.salonReglement);
        if (!channel) return;

        // On vérifie si un message du bot existe déjà pour éviter les doublons à chaque reboot
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(m => m.author.id === client.user.id);

        if (!botMessage) {
            const embed = new EmbedBuilder()
                .setColor('#2b2d31') // Couleur sombre style Discord Premium
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
            console.log("➡️ Panel de règlement envoyé avec succès !");
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation du règlement :", error);
    }
}

// ==========================================
// GESTIONNAIRE DES INTERACTIONS (Boutons)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // --- LOGIQUE DU RÈGLEMENT ---
    if (interaction.customId === 'accept_rules') {
        await interaction.deferReply({ ephemeral: true }); // Évite le bug des 3 secondes de Discord

        const role = interaction.guild.roles.cache.get(CONFIG.roleReglement);
        if (!role) return interaction.editReply({ content: "❌ Erreur : Rôle introuvable. Contacte un administrateur." });

        if (interaction.member.roles.cache.has(CONFIG.roleReglement)) {
            return interaction.editReply({ content: "ℹ️ Tu as déjà accepté le règlement !" });
        }

        try {
            await interaction.member.roles.add(role);
            return interaction.editReply({ content: "✅ Règlement accepté ! Les salons viennent de s'ouvrir à toi. Bienvenue !" });
        } catch (err) {
            console.error(err);
            return interaction.editReply({ content: "❌ Je n'ai pas les permissions nécessaires pour te donner le rôle." });
        }
    }

    // --- LOGIQUE DU TICKET : CRÉATION ---
    if (interaction.customId === 'open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const ticketName = `🛒-mapping-${interaction.user.username}`;
        
        // Vérification si l'utilisateur a déjà un ticket ouvert (Évite le spam et surcharge de Render)
        const salonExiste = interaction.guild.channels.cache.find(c => c.name === ticketName.toLowerCase());
        if (salonExiste) {
            return interaction.editReply({ content: `❌ Tu as déjà un ticket ouvert ici : ${salonExiste}` });
        }

        try {
            // Création du salon avec permissions ultra-sécurisées
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: CONFIG.categorieTickets,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel], // Tout le monde est masqué
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory], // Le client voit
                    },
                    {
                        id: CONFIG.roleStaff,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory], // Le staff voit
                    }
                ],
            });

            // Embed d'accueil du ticket (fait forte impression)
            const ticketEmbed = new EmbedBuilder()
                .setColor('#ffd700') // Couleur Or pour le côté business/vente
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

    // --- LOGIQUE DU TICKET : FERMETURE ---
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

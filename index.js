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

client.once('ready', async () => {
    console.log(`✅ Vortex Bot connecté avec succès : ${client.user.tag}`);
    client.user.setActivity('Nova-Life: Amboise Mappings', { type: 3 });
    await initialiserReglement();
});

// ==========================================
// FONCTIONNALITÉ 1 : RÈGLEMENT COMPLET
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
                .setTitle('📜 Règlement à lire et à respecter ✅')
                .setDescription(
                    '**🔰 RÈGLES GÉNÉRALES**\n' +
                    '**1️⃣ Respect et courtoisie :** Tout comportement irrespectueux, insultant ou discriminatoire est interdit.\n' +
                    '**2️⃣ Langage approprié :** Restez poli et évitez tout contenu inapproprié (NSFW, politique, religieux, etc.).\n' +
                    '**3️⃣ Confidentialité :** Ne partagez pas d’informations personnelles, que ce soit les vôtres ou celles des autres membres.\n' +
                    '**4️⃣ Publicité et spam :** Toute promotion non autorisée, y compris par message privé, est interdite.\n' +
                    '**5️⃣ Multi-comptes :** L’utilisation de plusieurs comptes pour contourner une sanction est prohibée.\n\n' +
                    '**📐 RÈGLES LIÉES AU GRAPHISME ET AU MAPPING**\n' +
                    '**1️⃣ Commandes et paiements :** Toute commande doit être passée dans les salons prévus à cet effet. Les paiements doivent être effectués avant la livraison.\n' +
                    '**2️⃣ Propriété des créations :** Toute œuvre achetée devient la propriété de l’acheteur, sauf mention contraire du créateur.\n' +
                    '**3️⃣ Aucun plagiat :** Toute copie ou appropriation du travail d’un autre créateur sera sanctionnée.\n\n' +
                    '**🤝 ACHAT, VENTE ET COLLABORATION**\n' +
                    '**1️⃣ Système de paiement :** Les transactions doivent être effectuées via les moyens de paiement acceptés par le serveur.\n' +
                    '**2️⃣ Évitez les litiges :** Une fois un achat validé, aucun remboursement ne sera effectué sauf accord du vendeur.\n' +
                    '**3️⃣ Collaboration et engagement :** Respectez vos engagements lors d’une collaboration et soyez clairs dans vos demandes.\n\n' +
                    '**⚠️ SANCTIONS**\n' +
                    'Tout manquement à ce règlement peut entraîner des sanctions allant d’un avertissement à un bannissement définitif du serveur. L’équipe de modération se réserve le droit d’agir selon la gravité de la situation.\n\n' +
                    '*Nous comptons sur votre sérieux et votre respect des règles pour que ce serveur reste un espace agréable et professionnel.*'
                )
                .setFooter({ text: 'Weslé Auto & Mappings • Cliquez ci-dessous pour valider' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel('Accepter le règlement')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("➡️ Panel de règlement mis à jour envoyé !");
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation du règlement :", error);
    }
}

// ==========================================
// FONCTIONNALITÉ 2 : PANEL TICKETS
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
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
    }
});

// ==========================================
// GESTIONNAIRE DES BOUTONS (Interactions)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // --- BOUTON DU RÈGLEMENT ---
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
            return interaction.editReply({ content: "❌ Je n'ai pas la permission Discord requise pour te donner le rôle. Vérifie que mon rôle est bien au-dessus du rôle à donner." });
        }
    }

    // --- BOUTON OUVERTURE TICKET ---
    if (interaction.customId === 'open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const ticketName = `🛒-mapping-${interaction.user.username}`;
        const salonExiste = interaction.guild.channels.cache.find(c => c.name === ticketName.toLowerCase());
        
        if (salonExiste) {
            return interaction.editReply({ content: `❌ Tu as déjà un ticket ouvert ici : ${salonExiste}` });
        }

        try {
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
                .setColor('#ffd700')
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
            return interaction.editReply({ content: "❌ Impossible de créer le ticket. Vérifie que j'ai bien les permissions de 'Gérer les salons' et 'Voir les salons' dans cette catégorie." });
        }
    }

    // --- BOUTON FERMETURE TICKET ---
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

client.login(process.env.TOKEN);

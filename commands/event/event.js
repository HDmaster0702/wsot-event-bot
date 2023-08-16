const client = require("../../index.js");
const { mission_role, training_role, supervisor_role, feedback_role } = require("../../roles.json")
const { SlashCommandBuilder } = require("discord.js")

const eventCmd = new SlashCommandBuilder()
    .setName("event")
    .setDescription("Események kezelése")
    .setDMPermission(false)
            .addSubcommand(cmd => 
                cmd.setName('create')
                .setDescription('Esemény létrehozása')
                .addStringOption(option => 
                    option.setName("típus")
                    .setDescription("Esemény típusa")
                    .setRequired(true)
                    .addChoices(
                        { name: "mission", value: "mission" },
                        { name: "training", value: "training" }
                    )
                )
                .addStringOption(option => 
                    option.setMinLength(6)
                    .setMaxLength(128)
                    .setName("név")
                    .setDescription("Esemény fantázia neve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(2023)
                    .setMaxValue(2040)
                    .setName("év")
                    .setDescription("Esemény megrendezésének éve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(12)
                    .setName("hónap")
                    .setDescription("Esemény megrendezésének hónapja")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(31)
                    .setName("nap")
                    .setDescription("Esemény megrendezésének éve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(24)
                    .setName("óra")
                    .setDescription("Esemény megrendezésének órája")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(0)
                    .setMaxValue(59)
                    .setName("perc")
                    .setDescription("Esemény megrendezésének perce")
                    .setRequired(true)
                )
                .addAttachmentOption(option => 
                    option.setName("sitrep")
                    .setDescription("SITREP az eseményhez")
                )
                .addAttachmentOption(option => 
                    option.setName("borítókép")
                    .setDescription("Borítókép, ami bekerül az esemény alá")
                )
                .addAttachmentOption(option => 
                    option.setName("modlista")
                    .setDescription("Modlista, amivel az eseményen részt lehet venni")
                )
            )
            .addSubcommand(cmd => 
                cmd.setName('delete')
                .setDescription('Esemény törlése')
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setName("azonosító")
                    .setDescription("Esemény azonosítója")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd => 
                cmd.setName('edit')
                .setDescription('Esemény szerkesztése')
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setName("azonosító")
                    .setDescription("Esemény azonosítója")
                    .setRequired(true)
                )
                .addStringOption(option => 
                    option.setMinLength(6)
                    .setMaxLength(128)
                    .setName("név")
                    .setDescription("Esemény fantázia neve")
                )
                .addNumberOption(option => 
                    option.setMinValue(2023)
                    .setMaxValue(2040)
                    .setName("év")
                    .setDescription("Esemény megrendezésének éve")
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(12)
                    .setName("hónap")
                    .setDescription("Esemény megrendezésének hónapja")
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(31)
                    .setName("nap")
                    .setDescription("Esemény megrendezésének éve")
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(24)
                    .setName("óra")
                    .setDescription("Esemény megrendezésének órája")
                )
                .addNumberOption(option => 
                    option.setMinValue(0)
                    .setMaxValue(59)
                    .setName("perc")
                    .setDescription("Esemény megrendezésének perce")
                )
                .addAttachmentOption(option => 
                    option.setName("sitrep")
                    .setDescription("SITREP az eseményhez")
                )
                .addAttachmentOption(option => 
                    option.setName("borítókép")
                    .setDescription("Borítókép, ami bekerül az esemény alá")
                )
                .addAttachmentOption(option => 
                    option.setName("modlista")
                    .setDescription("Modlista, amivel az eseményen részt lehet venni")
                )
            )
            .addSubcommand(cmd => 
                cmd.setName("roles")
                .setDescription("Beosztás létrehozása/módosítása")
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setName("azonosító")
                    .setDescription("Esemény azonosítója")
                    .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName("beosztás-url")
                    .setDescription("Válaszd ezt, amennyiben a beosztáshoz linket kell megadnod")
                    .setRequired(true)
                )
            )

async function exec(ec, interaction) {
    if (!ec) { interaction.reply({ content: "A bot még nem inicializálódott. Kérlek várj pár másodpercet és próbáld újra!", ephemeral: true}) }
    var member = interaction.member
    switch(interaction.options.getSubcommand()) {
        case "create":
            if (member.roles.cache.find(r => r.id === ((interaction.options.getString("típus") === "mission") ? mission_role:training_role) || supervisor_role )) { 
                ec.addEvent(interaction.options.getString("típus"), interaction.options.getString("név"), [interaction.options.getNumber("év"), interaction.options.getNumber("hónap"), interaction.options.getNumber("nap"), interaction.options.getNumber("óra"), interaction.options.getNumber("perc")], interaction.options.getAttachment("sitrep"), interaction.options.getAttachment("borítókép"), interaction.options.getAttachment("modlista"), interaction.member)
                interaction.reply({ content: "Esemény létrehozva.", ephemeral: true})
            } else { interaction.reply({ content: "Nincs jogod használni ezt a parancsot!", ephemeral: true}) }
        break

        case "edit":
            if (!ec.events[interaction.options.getNumber("azonosító")]) { interaction.reply({ content: "Nem létezik esemény ezzel az azonosítóval!", ephemeral: true}); return }
            if (member.roles.cache.find(r => r.id === ((interaction.options.getString("típus") === "mission") ? mission_role:training_role) || supervisor_role)) {
                ec.modifyEvent(ec.events[interaction.options.getNumber("azonosító")], interaction.options.getString("név"), [interaction.options.getNumber("év"), interaction.options.getNumber("hónap"), interaction.options.getNumber("nap"), interaction.options.getNumber("óra"), interaction.options.getNumber("perc")], interaction.options.getAttachment("sitrep"), interaction.options.getAttachment("borítókép"), interaction.options.getAttachment("modlista"))
                interaction.reply({ content: "Esemény módosítva.", ephemeral: true})
            } else { interaction.reply({ content: "Nincs jogod használni ezt a parancsot!", ephemeral: true}) }
        break

        case "delete":
            if (!ec.events[interaction.options.getNumber("azonosító")]) { interaction.reply({ content: "Nem létezik esemény ezzel az azonosítóval!", ephemeral: true}); return }
            if (member.roles.cache.find(r => (r.id === supervisor_role) || (ec.events[interaction.options.getNumber("azonosító")].creator.id === interaction.member.id))) {
                ec.deleteEvent(ec.events[interaction.options.getNumber("azonosító")], true)
                interaction.reply({ content: "Esemény törölve.", ephemeral: true})
            } else { interaction.reply({ content: "Nincs jogod használni ezt a parancsot!", ephemeral: true}) }
        break

        case "roles":
            if (!ec.events[interaction.options.getNumber("azonosító")]) { interaction.reply({ content: "Nem létezik esemény ezzel az azonosítóval!", ephemeral: true}); return }
            if (member.roles.cache.find(r => (r.id === supervisor_role) || (ec.events[interaction.options.getNumber("azonosító")].creator.id === interaction.member.id))) {
                ec.setRoles(ec.events[interaction.options.getNumber("azonosító")], interaction.options.getString("beosztás-url"))
                interaction.reply({ content: "Beosztás sikeresen létrehozva/módosítva.", ephemeral: true})
            } else { interaction.reply({ content: "Nincs jogod használni ezt a parancsot!", ephemeral: true}) }
        break
    }
}

module.exports = {
    data: eventCmd,
    execute: exec
}
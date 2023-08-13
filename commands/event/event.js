const client = require("../../index.js");
//const {mission_role} = require("../../permission.json")
const mission_role = "1138808521757048932"
const { SlashCommandBuilder } = require("discord.js")

const eventCmd = new SlashCommandBuilder()
    .setName("event")
    .setDescription("Események kezelése")
    .setDMPermission(false)
    .addSubcommandGroup(sgroup => 
        sgroup
            .setName("mission")
            .setDescription("Küldetések kezelése")
            .addSubcommand(cmd => 
                cmd.setName('create')
                .setDescription('Küldetés létrehozása')
                .addStringOption(option => 
                    option.setMinLength(6)
                    .setMaxLength(128)
                    .setName("név")
                    .setDescription("Küldetés fantázia neve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(2023)
                    .setMaxValue(2040)
                    .setName("év")
                    .setDescription("Küldetés megrendezésének éve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(12)
                    .setName("hónap")
                    .setDescription("Küldetés megrendezésének hónapja")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(31)
                    .setName("nap")
                    .setDescription("Küldetés megrendezésének éve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(24)
                    .setName("óra")
                    .setDescription("Küldetés megrendezésének órája")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(0)
                    .setMaxValue(59)
                    .setName("perc")
                    .setDescription("Küldetés megrendezésének perce")
                    .setRequired(true)
                )
                .addAttachmentOption(option => 
                    option.setName("sitrep")
                    .setDescription("SITREP a küldetéshez")
                )
            )
            .addSubcommand(cmd => 
                cmd.setName('delete')
                .setDescription('Küldetés törlése')
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setName("azonosító")
                    .setDescription("Küldetés azonosítója")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd => 
                cmd.setName('postpone')
                .setDescription('Küldetés elhalasztása')
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setName("azonosító")
                    .setDescription("Küldetés azonosítója")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(2023)
                    .setMaxValue(2040)
                    .setName("év")
                    .setDescription("Küldetés megrendezésének éve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(12)
                    .setName("hónap")
                    .setDescription("Küldetés megrendezésének hónapja")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(31)
                    .setName("nap")
                    .setDescription("Küldetés megrendezésének éve")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(24)
                    .setName("óra")
                    .setDescription("Küldetés megrendezésének órája")
                    .setRequired(true)
                )
                .addNumberOption(option => 
                    option.setMinValue(0)
                    .setMaxValue(59)
                    .setName("perc")
                    .setDescription("Küldetés megrendezésének perce")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd => 
                cmd.setName('edit')
                .setDescription('Küldetés szerkesztése')
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setName("azonosító")
                    .setDescription("Küldetés azonosítója")
                    .setRequired(true)
                )
                .addStringOption(option => 
                    option.setMinLength(6)
                    .setMaxLength(128)
                    .setName("név")
                    .setDescription("Küldetés fantázia neve")
                    .setRequired(false)
                )
                .addNumberOption(option => 
                    option.setMinValue(2023)
                    .setMaxValue(2040)
                    .setName("év")
                    .setDescription("Küldetés megrendezésének éve")
                    .setRequired(false)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(12)
                    .setName("hónap")
                    .setDescription("Küldetés megrendezésének hónapja")
                    .setRequired(false)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(31)
                    .setName("nap")
                    .setDescription("Küldetés megrendezésének éve")
                    .setRequired(false)
                )
                .addNumberOption(option => 
                    option.setMinValue(1)
                    .setMaxValue(24)
                    .setName("óra")
                    .setDescription("Küldetés megrendezésének órája")
                    .setRequired(false)
                )
                .addNumberOption(option => 
                    option.setMinValue(0)
                    .setMaxValue(59)
                    .setName("perc")
                    .setDescription("Küldetés megrendezésének perce")
                    .setRequired(false)
                )
                .addAttachmentOption(option => 
                    option.setName("sitrep")
                    .setDescription("SITREP a küldetéshez")
                )
            )
    )

async function exec(ec, interaction) {
    if (interaction.options.getSubcommandGroup() === "mission") {
        if (interaction.options.getSubcommand() === "create") {
            var member = interaction.member
            if (member.roles.cache.find(r => r.id === mission_role)) { 
                ec.addEvent("mission", interaction.options.getString("név"), [interaction.options.getNumber("év"), interaction.options.getNumber("hónap"), interaction.options.getNumber("nap"), interaction.options.getNumber("óra"), interaction.options.getNumber("perc")], interaction.options.getAttachment("sitrep"), interaction.member)
            }
        } else if(interaction.options.getSubcommand() === "edit") {
            var member = interaction.member
            if (member.roles.cache.find(r => r.id === mission_role)) {
                ec.modifyEvent(ec.events[parseInt(interaction.options.getNumber("azonositó"))], interaction.options.getString("név"), [interaction.options.getNumber("év"), interaction.options.getNumber("hónap"), interaction.options.getNumber("nap"), interaction.options.getNumber("óra"), interaction.options.getNumber("perc")], interaction.options.getAttachment("sitrep"))
            }
        }
    }
}

module.exports = {
    data: eventCmd,
    execute: exec
}
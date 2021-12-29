registerPlugin({
    name: "Group Assigner By Command",
    version: "0.3",
    description: "This script assigns specified group(s), to specified client, with your chosen command",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: [],
    vars: [{
            name: "gABC_command",
            type: "string",
            title: "Your command, that you will add groups with:",
            placeholder: "!group",
            default: "!group"
        },
        {
            name: "gABC_groups",
            type: "strings",
            title: "Groups ID list, that can use the command (don't set any group, if you want to allow it for everybody):"
        },
        {
            name: "gABC_blockedGroupIDs",
            type: "strings",
            title: "List of group IDs, that can not be assigned or removed (they are blocked):"
        },
        {
            name: "gABC_immuneGroupIDs",
            type: "strings",
            title: "List of group IDs, that if client have, he is immune to this script:"
        },
        {
            name: "gABC_immuneUIDs",
            type: "strings",
            title: "List of unique identities, that if belongs to a specific client, he is immune to this script:"
        }, {
            name: "gABC_blockSelf",
            type: "checkbox",
            title: "Block self adding/removing groups? [CHECKED = true]",
            default: true
        }, {
            name: 'showTranslation',
            title: 'Show translation (if you want to disable the message, you can put this text inside: DISABLED)',
            type: 'checkbox'
        }, {
            name: "message_incorrectSyntax",
            type: "string",
            title: "MESSAGE: Incorrect syntax!",
            default: "Incorrect syntax!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }, {
            name: "message_notFound",
            type: "string",
            title: "MESSAGE: Some of the groups you are trying to assign are not existing!",
            default: "Some of the groups you are trying to assign are not existing!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }, {
            name: "message_notAllowed",
            type: "string",
            title: "MESSAGE: Some of the groups you are trying to assign are blocked!",
            default: "Some of the groups you are trying to assign are blocked!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }, {
            name: "message_noPerm",
            type: "string",
            title: "MESSAGE: No permission!",
            default: "No permission!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }, {
            name: "message_noTarget",
            type: "string",
            title: "MESSAGE: Target client does not exist!",
            default: "Target client does not exist!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }, {
            name: "message_yourself",
            type: "string",
            title: "MESSAGE: You can not target yourself!",
            default: "You can not target yourself!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }, {
            name: "message_targetImmune",
            type: "string",
            title: "MESSAGE: Target is immune!",
            default: "Target is immune!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'showTranslation',
                value: 1,
            }]
        }
    ],
    voiceCommands: []
}, (_, config, meta) => {

    const backend = require("backend");
    const engine = require("engine");
    const event = require("event");

    event.on("chat", ({ client, text }) => {
        let message = text.match(/'[^']*'|"[^"]*"|\S+/g) || [];
        for (let i in message)
            if (/\s/.test(message[i]) && typeof message[i] == "string")
                message[i] = message[i].replace(new RegExp('\"', 'g'), "");

        if (client.isSelf()) return; // Do not check bot's messages
        if (!checkRights(client)) return msg(client, config.message_noPerm); // Whether he has or doesn't have rights to do this

        if (message[0].toLowerCase() == config.gABC_command) {
            if (message.length >= 3) {
                let targetClient = backend.getClientByName(message[1]); // Get the target

                if (!targetClient) return msg(client, config.message_noTarget); // Does the client exist?
                if (targetClient.uid() === client.uid() && config.gABC_blockSelf == true) return msg(client, config.message_yourself); // Can not target yourself

                let isImmuneByGroups = arrAnySameItem(targetClient.getServerGroups().map(g => g.id()), config.gABC_immuneGroupIDs);
                let isImmuneByUIDs = (config.gABC_immuneUIDs || []).includes(targetClient.uid());
                if (isImmuneByGroups || isImmuneByUIDs) return msg(client, config.message_targetImmune); // Immune target

                let groupsList = message.slice(2); // Remove first two items (the command and the client)

                let notFound = false;
                let notAllowed = false;

                groupsList.forEach(group => {
                    let theGroup = getServerGroupByName(group);

                    if (theGroup)
                        if (!(config.gABC_blockedGroupIDs || []).includes(theGroup.id())) {
                            if (hasServerGroupWithName(targetClient, theGroup.name()))
                                targetClient.removeFromServerGroup(theGroup.id());
                            else
                                targetClient.addToServerGroup(theGroup.id());
                        } else notAllowed = true;
                    else notFound = true;
                });

                if (notFound) msg(client, config.message_notFound);
                if (notAllowed) msg(client, config.message_notAllowed);
            } else return msg(client, config.message_incorrectSyntax);
        }
    });

    function getServerGroupByName(groupName) {
        return backend.getServerGroups().find(group => group.name() === groupName);
    }

    function hasServerGroupWithName(client, name) {
        return client.getServerGroups().some(group => group.name() === name);
    }

    function checkRights(client) {
        if (!config.gABC_groups) return true;
        let clientGroups = client.getServerGroups().map(g => g.id());
        return arrAnySameItem(clientGroups, config.gABC_groups);
    }

    function arrAnySameItem(arr1, arr2) {
        return (arr2 || []).some(item => (arr1 || []).includes(item));
    }

    function msg(client, msg) {
        if (msg.toLowerCase() != "disabled") client.chat(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log("\n[Script] \"" + meta.name + "\" [Version] \"" + meta.version + "\" [Author] \"" + meta.author + "\"");
});
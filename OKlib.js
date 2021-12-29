registerPlugin({
    name: 'OKlib',
    engine: '>= 0.13.37',
    version: '1.0.8',
    autorun: true,
    description: 'A lib that is OK.',
    author: 'Tuetchen || Smorrebrod || Cedrik <cedrik.paetz@gmail.com> && Diesmon || Dimos <dontmindme12@web.de>',
    vars: [{
        name: 'logLevel',
        title: 'Sets a global debug log level for all scripts that use this lib. The logs will be displayed in the instance log.',
        type: 'select',
        options: ['1 - Critical', '2 - Error', '3 - Missing items', '4 - Debug', '5 - Ludicrous']
    }]

}, function (sinusbot, config) {

    var event = require('event');
    var engine = require('engine');
    var store = require('store');
    var backend = require('backend');
    var media = require('media');
    var audio = require('audio');
    var format = require('format');
    var helper = require('helpers');

    engine.notify('OKlib loaded');
    var backendEngine = engine.getBackend();
    var activeBotInstances = [];

    var version = '1.0.8';
    var libLogLevel = 1;
    try {
        libLogLevel = config.logLevel;
    } catch (err) {

    }

    if (backend.isConnected()) {
        var currentInstances = store.get('activeBotInstances');
        if (!currentInstances) {
            currentInstances = [];
        }
        log("Registering as active Bot " + printObject(backend.getBotClient()), 5);
        currentInstances.push(backend.getBotClient().uid());
        currentInstances = arrayCreateSet(currentInstances);
        store.set('activeBotInstances', currentInstances);
    }

    event.on('connect', function () {
        var currentInstances = store.get('activeBotInstances');
        if (!currentInstances) {
            currentInstances = [];
        }
        log("Registering as active Bot " + printObject(backend.getBotClient()), 5);
        currentInstances.push(backend.getBotClient().uid());
        currentInstances = arrayCreateSet(currentInstances);
        store.set('activeBotInstances', currentInstances);
    });
    event.on('chat', function (ev) {
        if (ev.text == "!help" || ev.text == "!info") {
            ev.client.chat("This bot uses the [url=https://forum.sinusbot.com/resources/oklib.325/]OKlib[/url], which is a libary for basic script functions. The full documentation can be found [url=http://server-n2.de/OKlib/external]here[/url]");
        }
    });

    /**
     * Checks the current version of OKlib
     * @param  {String} wantedVersion The OKlib version your script needs. Provided for example as "1.0.0"
     * @return {Boolean}  Returns true if the installed version is newer
     */
    function checkVersion(wantedVersion) {
        return version >= wantedVersion;
    }

    /**
     * TODO: All
     */
    function checkForUpdates() {
        log('Not Implemented Yet', 2);
    }

    /**
     * Logs messages to the Sinusbot Webinterface instance console, depending on the set log level in the config
     * @param  {String} message  The String to print
     * @param  {Integer} logLevel log level of the message to check with the set log level
     */
    function log(message, logLevel) {
        if (logLevel - 1 <= libLogLevel) {
            engine.log(message);
        }
    }

    /**
     * Provides the active Bot instances running on the Sinusbot Installation [Important: All instances need to run the script]
     * @return {Client[]} Returns all found Bot clients in a Array
     */
    function getActiveBotInstances() {
        var currentInstances = store.get('activeBotInstances');
        result = [];
        newStore = [];
        for (var i = 0; i < currentInstances.length; i++) {
            var currentClient = backend.getClientByUniqueID(currentInstances[i]);
            if (currentClient) {
                log("getActiveBotInstances: Active Bot " + printObject(currentClient) + " found", 5);
                newStore.push(currentInstances[i]);
                result.push(currentClient);
            } else {
                log("getActiveBotInstances: Offline Bot " + currentInstances[i] + " removed", 4);
            }
        }
        store.set('activeBotInstances', newStore);
        return result;
    }

    /*
        Channel
    */

    /**
     * Returns the ID and the Name of a Channel as String
     * @param  {Channel} channel The Channel
     * @return {String}         String of Channel ID and Name
     */
    function channelToString(channel) {
        return ("[" + channel.id() + ": " + channel.name() + "]");
    }

    /**
     * Returns a array of Channels which meet the provided criterias
     * @param  {String} attribute The Attribute to search for. E.g. 'name' or 'id'
     * @param  {String} value     The Value that should get compared with the Attribute
     * @param  {Channel[]} channels  Optional: The Channel Searchpool. If not provided all Channels will get used [Not Optional if compare gets provided]
     * @param  {Function} compare   Optional: A Function for how to compare the Value with the Attribute. If not provided Value and Attribute will get checked for equality
     * @return {Channel[]}           The Channels that matches the criterias
     */
    function channelGetChannels(attribute, value, channels, compare) {
        if (!channels) {
            log("channelGetChannels: Using all Channels", 5);
            channels = backend.getChannels();
        } else {
            channels = arrayCreateArray(channels);
            log("channelGetChannels: Using Channels " + printObject(channels), 5);
        }
        var result = [];
        for (var i = 0; i < channels.length; i++) {
            if (objectFunctionEqualsElement(channels[i], attribute, value, compare)) {
                result.push(channels[i]);
                log("channelGetChannels: Found Channel " + printObject(channels[i]), 5);
            }
        }
        return result;
    }

    /**
     * Returns all Subchannels of a given Channel
     * @param  {Channel} parentChannel The Channel or channelID of the Channel to return the Subchannels of
     * @param  {Channel[]} channels  Optional: The Channel Searchpool. If not provided all Channels will get used
     * @return {Channel[]}               Array of all Subchannels from the given Channel
     */
    function channelGetSubchannels(parentChannel, channels) {
        var parentChannelID = (isNumber(parentChannel)) ? parentChannel : parentChannel.id();
        if (!channels) {
            log("channelGetSubchannels: Using all Channels", 5);
            channels = backend.getChannels();
        } else {
            channels = arrayCreateArray(channels);
            log("channelGetSubchannels: Using Channels " + printObject(channels), 5);
        }
        var result = [];
        for (var i = 0; i < channels.length; i++) {
            var curParentChannel = channels[i].parent();
            if (curParentChannel && equal(curParentChannel.id(), parentChannelID)) {
                result.push(channels[i]);
                log("channelGetSubchannels: Found Channel " + printObject(channels[i]), 5);
            }
        }
        return result;
    }

    /*
        Client
    */

    /**
     * Returns the ID, UID and Nick of a Client as a String
     * @param  {Client} client
     * @return {String}
     */
    function clientToString(client) {
        return ("[" + client.id() + "/" + client.uid() + ": " + client.nick() + "]");
    }

    /**
     * Returns the ID, UID and Nick of a Client as a TeamSpeak3 useable Client-URL String
     * @param  {Client} client
     * @return {String}
     */
    function clientToURLString(client) {
        return ("[URL=client://" + client.id() + "/" + client.uid() + "]" + client.nick() + "[/URL]");
    }

    /**
     * Parses a TS3-CLient URL string into a Client Object
     * @param  {String} url THe URL string to parse
     * @return {Object}     Returns a Client Object or undefined if nothing was found
     */
    function clientUrlToClient(url) {
        if (typeof url !== "string") {
            return undefined;
        }
        var match = url.match(/\[url=client:\/\/(\d+)\/([\w\d\/\+]{27}=)~?(.*)\](.*)?\[\/url\]/i);
        if (!match) {
            return undefined;
        }
        var client = backend.getClientByID(match[1]);
        if (client && client.uid() == match[2]) {
            return client;
        }
        client = backend.getClientByUID(match[2]);
        if (client) {
            return client;
        }
        return undefined;
    }

    /**
     * Compares two Clients against each other and decied if they are the same Client or not (Equal)
     * @param  {Client} firstClient
     * @param  {Client} secondClient
     * @return {Boolean}              True or False, depending if the Clients are equal or not.
     */
    function equalClientObjects(firstClient, secondClient) {
        return firstClient.equals(secondClient);
    }

    /**
     * Filters a Client-array by another Client-array
     * @param  {Client[]} clients The Clients
     * @param  {Client[]} array   The Clients to filter out
     * @return {Client[]}         The new Clients
     */
    function clientFilterByClients(clients, array) {
        return arrayRemoveElements(clients, array, equalClientObjects);
    }

    /**
     * Parses Client Objects into String UIDs and returns a Array of UIDs
     * @param  {Client[]} clients The Clients to parse
     * @return {String[]}         Array of parsed UID Strings
     */
    function clientParseUIDs(clients) {
        clients = arrayCreateArray(clients);
        if (clients.length == 0) {
            log("clientParseUIDs: Provided no Clients to parse", 3);
            return;
        }
        var result = [];
        for (var i = 0; i < clients.length; i++) {
            result.push(clients[i].uid());
            log("clientsParseUIDs: Resolved UID '" + clients[i].uid() + "'", 5);
        }
        return result;
    }

    /**
     * Parses UIDs to Client Object. Works only for UID owners that are currently online.
     * @param  {String[]} UIDs An Array of UID Strings
     * @return {Client[]}    Returns an Array of parsed Client Objects
     */
    function clientParseClients(UIDs) {
        UIDs = arrayCreateArray(UIDs);
        if (UIDs.length == 0) {
            log("clientParseClients: Provided no UIDs to parse", 3);
            return;
        }
        var result = [];
        for (var i = 0; i < UIDs.length; i++) {
            var client = backend.getClientByUID(UIDs[i]);
            if (client) {
                result.push(client);
                log("clientsParseClient: Resolved UID '" + UIDs[i] + "' to '" + printObject(client) + "'", 5);
            } else {
                log("clientsParseClient: A client with the UID '" + UIDs[i] + "' could not be found on the server", 4);
            }
        }
        return result;
    }

    /**
     * Searches for a Client by the provided String and returns the matches.
     * @param  {String} stringToParse String to search for
     * @param  {Boolean} partMatch     Optional: Flag for using Part matching. If not provided Attribute and Value will be checked for equality (==)[Not optional if the Case Sensitive flag was set]
     * @param  {Boolean} caseSensitive Optional: Flag for using Case Sensitive search. If not provided Cases will be ignored [Not Optional if the Client Searchpool got provided]
     * @param  {Client[]} clients       Optional: The Client Searchpool. If not provided all clients will get used
     * @return {Client[]}               Returns a Array with al lfound client objects. Empty if nothing was found
     */
    function clientSearch(stringToParse, partMatch, caseSensitive, clients) {
        if (!clients) {
            log("clientSearch: Using all Clients", 5);
            clients = backend.getClients();
        } else {
            clients = arrayCreateArray(clients);
            log("clientSearch: Using Clients " + printObject(clients), 5);
        }
        var result = [];
        if (!caseSensitive) {
            log("clientSearch: Ignore Case", 5);
            stringToParse = stringToParse.toLowerCase();
        } else {
            log("clientSearch: Case Sensitive Search", 5);
        }
        var compare = equal;
        if (partMatch) {
            log("clientSearch: Using contains as comparator", 5);
            compare = contains;
        } else {
            log("clientSearch: Using equal as comparator", 5);
        }
        for (var i = 0; i < clients.length; i++) {
            clientName = clients[i].name();
            if (!caseSensitive) {
                clientName = clientName.toLowerCase();
            }
            if (compare(clientName, stringToParse)) {
                result.push(clients[i]);
                log("clientSearch: Found a part match between '" + stringToParse + "' and " + printObject(clients[i]), 5);
            } else if (clients[i].uid() == stringToParse) {
                result.push(clients[i]);
                log("clientSearch: Found a UID match between '" + stringToParse + "' and " + printObject(clients[i]), 5);
            } else if (clients[i].id() == stringToParse) {
                result.push(clients[i]);
                log("clientSearch: Found a ID match between '" + stringToParse + "' and " + printObject(clients[i]), 5);
            }
        }
        log("clientSearch: Found '" + result.length + "' matching clients", 4);
        return result;
    }

    /**
     * Returns a Array of Clients which meet the provided criterias
     * @param  {String} attribute String of the Attribute to check for
     * @param  {String} value     The Value the Attribute should have
     * @param  {Client[]} clients   A Client Searchpool
     * @param  {Function} compare  A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Client[]}           The matching Clients
     */
    function clientGetClients(attribute, value, clients, compare) {
        if (!clients) {
            log("clientGetClients: Using all Clients", 5);
            clients = backend.getClients();
        } else {
            clients = arrayCreateArray(clients);
            log("clientGetClients: Using Clients " + printObject(clients), 5);
        }
        var result = [];
        for (var i = 0; i < clients.length; i++) {
            if (objectFunctionEqualsElement(clients[i], attribute, value, compare)) {
                log("clientGetClients: Found Client " + printObject(clients[i]), 5);
                result.push(clients[i]);
            }
        }
        return result;
    }

    /**
     * Checks if a Client is the Member of all Server Groups.
     *
     * @param {Client} client     The tested Client as a Client Object.
     * @param {ServerGroup[] | Integer[]}     checkGroups The Groups that should be checked as an Array of GroupIDs.
     * @returns {Boolean}         True if the Client is in all Groups, else False.
     **/
    function clientServerGroupsIsMemberOfAll(client, checkGroups) {
        checkGroups = serverGroupParseIDs(checkGroups);
        var serverGroups = serverGroupParseIDs(client.getServerGroups());
        return arrayContainsAll(serverGroups, checkGroups);
    }

    /**
     * Checks if a Client is the Member of one of the Server Groups.
     *
     * @param {Client} client The tested Client as a Client Object.
     * @param {ServerGroup[] | Integer[]} checkGroups The Groups that should be checked as an Array of GroupIDs.
     * @returns {Boolean} True if the Client is in one Group, else False.
     **/
    function clientServerGroupsIsMemberOfOne(client, checkGroups) {
        checkGroups = serverGroupParseIDs(checkGroups);
        var serverGroups = serverGroupParseIDs(client.getServerGroups());
        return arrayContainsOne(serverGroups, checkGroups);
    }

    /**
     * Checks if a Client is the Member of a Server Group.
     *
     * @param {Client} client The tested Client as a Client Object.
     * @param {ServerGroup | Integer} checkGroup The GroupID of the Group that should be checked.
     * @returns {Boolean} True if the Client is Member of the Server Group, else False.
     **/
    function clientServerGroupsIsMemberOf(client, checkGroup) {
        if (!checkGroup) {
            log("clientServerGroupsIsMemberOf: No ServerGroup was given!", 3);
            return false;
        }
        if (!isNumber(checkGroup)) {
            log("clientServerGroupsIsMemberOf: Resolved the servergroup '" + printObject(checkGroup) + "' to the ID '" + checkGroup.id() + "'", 5);
            checkGroup = checkGroup.id();
        }
        var serverGroups = serverGroupParseIDs(client.getServerGroups());
        return arrayContainsElement(serverGroups, checkGroup);
    }

    /**
     * [clientServerGroupAddToGroups description]
     * @param  {Client} client Client to add ServerGroups to
     * @param  {ServerGroup[] | Integer[]} groups The ServerGroups or groupIDs to add
     */
    function clientServerGroupAddToGroups(client, groups) {
        groups = arrayCreateArray(groups);
        if (groups.length == 0) {
            log("clientServerGroupAddToGroups: Provided no Group to add", 3);
            return;
        }
        for (var i = 0; i < groups.length; i++) {
            if (!clientServerGroupsIsMemberOf(client, groups[i])) {
                client.addToServerGroup(groups[i]);
                log("clientServerGroupAddToGroups: Client '" + printObject(client) + "' was added to the servergroup " + printObject(groups[i]), 5);
            } else {
                log("clientServerGroupAddToGroups: Client '" + printObject(client) + "' already has the servergroup " + printObject(groups[i]), 4);
            }
        }
    }

    /**
     * Removes the Clients from the given ServerGroups
     * @param  {Client} client    The Client to remove ServerGroups from
     * @param  {ServerGroup[] | Integer[]} groups The ServerGroups or groupIDs that should be removed from the Client
     */
    function clientServerGroupRemoveFromGroups(client, groups) {
        groups = arrayCreateArray(groups);
        if (groups.length == 0) {
            log("clientServerGroupAddToGroups: Provided no group to remove", 3);
            return;
        }
        for (var i = 0; i < groups.length; i++) {
            if (clientServerGroupsIsMemberOf(client, groups[i])) {
                client.removeFromServerGroup(groups[i]);
                log("clientServerGroupRemoveFromGroups: Client '" + printObject(client) + "' was removed from the servergroup " + printObject(groups[i]), 5);
            } else {
                log("clientServerGroupRemoveFromGroups: Client '" + printObject(client) + "' did not had the group " + printObject(groups[i]), 4);
            }
        }
    }

    /*
        Strings
    */

    /**
     * Checks if a string is a valid UID
     * @param  {String} string String to check for UID
     * @return {Boolean}        Retursn ture or false depending if the String matches a UID or not
     */
    function stringMatchUID(string) {
        if (backendEngine == "ts3") {
            return string.match(/(^[\w\d\/\+]{27}=$)/g);
        }
        return false;
    }

    /*
        Group
    */

    /**
     * Returns a String Representation of a Group
     * @param  {Group} group
     * @return {String}    A String Representation of the given Group
     */
    function groupToString(group) {
        return ("[" + group.id() + ": " + group.name() + "]");
    }

    /**
     * Parses the groupIDs from a given Array of ServerGroups
     * @param  {ServerGroup[]} serverGroups
     * @return {Integer[]} Returns an Array containing the parsed groupIDs
     */
    function serverGroupParseIDs(serverGroups) {
        serverGroups = arrayCreateArray(serverGroups);
        var result = [];
        for (var i = 0; i < serverGroups.length; i++) {
            if (isNumber(serverGroups[0])) {
                result.push(serverGroups[i]);
            } else {
                result.push(serverGroups[i].id());
                log("serverGroupParseIDs: Resolved the servergroup '" + printObject(serverGroups[i]) + "' to the ID '" + serverGroups[i].id() + "'", 5);
            }
        }
        return result;
    }

    /**
     * Parses the ServerGroups from a given Array of groupIDs
     * @param  {Integer[]} groupIDs
     * @return {ServerGroup[]} Returns an Array containing the parsed ServerGroups
     */
    function serverGroupParseGroups(groupIDs) {
        groupIDs = arrayCreateArray(groupIDs);
        var result = [];
        for (var i = 0; i < groupIDs.length; i++) {
            if (!isNumber(groupIDs[i])) {
                result.push(groupIDs[i]);
            } else {
                var group = backend.getServerGroupByID(groupIDs[i]);
                if (group) {
                    result.push(group);
                    log("serverGroupParseGroups: Resolved the ID '" + groupIDs[i] + "' to the servergroup " + printObject(group), 5);
                } else {
                    log("serverGroupParseGroups: A servergroup with the ID '" + groupIDs[i] + "' was not found on the server", 2);
                }
            }
        }
        return result;
    }

    /*
        User
    */

    /**
     * Returns a String Representation of a User
     * @param  {User} user
     * @return {String}    A String Representation of the given User
     */
    function userToString(user) {
        return ("[" + user.id() + ": " + user.name() + "]");
    }

    /**
     * Checks if the Sinusbot User has the required Sinusbot Privileges
     * @param  {User} user A Sinusbot User
     * @param  {Integer} privileges The numerical value of the required Privileges
     * @return {Boolean} Returns true if the Sinusbot User has the required Privileges
     */
    function userHasPrivileges(user, privileges) {
        var userPriv = user.privileges();
        if ((userPriv & privileges) == privileges) {
            return true;
        }
        return false;
    }

    /**
     * Retrieves the Clients Sinusbot Privileges
     * @param  {Client} client A Teamspeak Client
     * @return {Integer}  Returns the Privileges as a numerical value
     */
    function userGetClientPrivileges(client) {
        var users = engine.getUsers();
        var privileges = 0;
        for (var i = 0; i < users.length; i++) {
            if (userIsClientUser(client, users[i])) {
                privileges = privileges | users[i].privileges();
            }
        }
        return privileges;
    }

    /**
     * Checks if the Client has the required Sinusbot Privileges
     * @param  {Client} client  A Teamspeak Client
     * @param  {Integer} privileges The numerical value of the required Privileges
     * @return {Boolean} Returns true if the Client has the required Privileges
     */
    function userClientHasPrivileges(client, privileges) {
        var clientPrivileges = userGetClientPrivileges(client);
        return ((clientPrivileges & privileges) == privileges);
    }

    /**
     * Checks if the Client has access to the given Sinusbot User
     * @param  {Client} client A Teamspeak Client
     * @param  {User} user A Sinusbot User
     * @return {Boolean} Returns true if the User either has a matching UID or the Client is Member of the required ServerGroup
     */
    function userIsClientUser(client, user) {
        if (user.tsUid() == client.uid()) {
            log("userIsClientUser: " + printObject(client) + "-" + printObject(user) + ": UID Match", 5);
            return true;
        }
        if (clientServerGroupsIsMemberOf(client, user.tsGroupId())) {
            log("userIsClientUser: " + printObject(client) + "-" + printObject(user) + ": ServerGroup Match", 5);
            return true;
        } else {
            return false;
        }
    }

    /*
        Track
    */

    /**
     * Returns a String Representation of a Track
     * @param  {Track} track
     * @return {String}    A String Representation of the given Track
     */
    function trackToString(track) {
        return ("[" + track.artist() + ": " + track.title() + "]");
    }

    /*
        Playlist
    */

    /**
     * Returns a String Representation of a Playlist
     * @param  {Playlist} playlist
     * @return {String}    A String Representation of the given Playlist
     */
    function playlistToString(playlist) {
        return ("[" + playlist.id() + ": " + playlist.name() + "]");
    }

    /*
        Helper
    */

    /**
     * Checks if an Object is null or undefined
     * @param  {Object} element
     * @return {Boolean} Returns true if the Object is null or undefined
     */
    function empty(element) {
        if (!element || typeof element === 'undefined') {
            return true;
        }
        return false;
    }

    /**
     * Returns a String Representation of an Object
     * @param  {Object} object
     * @return {String}    A String Representation of the given Object
     */
    function printObject(object) {
        try {
            object.nick();
            return clientToString(object);
        } catch (err) {
            try {
                object.icon();
                return groupToString(object);
            } catch (err) {
                try {
                    object.codec();
                    return channelToString(object);
                } catch (err) {
                    try {
                        object.isAdmin();
                        return userToString(object);
                    } catch (err) {
                        try {
                            object.artist();
                            return trackToString(object);
                        } catch (err) {
                            try {
                                object.getTracks();
                                return playlistToString(object);
                            } catch (err) {
                                if (Array.isArray(object)) {
                                    return arrayToString(object);
                                } else {
                                    return "" + object;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Returns a String Representation of an Array
     * @param  {Object[]} array
     * @return {String}    A String Representation of the given Array
     */
    function arrayToString(array) {
        var result = "[";
        for (var i = 0; i < array.length; i++) {
            result += printObject(array[i]);
            if (i + 1 < array.length) {
                result += ",";
            }
        }
        result += "]";
        return result;
    }

    /**
     * Checks if an Array contains all Elements of another given Array
     * @param  {Object[]} array
     * @param  {Object[]} elements The Elements to search for in the Array
     * @param  {Function} compare  A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Boolean} Returns true if all Elements are contained in the given Array
     */
    function arrayContainsAll(array, elements, compare) {
        if (arrayMissingElements(array, elements, compare).length > 0) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Concatenates two Arrays
     * @param  {Object[]} array
     * @param  {Object[]} elements
     * @return {Object[]} Returns a new Array containing all Elements of the two given Arrays
     */
    function arrayCombineArrays(array, elements) {
        array = arrayCreateArray(array);
        elements = arrayCreateArray(elements);
        var result = [];
        for (var i = 0; i < array.length; i++) {
            result.push(array[i]);
        }
        for (var j = 0; j < elements.length; j++) {
            result.push(elements[j]);
        }
        log("arrayCombineArrays: Found '" + result.length + "' Objects", 4);
        return result;
    }

    /**
     * Checks if an Array contains the given Element
     * @param  {Object[]} array
     * @param  {Object} element
     * @param  {Function} compare A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Boolean}  Returns true if the Element is contained in the Array
     */
    function arrayContainsElement(array, element, compare) {
        if (!compare) {
            compare = equal;
        }
        for (var i = 0; i < array.length; i++) {
            if (compare(array[i], element)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if an Array contains at least one Element of another given Array
     * @param  {Object[]} array
     * @param  {Object[]} elements The Elements to search for in the Array
     * @param  {Function} compare  A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Boolean}  Returns true if at least one Element is contained in the given Array
     */
    function arrayContainsOne(array, elements, compare) {
        for (var i = 0; i < elements.length; i++) {
            if (arrayContainsElement(array, elements[i], compare)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Creates an Array containing the given Element or returns immediately if an Array is given
     * @param  {Object[] | Object} element
     * @return {Object[]} An Array containing the given Elements
     */
    function arrayCreateArray(element) {
        if (!Array.isArray(element)) {
            var array = [];
            if (element) {
                array.push(element);
            }
            return array;
        } else {
            return element;
        }
    }

    /**
     * Creates a Set of the given Array, removing any Duplicates
     * @param  {Object[]} array
     * @param  {Function} compare A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Object[]}  The Set representation of the given Array
     */
    function arrayCreateSet(array, compare) {
        var result = [];
        if (!Array.isArray(array)) {
            result.push(array);
            return result;
        } else {
            for (var i = 0; i < array.length; i++) {
                if (!arrayContainsElement(result, array[i], compare)) {
                    result.push(array[i]);
                }
            }
            return result;
        }
    }

    /**
     * Returns the Elements that differ are contained in only one of the given Arrays
     * @param  {Object[]} array
     * @param  {Object[]} elements
     * @param  {Function} compare A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Object[]}    An Array that contains the Elements that were only present in one of the Arrays
     */
    function arrayDifference(array, elements, compare) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            if (!arrayContainsElement(array, elements[i], compare)) {
                result.push(elements[i]);
            }
        }
        for (var j = 0; j < array.length; j++) {
            if (!arrayContainsElement(elements, array[j], compare)) {
                result.push(array[j]);
            }
        }
        return result;
    }

    /**
     * Gets the Index of an Object in an Array or -1 if it is not contained
     * @param  {Object[]} array
     * @param  {Object} element
     * @param  {Function} compare  A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Integer}         [description]
     */
    function arrayGetIndex(array, element, compare) {
        if (!compare) {
            compare = equal;
        }
        for (var i = 0; i < array.length; i++) {
            if (compare(array[i], element)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Removes undefined and null entries from an Array
     * @param  {Object[]} array
     * @return {Object[]} A Copy of the Array with any undefined or null entries removed
     */
    function arrayRemoveUndefined(array) {
        array = arrayCreateArray(array);
        var result = [];
        for (var i = 0; i < array.length; i++) {
            if (!empty(array[i])) {
                result.push(array[i]);
            }
        }
        log("arrayRemoveUndefined: Removed '" + (array.length - result.length) + "' undefined or null entries from the array", 4);
        return result;
    }

    /**
     * Returns the missing Elements in the Array
     * @param  {Object[]} array
     * @param  {Object[]} elements The Array that contains the Elements to search for
     * @param  {Function} compare A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Object[]}  An Array containing the missing Elements
     */
    function arrayMissingElements(array, elements, compare) {
        elements = arrayCreateArray(elements);
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            if (!arrayContainsElement(array, elements[i], compare)) {
                result.push(elements[i]);
            }
        }
        log("arrayMissingElements: Found '" + result.length + "' missing entries in the arrays", 4);
        return result;
    }

    /**
     * Removes the Elements of one Array of another Array
     * @param  {Object[]} array
     * @param  {Object[]} elements    The Array that contains the Elements to remove
     * @param  {Function} compare    A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Array}    A Copy of the Array that does not contain the removed Elements
     */
    function arrayRemoveElements(array, elements, compare) {
        if (!compare) {
            compare = equal;
        }
        array = arrayCreateArray(array);
        elements = arrayCreateArray(elements);
        var result = [];
        for (var i = 0; i < array.length; i++) {
            if (!arrayContainsElement(elements, array[i], compare)) {
                result.push(array[i]);
            }
        }
        log("arrayRemoveElements: Removed '" + (array.length - result.length) + "' elements from the array", 4);
        return result;
    }

    /**
     * Checks if a is equal b
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}   Returns true when a is equal b
     */
    function equal(a, b) {
        return (a == b);
    }

    /**
     * Checks if a is not equal b
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}   Returns true when a is not equal b
     */
    function unequal(a, b) {
        return (a != b);
    }

    /**
     * Checks if a is greater b
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}   Returns true when a is greater b
     */
    function greater(a, b) {
        return (a > b);
    }

    /**
     * Checks if a is less b
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}   Returns true when a is less b
     */
    function less(a, b) {
        return (a < b);
    }

    /**
     * Checks if a is greater or equal b
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}   Returns true when a is greater or equal b
     */
    function greaterOrEqual(a, b) {
        return (a >= b);
    }

    /**
     * Checks if a is less or equal b
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}   Returns true when a is less or equal b
     */
    function lessOrEqual(a, b) {
        return (a <= b);
    }

    /**
     * Checks if one String is contained in another
     * @param  {String} a
     * @param  {String} b
     * @return {Boolean}   Returns true when String b is contained in String a
     */
    function contains(a, b) {
        if (a.indexOf(b) != -1) {
            return true;
        }
        return false;
    }

    /**
     * Checks if one String is contained in another, ignoring the Case
     * @param  {String} a
     * @param  {String} b
     * @return {Boolean}   Returns true when String b is contained in String a
     */
    function containsIgnoreCase(a, b) {
        if (a.toLowerCase().indexOf(b.toLowerCase()) != -1) {
            return true;
        }
        return false;
    }

    /**
     * Checks if the value is a Number
     * @param  {Object}  number Object that should be checked
     * @return {Boolean}        Returns true if the Object is a Number
     */
    function isNumber(number) {
        return !isNaN(number);
    }

    /**
     * Simple Password Generator
     * @param  {number}  length Password Length
     * @return {String}    Returns a Password with the specified Length
     */
    function generatePassword(length) {
        var result = "";
        var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        return result;
    }

    /**
     * Checks if input is a valid integer number
     * @param  {Number}  value Number to check for integer
     * @return {Boolean}       Returns true of false
     */
    function isInt(value) {
        return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
    }

    /**
     * Parse an Array of Objects to an Array of a single chosen Properties
     * @param  {Object[]}  array      Array to Parse
     * @param  {String}  attribute  Name of the Property that should be parsed
     * @param  {Boolean} isFunction Check when the Property is a function
     * @return {Object[]}  Parsed Array
     */
    function arrayObjectParseAttribute(array, attribute, isFunction) {
        array = arrayCreateArray(array);
        var result = [];
        for (var i = 0; i < array.length; i++) {
            if (isFunction) {
                result.push(array[i][attribute]());
            } else {
                result.push(array[i][attribute]);
            }
        }
        log("arrayObjectParseAttribute: Parsed '" + result.length + "' Objects", 4);
        return result;
    }

    /**
     * Set the Attributes of a object to a new value.
     * @param  {Object[]}   array     Object to apply Attribute changes to
     * @param  {String}     attribute The Attribute which should get applied
     * @param  {Object[] | Object} value     Array or single Object that should be applied. Arrays will get applied in array element order
     */
    function arrayObjectSetAttribute(array, attribute, value) {
        array = arrayCreateArray(array);
        value = arrayCreateArray(array);
        for (var i = 0; i < array.length; i++) {
            array[i][attribute].apply(null, value);
        }
    }

    /**
     * Filters an Array for a specifc Attribute value
     * @param  {Object[]}  array      The Array to filter
     * @param  {String}  attribute  The Attribute to filter for
     * @param  {Object}  value      Value to check for
     * @param  {Boolean} isFunction Flag for comparing function or Attributes of Objects
     * @param  {Function} compare    A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Object[]}             Found Object that matched the value.
     */
    function arrayFilterByAttribute(array, attribute, value, isFunction, compare) {
        if (!compare) {
            compare = equal;
        }
        var result = [];
        for (var i = 0; i < array.length; i++) {
            if (isFunction) {
                if (compare(array[i][attribute](), value)) {
                    result.push(array[i]);
                }
            } else {
                if (compare(array[i][attribute], value)) {
                    result.push(array[i]);
                }
            }
        }
        return result;
    }

    /**
     * Compares an objects property with a specific value
     * @param  {Object} object   Object to check
     * @param  {String} property Name of the Property that should be checked
     * @param  {Object} element  Value that should be compared to the Property
     * @param  {Function} compare    A Compare Function that should be used for the Comparison, if not set 'equal' is used
     * @return {Boolean}   Returns the Value of the Comparison
     */
    function objectFunctionEqualsElement(object, property, element, compare) {
        if (!compare) {
            compare = equal;
        }
        return compare(object[property](), element);
    }

    /*
        Lib Definition
    */

    var libModule = {
        log: log,

        general: {
            checkVersion: checkVersion,
            log: log,
            getBots: getActiveBotInstances,
        },

        channel: {
            toString: channelToString,
            getChannels: channelGetChannels,
            getSubchannels: channelGetSubchannels,
        },

        client: {
            toString: clientToString,
            toURLString: clientToURLString,
            urlToClient: clientUrlToClient,
            equal: equalClientObjects,
            filterByClients: clientFilterByClients,
            toUIDs: clientParseUIDs,
            parseFromUIDs: clientParseClients,
            getClients: clientGetClients,
            search: clientSearch,
            isMemberOfGroup: clientServerGroupsIsMemberOf,
            isMemberOfAll: clientServerGroupsIsMemberOfAll,
            isMemberOfOne: clientServerGroupsIsMemberOfOne,
            addToGroups: clientServerGroupAddToGroups,
            removeFromGroups: clientServerGroupRemoveFromGroups,
            isAuthorized: clientServerGroupsIsMemberOfOne,
            hasPrivileges: userClientHasPrivileges,
            getPrivileges: userGetClientPrivileges,
        },

        channelGroup: {
            toString: groupToString,
        },

        serverGroup: {
            toString: groupToString,
            toIDs: serverGroupParseIDs,
            toGroups: serverGroupParseGroups,
        },

        string: {
            matchUID: stringMatchUID,
        },

        user: {
            toString: userToString,
            hasPrivileges: userHasPrivileges,
            hasClientPrivileges: userClientHasPrivileges,
            getClientPrivileges: userGetClientPrivileges,
            isClientUser: userIsClientUser,
            privileges: {
                PRIV_LOGIN: 1,
                PRIV_LIST_FILE: 2,
                PRIV_UPLOAD_FILE: 4,
                PRIV_DELETE_FILE: 8,
                PRIV_EDIT_FILE: 16,
                PRIV_CREATE_PLAYLIST: 32,
                PRIV_DELETE_PLAYLIST: 64,
                PRIV_ADDTO_PLAYLIST: 128,
                PRIV_STARTSTOP: 256,
                PRIV_EDITUSERS: 512,
                PRIV_CHANGENICK: 1024,
                PRIV_BROADCAST: 2048,
                PRIV_PLAYBACK: 4096,
                PRIV_ENQUEUE: 8192,
                PRIV_ENQUEUENEXT: 16384,
                PRIV_EDITBOT: 65536,
                PRIV_EDITINSTANCE: 131072,
            }
        },

        track: {
            toString: trackToString,
        },

        playlist: {
            toString: playlistToString,
        },

        array: {
            toString: arrayToString,
            combineArrays: arrayCombineArrays,
            containsAll: arrayContainsAll,
            containsElement: arrayContainsElement,
            containsOne: arrayContainsOne,
            createArray: arrayCreateArray,
            toSet: arrayCreateSet,
            difference: arrayDifference,
            getIndex: arrayGetIndex,
            missingElements: arrayMissingElements,
            removeElements: arrayRemoveElements,
            removeUndefined: arrayRemoveUndefined,
            parseAttribute: arrayObjectParseAttribute,
            setAttribute: arrayObjectSetAttribute,
            filterByAttribute: arrayFilterByAttribute,
        },

        helper: {
            generatePassword: generatePassword,
            printObject: printObject,
            isNumber: isNumber,
            isInt: isInt,
            objectFunctionEqualsElement: objectFunctionEqualsElement,
        },

        comparator: {
            equal: equal,
            unequal: unequal,
            greater: greater,
            less: less,
            greaterEqual: greaterOrEqual,
            lessEqual: lessOrEqual,
            contains: contains,
            containsIgnoreCase: containsIgnoreCase,
        },
    };

    engine.export(libModule);
});
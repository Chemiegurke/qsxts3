/*
Copyright (C) 2020-2021 Sam Schumacher <contact@samschumacher.de>

This work is licensed under the Creative Commons
Attribution-NonCommercial-ShareAlike 4.0

International License. To view a copy of this license,
visit http://creativecommons.org/licenses/by-nc-sa/4.0/.
*/
registerPlugin({

    name: 'AutoGroupAddOnJoin',
    version: '1.2',
    description: 'Automatically adds a server group when a user joins the server, including ignoring server groups.',
    author: 'Sam Schumacher <contact@samschumacher.de>',
    engines: '>= 0.9.16',

    vars: [{
            name: 'group',
            title: 'Server Group IDs',
            indent: 2,
            type: 'strings'
        },
        {
            name: 'excludeGroups',
            title: 'Excludes Groups that are not given/removed from any new server group (Comma separated) - Leave blank if everyone should get it',
            indent: 2,
            type: 'strings'
        }
    ]

}, function(sinusbot, config, info) {

    var event = require('event');
    var engine = require('engine');
    var lib = require('OKlib.js');

    if (!lib) {
        engine.log("OKlib could not be loaded or is not compatible with this script. Make sure the latest OKlib version is installed. The latest version can always be downloaded from https://forum.sinusbot.com/resources/oklib.325/");
        return;
    }


    event.on('clientMove', function(ev) {
        setTimeout(function() {
            if (ev.client.isSelf()) {
                return;
            }
            if (!ev.fromChannel) {
                if (!lib.client.isMemberOfOne(ev.client, config.excludeGroups)) {
                    lib.client.addToGroups(ev.client, config.group);
                } else {
                    lib.client.removeFromGroups(ev.client, config.group);
                }
            }
        }, 1000);
    });

    event.on('serverGroupAdded', function(ev) {
        if (!lib.client.isMemberOfOne(ev.client, config.excludeGroups)) {
            lib.client.addToGroups(ev.client, config.group);
        } else {
            lib.client.removeFromGroups(ev.client, config.group);
        }
    })
    event.on('serverGroupRemoved', function(ev) {
        if (!lib.client.isMemberOfOne(ev.client, config.excludeGroups)) {
            lib.client.addToGroups(ev.client, config.group);
        } else {
            lib.client.removeFromGroups(ev.client, config.group);
        }
    })

    event.on('chat', function(ev) {

        if (ev.text == '!info' || ev.text == '!help') {
            ev.client.chat("This server uses HerrSammy's [url=https://forum.sinusbot.com/resources/auto-server-group-add-on-join.468/]AutoGroupAddOnJoin[/url] script. Thanks for use!")
        }
        if (ev.text == '!version') {
            ev.client.chat("[AutoGroupAddOnJoin] [url=https://forum.sinusbot.com/resources/auto-server-group-add-on-join.468/]1.1[/url]")
        }
    });

});

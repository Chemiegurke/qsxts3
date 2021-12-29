registerPlugin({
 name: 'Automatic Server Group Assigner',
 version: '1.4.3',
 description: 'Automatically assigns a ServerGroup when a user joins a specific channel or gets another ServerGroup removed/assigned',
 author: 'Smorrebrod || Cedrik <cedrik.paetz@gmail.com>',
vars:[
    {
        name: 'channels',
        title: 'Add a Channel to the Assigner',
        type: 'array',
        vars:[{
                name: 'excludeGroups',
                title: 'Excludes Groups that are not given/removed from any new server group (Comma separated) - Leave blank if everyone should get it',
                indent: 2,
                type: 'strings'
            },
            {
                name: 'channel',
                title: 'Channel',
                indent: 2,
                type: 'channel'
            },
            {
                name: 'selectionType',
                title: 'Should this channel be used for the assignment or the subchannels of this channel?',
                indent: 2,
                type: 'select',
                options: [
                    'Current Channel',
                    'Subchannels'
                ]
            },
            {
                name: 'serverGroups',
                title: 'Server Group IDs, If "remove" is chosen and no server group is given it will remove ALL server groups',
                indent: 2,
                type: 'strings'
            },
            {
                name: 'type',
                title: 'Remove Groups or Assign Groups',
                indent: 2,
                type: 'select',
                options: [
                'Add',
                'Remove'            
                ]
            },
            {
                name: 'movedClient',
                title: 'Should a moved Client also get a Channel Group?',
                indent: 2,
                type: 'select',
                options: [
                    'No',
                    'Yes'
                ]
            },
            {
                name: 'persistence',
                title: 'Should the User keep the Group after leaving the channel?',
                indent: 2,
                type: 'select',
                options: [
                'No',
                'Yes'            
                ],
                conditions: [
                    { field: 'type', value: 0 }
                ]
            }
        ]
    },
    {
        name: 'serverGroups',
        title: 'Add a Server Group to the Assigner',
        type: 'array',
        vars:[{
                name: 'excludeGroups',
                title: 'Excludes Groups that are not given/removed from any new server group (Comma separated) - Leave blank if everyone should get it',
                indent: 2,
                type: 'strings'
            },
            {
                name: 'serverGroup',
                title: 'Triggering Server Group',
                indent: 2,
                type: 'string'
            },
            {
                name: 'triggerType',
                title: 'Should the Adding or the Remove of the ServerGroup trigger the Event?',
                indent: 2,
                type: 'select',
                options: [
                    'Add',
                    'Remove'
                ]
            },
            {
                name: 'serverGroups',
                title: 'Server Group IDs',
                indent: 2,
                type: 'strings'
            },
            {
                name: 'type',
                title: 'Remove Groups or Assign Groups',
                indent: 2,
                type: 'select',
                options: [
                'Add',
                'Remove'            
                ]
            }
        ]
    }
]
   
}, function(sinusbot, config) {
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');
    
    event.on('load', function(){
        main();
    });
    
    function main(){
        var lib = require('OKlib.js');
        
        if (!lib){
            engine.log("OKlib could not be loaded or is not compatible with this script. Make sure the latest OKlib version is installed. The latest version can always be downloaded from https://forum.sinusbot.com/resources/oklib.325/");
            return;
        }
        
        event.on('serverGroupAdded', function(ev){
            for (var s in config.serverGroups){
                var currentConfig = config.serverGroups[s];
                if (currentConfig.serverGroup != ev.serverGroup.id() || currentConfig.triggerType == 1){
                    continue;
                }else{
                    if (!lib.client.isMemberOfOne(ev.client,currentConfig.excludeGroups)){
                        if (currentConfig.type == 1){
                            lib.client.removeFromGroups(ev.client, currentConfig.serverGroups);
                        }else{
                            lib.client.addToGroups(ev.client, currentConfig.serverGroups);
                        }
                    } 
                }
            } 
        });
        
        event.on('serverGroupRemoved', function(ev){
            for (var s in config.serverGroups){
                var currentConfig = config.serverGroups[s];
                if (currentConfig.serverGroup != ev.serverGroup.id() || currentConfig.triggerType != 1){
                    continue;
                }else{
                    if (!lib.client.isMemberOfOne(ev.client,currentConfig.excludeGroups)){
                        if (currentConfig.type == 1){
                            lib.client.removeFromGroups(ev.client, currentConfig.serverGroups);
                        }else{
                            lib.client.addToGroups(ev.client, currentConfig.serverGroups);
                        }
                    } 
                }
            } 
        });
        
        event.on('clientMove', function(ev) {
            if (ev.client.isSelf()) {
                return;
            }
            var currentChannel = ev.fromChannel;
            if (currentChannel){
                var currentChannelParent = currentChannel.parent()
                for (var c in config.channels){
                    var currentConfig = config.channels[c];
                    var currentTriggerChannel = currentChannel;
                    if (currentConfig.selectionType == 1){
                        currentTriggerChannel = currentChannelParent;
                        if (!currentTriggerChannel){
                            continue;
                        }
                    }               
                    if (currentTriggerChannel.id() == currentConfig.channel){
                        if (!lib.client.isMemberOfOne(ev.client,currentConfig.excludeGroups)){
                            if (currentConfig.type != 1 && currentConfig.persistence != 1){
                                if (currentConfig.serverGroups && currentConfig.serverGroups.length > 0){
                                    lib.client.removeFromGroups(ev.client, currentConfig.serverGroups);
                                }
                            }
                        }
                    }
                }
            }
            currentChannel = ev.toChannel;
            if (currentChannel){
                var currentChannelParent = currentChannel.parent()
                for (var c in config.channels){
                    var currentConfig = config.channels[c];
                    if (currentConfig.movedClient != 1){
                        if (ev.invoker){
                            if (ev.invoker.id() != ev.client.id()){
                                continue;
                            }
                        }
                    }
                    var currentTriggerChannel = currentChannel;
                    if (currentConfig.selectionType == 1){
                        currentTriggerChannel = currentChannelParent;
                        if (!currentTriggerChannel){
                            continue;
                        }
                    }    
                    if (currentTriggerChannel.id() == currentConfig.channel){
                        if (!lib.client.isMemberOfOne(ev.client,currentConfig.excludeGroups)){
                            if (currentConfig.type == 1){
                                var removeGroups = currentConfig.serverGroups;
                                if (!removeGroups){
                                    lib.general.log('Draining Groups from '+lib.helper.printObject(ev.client),3);
                                    removeGroups = ev.client.getServerGroups();
                                }
                                lib.client.removeFromGroups(ev.client, removeGroups);
                            }else{
                                lib.client.addToGroups(ev.client, currentConfig.serverGroups);
                            }                            
                        }
                    }
                }
            }
        });
    }
});
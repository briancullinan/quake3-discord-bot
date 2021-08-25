# Discord commands

Version 7+ of the Discord API added a special command API. They expect us devs
to conform to use `/command` format. This shows a fancy little list within
Discord with descriptions for each parameter. The specification for the commands
for this bot are in the cmd-definitions.js file.

This also has some helper functions for scanning commands out of channel 
messages. Channel commands can be in the \\command, !command, or /command 
format.

Commands can also be send directly to the Orbb-bot user, and direct messages are
interpreted as `private` channels. This is useful especially for the /rcon 
command where you don't want other players to see what you are typing.

# Discord API

I guess the official release is slightly behind versions. This uses the 
REST API directly.

Basically, require('./discordApi') which includes the index.js file 
automatically.

This provides all the functions needed to access Discord, automatically calls 
the authorization, and also queues the requests and handles rate limit errors
elegantly.

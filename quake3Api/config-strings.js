
var MAX_RELIABLE_COMMANDS = 64
var	MAX_MODELS = 256		// these are sent over the net as 8 bits
var	MAX_SOUNDS = 256		// so they cannot be blindly increased
var	MAX_CLIENTS = 64
var MAX_LOCATIONS = 64

var CS_MUSIC = 2
var CS_MESSAGE = 3		// from the map worldspawn's message field
var CS_MOTD = 	4		  // g_motd string for server message of the day
var CS_WARMUP = 5		  // server time when the match will be restarted
var CS_SCORES1 = 6
var CS_SCORES2 = 7
var CS_VOTE_TIME = 8
var CS_VOTE_STRING = 9
var CS_VOTE_YES = 10
var CS_VOTE_NO = 11

var CS_TEAMVOTE_TIME = 12
var CS_TEAMVOTE_STRING = 14
var CS_TEAMVOTE_YES = 16
var CS_TEAMVOTE_NO = 18

var CS_GAME_VERSION = 20
var CS_LEVEL_START_TIME = 21		// so the timer only shows the current level
var CS_INTERMISSION = 22		// when 1, fraglimit/timelimit has been hit and intermission will start in a second or two
var CS_FLAGSTATUS = 23		// string indicating flag status in CTF
var CS_SHADERSTATE = 24
var CS_BOTINFO = 25

var CS_ITEMS = 27		// string of 0's and 1's that tell which items are present
var	CS_MODELS = 32

var	CS_SOUNDS = (CS_MODELS+MAX_MODELS)
var	CS_PLAYERS = (CS_SOUNDS+MAX_SOUNDS)
var CS_LOCATIONS = (CS_PLAYERS+MAX_CLIENTS)
var CS_PARTICLES = (CS_LOCATIONS+MAX_LOCATIONS)

var CS_MAX = (CS_PARTICLES+MAX_LOCATIONS)

module.exports = {
  MAX_RELIABLE_COMMANDS, MAX_MODELS, MAX_SOUNDS, MAX_CLIENTS, MAX_LOCATIONS,

  CS_MUSIC, CS_MESSAGE, CS_MOTD, CS_WARMUP, 
  CS_SCORES1, CS_SCORES2, CS_VOTE_TIME, CS_VOTE_STRING, CS_VOTE_YES,
  CS_VOTE_NO, CS_TEAMVOTE_TIME, CS_TEAMVOTE_STRING, CS_TEAMVOTE_YES,
  CS_TEAMVOTE_NO, CS_GAME_VERSION, CS_LEVEL_START_TIME, CS_INTERMISSION,
  CS_FLAGSTATUS, CS_SHADERSTATE, CS_BOTINFO, CS_ITEMS, CS_MODELS,
  CS_SOUNDS, CS_PLAYERS, CS_LOCATIONS, CS_PARTICLES, CS_MAX
}

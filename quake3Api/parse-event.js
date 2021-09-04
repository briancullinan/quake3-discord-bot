
//typedef enum {
var SV_EVENT = {
  MAPCHANGE: 0,
  CLIENTSAY: 1,
  MATCHEND: 2,
  CALLADMIN: 3,
  CLIENTDIED: 4,
  CLIENTWEAPON: 5,
  CLIENTRESPAWN: 6,
  CLIENTAWARD: 7,
  GETSTATUS: 8,
  SERVERINFO: 9,
  CONNECTED: 10,
  DISCONNECT: 11,
}
//} recentEvent_t;

function recentEvent(message) {
  var json = JSON.parse(message)
  console.log(json)
}

module.exports = {
  SV_EVENT,
  recentEvent
}

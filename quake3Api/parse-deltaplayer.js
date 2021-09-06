
function readDeltaPlayerstate() {
  /*

  read = readBits(message, read[0], 1)
  if(read[1] == 1) {

      // parse stats
      read = readBits(message, read[0], 1)
      if(read[1] == 1) {
          bits = MSG_ReadBits (msg, MAX_STATS);

          for (i=0 ; i<MAX_STATS ; i++) {
              if (bits & (1<<i) ) {
                  to->stats[i] = MSG_ReadShort(msg);
              }
          }
      }
  }

  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_STATS");
  }

  // parse persistant stats
  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_PERSISTANT");
      bits = MSG_ReadBits (msg, MAX_PERSISTANT);
      for (i=0 ; i<MAX_PERSISTANT ; i++) {
          if (bits & (1<<i) ) {
              to->persistant[i] = MSG_ReadShort(msg);
          }
      }
  }

  // parse ammo
  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_AMMO");
      bits = MSG_ReadBits (msg, MAX_WEAPONS);
      for (i=0 ; i<MAX_WEAPONS ; i++) {
          if (bits & (1<<i) ) {
              to->ammo[i] = MSG_ReadShort(msg);
          }
      }
  }

    // parse powerups
  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_POWERUPS");
      bits = MSG_ReadBits (msg, MAX_POWERUPS);
      for (i=0 ; i<MAX_POWERUPS ; i++) {
          if (bits & (1<<i) ) {
              to->powerups[i] = MSG_ReadLong(msg);
          }
      }
  }
  */
}

module.exports = readDeltaPlayerstate

var GENTITYNUM_BITS = 10
var MAX_POWERUPS = 16
var MAX_GENTITIES = (1<<GENTITYNUM_BITS)

var entityStateFields = [
    32, //  NETF(pos.trTime)
    0, //  NETF(pos.trBase[0])
    0, //  NETF(pos.trBase[1])
    0, //  NETF(pos.trDelta[0])
    0, //  NETF(pos.trDelta[1])
    0, //  NETF(pos.trBase[2])
    0, //  NETF(apos.trBase[1])
    0, //  NETF(pos.trDelta[2])
    0, //  NETF(apos.trBase[0])
    10, //  NETF(event)
    0, //  NETF(angles2[1])
    8, //  NETF(eType)
    8, //  NETF(torsoAnim)
    8, //  NETF(eventParm)
    8, //  NETF(legsAnim)
    GENTITYNUM_BITS, //  NETF(groundEntityNum)
    8, //  NETF(pos.trType)
    19, //  NETF(eFlags)
    GENTITYNUM_BITS, //  NETF(otherEntityNum)
    8, //  NETF(weapon)
    8, //  NETF(clientNum)
    0, //  NETF(angles[1])
    32, //  NETF(pos.trDuration)
    8, //  NETF(apos.trType)
    0, //  NETF(origin[0])
    0, //  NETF(origin[1])
    0, //  NETF(origin[2])
    24, //  NETF(solid)
    MAX_POWERUPS, //  NETF(powerups)
    8, //  NETF(modelindex)
    GENTITYNUM_BITS, //  NETF(otherEntityNum2)
    8, //  NETF(loopSound)
    8, //  NETF(generic1)
    0, //  NETF(origin2[2])
    0, //  NETF(origin2[0])
    0, //  NETF(origin2[1])
    8, //  NETF(modelindex2)
    0, //  NETF(angles[0])
    32, //  NETF(time)
    32, //  NETF(apos.trTime)
    32, //  NETF(apos.trDuration)
    0, //  NETF(apos.trBase[2])
    0, //  NETF(apos.trDelta[0])
    0, //  NETF(apos.trDelta[1])
    0, //  NETF(apos.trDelta[2])
    32, //  NETF(time2)
    0, //  NETF(angles[2])
    0, //  NETF(angles2[0])
    0, //  NETF(angles2[2])
    32, //  NETF(constantLight)
    16, //  NETF(frame)
]

module.exports = {
  entityStateFields,
  GENTITYNUM_BITS,
  MAX_POWERUPS,
  MAX_GENTITIES,
}

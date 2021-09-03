function formatMap(result) {
  var json = {
    embeds: [{
      title: result.includes.title || result.includes.bsp || result.zip,
      description: (result.author ? (' by ' + result.author + ' ') : '') 
        + (result.dateStamp ? (' - ' + result.dateStamp) : ''),
      color: 0xdda60f,
      url: `https://lvlworld.com/review/id:${result.levelId}`,
      fields: [
        {
          name: 'Review',
          value: result.extract,
          inline: false
        },
        {
          name: 'Gametype',
          value: result.gameMode.join('\n'),
          inline: false
        },
      ],
      image: {
        url: `https://lvlworld.com/levels/${result.zip}/${result.zip}320x240.jpg`,
        height: 240,
        width: 320
      }
    }]
  }
  return json
}

module.exports = formatMap

const data = require('./data.json');

module.exports.info = {
	name: 'Proverb',
	category: 'random',
	aliases: [
		'proverb'
	]
};

module.exports.command = message =>
	message.channel.createMessage(data.data[Math.floor(Math.random() * data.data.length)]);

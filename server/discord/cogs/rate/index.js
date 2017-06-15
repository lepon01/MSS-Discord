const crypto = require('crypto');

module.exports.alias = [
	'rate',
	'rank'
];

module.exports.command = function screenshot(message) {
	if (!message.input) return message.channel.createMessage('I rate undefined a 11 out of 10');
	if (message.input.length > 100) message.input = `${message.input.substring(0, 100)}...`;
	const rank = parseInt(crypto.createHash('md5').update(message.content.toLowerCase()).digest('hex'), 16) % 11;
	return message.channel.createMessage(`I rate ${message.content} a ${rank} out of 10`);
};

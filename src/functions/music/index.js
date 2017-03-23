const yt = require('ytdl-core');
const fs = require('fs');

var playlist = [];
var stream = [];
var current = [];

exports.sound = sound;
exports.play = play;
exports.add = add;
	
function sound(message) {
	var voiceChannel = message.member.voiceChannel;
	
	voiceChannel.join()
	.then(connnection => {
		var looper = function() {
			play(message);
			const dispatcher = connnection.playStream(stream[message.guild.id]);
			dispatcher.on('end', () => {
				looper();
			});
		}
		looper();
	});
}

function play(message) {
	var voiceChannel = message.member.voiceChannel;
	
	if(!voiceChannel) {
		return message.reply("You are not in a voice channel.");
	}
	
	if (playlist[message.guild.id].length > 0) {
		current[message.guild.id] = JSON.parse(playlist[message.guild.id].shift());
		message.channel.sendMessage('**Music Control Panel**')
			.then(function(message) {
				message.react(String.fromCodePoint(10145));
				message.react(String.fromCodePoint(8505));
				message.react(String.fromCodePoint(128240));
			});
		switch (current[message.guild.id]["type"]) {
			case "youtube":
				stream[message.guild.id] = yt(current[message.guild.id]["url"], {audioonly: true});
				break;
			case "local":
				stream[message.guild.id] = fs.createReadStream(current[message.guild.id]["url"]);
				break;
		}
	} else {
		if (voiceChannel && voiceChannel.connection) voiceChannel.leave();
		playlist[message.guild.id] = [];
		if (stream[message.guild.id]) stream[message.guild.id].destroy();
		message.reply("The playlist has ended.");
		return;
	}
}

function add(message, type, url, title, thumb_url) {
	playlist[message.guild.id] = playlist[message.guild.id] || [];
	playlist[message.guild.id].push(JSON.stringify({type: type, url: url, title: title, thumb_url: thumb_url}));
	if (!message.member.voiceChannel.connection) {
		sound(message);
	}
}
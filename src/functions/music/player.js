const yt = require('ytdl-core');
const streamy = require("stream");
const fs = require('fs');
const request = require("request");
const spawn = require("child_process").spawn

module.exports = Player;

function Player(message) {
	var that = this;

	this.message = message;
	this.channel = message.channel;
	this.voicechannel = message.member.voiceChannel;
	this.playlist = [];
	this.current = {};
	this.pid = null;
	this.connection = null;
	this.connect = function() {
		console.log(`Message: Connecting to Voice Channel`);
		this.voicechannel
			.join()
			.then((connection) => {
				this.connection = connection;
				this.play();
			});
	}
	this.play = function() {
		console.log(`Message: Checking playlist length`);
		if(this.playlist.length === 0) return this.voicechannel.leave();

		console.log(`Message: Shifting playlist`);
		this.current = this.playlist.shift();

		//Make an ffmpeg stream
		console.log(`Message: Making FFMPEG stream`);
		let ffmpeg = spawn('ffmpeg', [
			'-i', 'pipe:0',
			'-f', 'wav',
			'pipe:1'
		]);

		//Set the PID of this.
		this.pid = ffmpeg.pid;

		//Try it! If it fails, it skips it.
		try {
			console.log(`Message: Playing from ${this.current.type}`);
			//Send the correct input to the ffmpeg stream
			switch (this.current.type) {

				//Stream from YouTube
				case "youtube":
					yt(this.current.url, {audioonly: true})
						.pipe(ffmpeg.stdin);
					break;

				//Stream from a local file
				case "local":
					fs.createReadStream(this.current.url)
						.pipe(ffmpeg.stdin);

					break;

				//Stream from the internet!
				case "http":
				case "https":
					request.get(this.current.url)
						.on("error", (err) => {
							this.channel.send(`A HTTP error occured. Congratulations!`);
							this.play();
						})
						.pipe(ffmpeg.stdin);

					break;
				default:
					console.log(`Failure: Incorrect audio type`);
					this.channel.send(`${this.current.type} is not a valid audio provider.`);
					this.play();
			}

			//Send FFMPEG's output to the connection
			console.log(`Message: Piping FFMPEG to the connection`);
			let dispatcher = this.connection.playStream(ffmpeg.stdout);

			//Check for FFMPEG errors
			ffmpeg.stderr.setEncoding('utf8');
			ffmpeg.stderr.on('data', function(data) {
				if(/^execvp\(\)/.test(data)) {
					console.log('failed to start ' + argv.ffmpeg);
					console.log(`Failure: FFMPEG`);
				}
			});

			//The stream has ended, therefore it can go on to the next song
			dispatcher.on("end", () => {
				this.play()
			});
			ffmpeg.on("close", () => {
				this.pid = null;
			});

		} catch(e) {
			console.log(`Failure: ${e.message}`);
			this.channel.send(`${e.message} - Skipping...`);
			this.play();
		}

	}
	this.add = function(type, url, title, thumb) {
		//Push a JSON string into the array
		this.playlist.push({
			type: type,
			url: url,
			title: title,
			thumb_url: thumb
		});

		//If the bot is not playing, enter the channel and start playing
		if (!this.voicechannel.connection) {
			this.connect();
		}
	}
	this.skip = function() {
		if (this.pid) process.kill(this.pid, "SIGINT");
		this.pid = null;
	}
	this.stop = function() {
		this.skip();
		this.current = {};
		this.playlist = [];
		this.voicechannel.leave();
	}
}

process.on("unhandledRejection", function(err) {
	console.log("Uncaught Promise Error: \n" + err.stack);
});

process.on("uncaughtException", function(err) {
	console.log(err.message);
	console.log(err.stack);
});


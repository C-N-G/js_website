const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./authentication.json');

const fighting_words = [
  'fight me', 'fight', 'lets fight', 'come at me',
  'come at me bro', 'i hate you', 'this bot sucks',
  'lets duel', 'lets play', 'duel me'
];
const insults = [
  'your ancestors sneer upon you!',
  'you disappoint your entire family!',
  'for shame!', 'disgusting!',
  'despicable'
];
const commands = {
  'channel': {'make': 'make channel', 'delete': 'delete channel'},
}
const loss_cases = {
  'timeout': 'taking too long',
  'bad_move': 'not using an appropriate move'
} //You forfiet this match by XYZ
const moves = ['rock', 'paper', 'scissors'];
const states = {
  'ready': 'ready',
  'waiting': 'waiting'
};
const timeOutDelay = 1000*15
var start_timeout;
let state = states.ready;
let scores = {'player': 0, 'bot': 0};
let current_match = {
  'opponent': 0,
  'objective': 0,
  'channel': 0,
  'difficulty': 0,
  'round': 0,
  'score': {'player': 0, 'bot': 0}
};
let bot_message = 0;


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function matchTimeOut() {
  endMatch('TIMEOUT');
}

function endMatch(outcome) {
  clearTimeout(start_timeout);
  let insult_choice = getRandomInt(insults.length);
  switch (outcome) {
    case 'PLAYER_WIN':
      scores.player++;
      verdict = 'win';
      break;
    case 'BOT_WIN':
      scores.bot++;
      verdict = 'loss';
      break;
    case 'TIMEOUT':
      scores.bot++;
      verdict = 'loss';
      current_match.channel.send(`You forfeit this match by ${loss_cases.timeout}, ${insults[insult_choice]}`);
      break;
    case 'BAD_MOVE':
      scores.bot++;
      verdict = 'loss';
      current_match.channel.send(`You forfeit this match by ${loss_cases.bad_move}, ${insults[insult_choice]}`);
      break;
    default:
      verdict = 'tie';
  }
  current_match.channel.send(`Match Ended! Verdict is a ${verdict}. TOTAL SCORE: Players=${scores.player}, Bot=${scores.bot}`);
  current_match.opponent = 0;
  current_match.objective = 0;
  current_match.channel = 0;
  current_match.difficulty = 0;
  current_match.round = 0;
  current_match.score.player = 0;
  current_match.score.bot = 0;
  state = states.ready;
}

function startMatch(objective, message) {
  switch (objective) {
    case 'NONE':
      message.reply("Let's duel! Your move!");
      current_match.opponent = message.author.tag; // make sure only the battle initiator can communicate with the bot during a battle
      current_match.channel = message.channel;
      current_match.difficulty = 1;
      state = states.waiting;
      start_timeout = setTimeout(matchTimeOut, timeOutDelay);
      break;
    case 'FIVE':
      message.reply("Let's duel! Your move!");
      current_match.opponent = message.author.tag;
      current_match.channel = message.channel;
      current_match.difficulty = 5;
      state = states.waiting;
      start_timeout = setTimeout(matchTimeOut, timeOutDelay);
      break;
    default:
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
//TODO Make regex match for setting objectives for the match
  switch (state) {
    case states.ready:
      if (message.content.startsWith('!')) {
        if (message.content === '!scores') { message.reply(`SCORE: Players=${scores.player}, Bot=${scores.bot}`); }
        else if (message.content.startsWith(`!${commands.channel.make}`.toLowerCase())) {
          message.guild.createChannel(`test`, { type: 'text' });
        }
        for (var i = 0; i < fighting_words.length; i++) {
          if (message.content.toLowerCase() === '!' + fighting_words[i]) {
            startMatch('NONE', message);
            break;
          } else if (message.content.toLowerCase() === `!${fighting_words[i]} best of 5`) {
            startMatch('FIVE', message);
            break;
          }
        }
      }
      break;
    case states.waiting:
      if (message.content[0] === '!' && current_match.opponent === message.author.tag && message.channel === current_match.channel) {
        let match_found = false;
        for (var i = 0; i < moves.length; i++) {
          if (message.content.toLowerCase() === '!' +  moves[i]) { // if user response matches a move then respond
            response_move = getRandomInt(3);
            //message.reply('I choose ' + moves[response_move]);
            bot_message = `I choose ${moves[response_move]}. `;
            if (i === 0 && response_move === 0) { bot_message += `YOU TIE!, Rock vs Rock. `; outcome = 0; } // show outcome and assign outcome value
            else if (i === 0 && response_move === 1) { bot_message += `YOU LOSE!, Rock vs Paper. `; outcome = 'BOT_WIN'; }
            else if (i === 0 && response_move === 2) { bot_message += `YOU WIN!, Rock vs Scissors. `; outcome = 'PLAYER_WIN'; }
            else if (i === 1 && response_move === 0) { bot_message += `YOU WIN!, Paper vs Rock. `; outcome = 'PLAYER_WIN'; }
            else if (i === 1 && response_move === 1) { bot_message += `YOU TIE!, Paper vs Paper. `; outcome = 0; }
            else if (i === 1 && response_move === 2) { bot_message += `YOU LOSE!, Paper vs Scissors. `; outcome = 'BOT_WIN'; }
            else if (i === 2 && response_move === 0) { bot_message += `YOU LOSE!, Scissors vs Rock. `; outcome = 'BOT_WIN'; }
            else if (i === 2 && response_move === 1) { bot_message += `YOU WIN!, Scissors vs Paper. `; outcome = 'PLAYER_WIN'; }
            else if (i === 2 && response_move === 2) { bot_message += `YOU TIE!, Scissors vs Scissors. `; outcome = 0; }
            if (current_match.round < current_match.difficulty) {
              clearTimeout(start_timeout);
              start_timeout = setTimeout(matchTimeOut, timeOutDelay);
              switch (outcome) {
                case 'PLAYER_WIN':
                  current_match.score.player++;
                  break;
                case 'BOT_WIN':
                  current_match.score.bot++;
                  break;
                default:
              }
              if (current_match.score.player > current_match.score.bot) { outcome = 'PLAYER_WIN' }
              else if (current_match.score.player < current_match.score.bot) { outcome = 'BOT_WIN' }
              else if (current_match.score.player = current_match.score.bot) { outcome = 0 }
              current_match.round++;
              bot_message += `Round ${current_match.round} over! Player=${current_match.score.player}, Bot=${current_match.score.bot}. `;
              if (current_match.round != current_match.difficulty) { bot_message += `Your move! `; }
              message.reply(bot_message);
              bot_message = 0;
              match_found = true;
            }
            if (current_match.round == current_match.difficulty) {
              endMatch(outcome);
            }
            break;
          }
        }
        if (state === states.waiting && match_found === false) {
          endMatch('BAD_MOVE');
        }
      }
      break;
  }

  if (message.content === '!channel') {
    message.channel.send('test');
    console.log(message.channel);
  }




  if (message.content === '!ping') {
    message.reply('pong');
  }

  if (message.content === '!what is my avatar' ) {
    message.reply(message.author.avatarURL);
  }

  // If the message is "how to embed"
  if (message.content === '!how to embed') {
    // We can create embeds using the MessageEmbed constructor
    // Read more about all that you can do with the constructor
    // over at https://discord.js.org/#/docs/main/stable/class/RichEmbed
    const embed = new Discord.RichEmbed()
      // Set the title of the field
      .setTitle('A slick little embed')
      // Set the color of the embed
      .setColor(0xFF0000)
      // Set the main content of the embed
      .setDescription('Hello, this is a slick embed!');
    // Send the embed to the same channel as the message
    message.channel.send(embed);
  }
});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
  // Send the message to a designated channel on a server:
  const channel = member.guild.channels.find(ch => ch.name === 'battlegrounds');
  // Do nothing if the channel wasn't found on this server
  if (!channel) return;
  // Send the message, mentioning the member
  channel.send(`Welcome to the server, ${member}`);
});

client.login(auth.token);

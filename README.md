# GhostNeneRobo
A Project Sekai Tiering Discord Bot that stores user and tiering data and visualizes them in the form of graphs and heatmaps

# Visualization overview
All visualization is based from a central database that tracks two things
- All users that have linked with the bot
- The current top 120 people on the leaderboard

With that information many different visualizations can be made
#### Statistics
/statistics shows the current statistics for a specific user or current tier on the leaderboard (T100).

This show multiple useful values. The most useful are the event points and games played in the last hour, to see a user's current pace.
Additionally this command shows the last 6 games played, the timestamp of when they played, and the energy usage of the game.
<p align="center">
  <img width="441" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/b181419c-6d00-448a-b10d-a853b21a34f0">
</p>

#### Graph
##### Use
/graph cutoff(tier, by_tier=None, event=None)

/graph user(user, event=None)

##### Description
/graph shows the event point graph for a specific user or current tier on the leaderboard (T100).

This is a simple line graph of your event points over time, it's useful to see your usual pace over a period of time. This graph uses quickchart.io to generate the graph.

<p align="center">
  <img width="376" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/e39a58ce-0d41-4436-87d2-37be56649a68">
</p>

#### Heatmap
##### Use
/heatmap cutoff(tier, offset=None, event=None, pallete=None, annotategames=None, bypoints=None)

/heatmap user(user, offset=None, event=None, pallete=None, annotategames=None, bypoints=None)

##### Description
/heatmap shows the games played or points gained for every hour of an event. This uses plotly to generate the graph.

additionally it can be configured in the settings with a different color palette and to show numbers on the heatmap (example with default color palette and numbers shown).

<p align="center">
  <img width="368" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/446f7b18-59c9-45b0-a27f-a5ce4e3b516b">
</p>

#### Histogram
##### Use
/hist cutoff(tier, binsize=None, min=None, max=None, event=None, hourly=None, games=None)

/hist user(user, binsize=None, min=None, max=None, event=None, hourly=None, games=None)

##### Description
/hist shows the histogram of your event points for each individual game. This uses plotly to generate the graph.

This can also be configured to show event points per hour, and games played per hour.

<p align="center">
  <img width="373" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/d0da6501-2073-4ad5-8ca1-ba8bf1c77643">
</p>

#### Bar
##### Use
/bar cutoff(tier, hour, event=None)

/bar user(tier, hour, event=None)

##### Description
/bar shows a bar graph of every game played for a given hour, there are buttons at the bottom to move between hours. This uses plotly to generate the graph.

<p align="center">
  <img width="375" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/fc83bbc7-a6fd-47a0-9dbf-b209951caae7">
</p>

#### Leaderboard
##### Use
/leaderboard(rank=None)

##### Description
/leaderboard shows the current top 120 players separated into 6 pages

This also shows their change in current tier, their change in event points over the last hour
Additionally, an alternative view shows the score per game over the last hour, their total games played, and the games they played in the last hour.

<p align="center">
  <img width="426" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/ed068ad2-d518-4e59-a71b-7fce868b113e">
  <img width="411" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/714df0ee-cfdc-4f08-9f62-efada0753dca">
</p>

# Miscellaneous Commands
Aside from visualization GhostNeneRobo has other functions useful for tiering and for fun

#### Gacha
/gacha automatically generates an image with a 10 roll on the in game gacha. Due to copyright I cannot give an example image here.

#### Room
/rm is a function that renames a channel for a specific room code and amount of open players

<p align="center">
  <img width="361" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/fab527a8-ac54-4f31-8029-04ebbf231107">
</p>

#### Bonk
/bonk allows you to "bonk" another user to go to sleep. This also stored the amount of times a single user has been bonked

<p align="center">
  <img width="244" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/3c0d5190-4ed5-4010-91bc-5745682f259a">
</p>

#### Pray
/pray is a command that lets you pray to a specific character in Project Sekai, this command gives luck varying from -1 to 80

<p align="center">
  <img width="493" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/35109c59-3bfa-49d7-8f3e-a2e67d8ae05d">
</p>

#### Stock
/stock is a command with 5 subcommands
These subcommands are
- get
- buy
- sell
- list
- portfolio

##### Get
/stock get(symbol)

This command gets a specific stock by it's symbol, this works both for custom-named stock tickers and normal ones
<p align="center">
  <img width="276" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/a5ae2efc-c213-4228-90e6-fc872560d9a6">
</p>

##### Buy
/stock buy(symbol, amount)

This command buys a given amount of a specific stock ticker of a given amount, this uses luck gained from the command /pray to buy stock

<p align="center">
  <img width="439" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/f45c1f4c-653a-47b7-859e-e8f78b05832c">
</p>

##### Sell
/stock sell(symbol, amount)

This command sells a given amount of a stock (given that the user has enough) and gives luck from the current price

<p align="center">
  <img width="420" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/155552c9-3c6c-4bfc-8c43-cbe693a55509">
</p>

##### List
/stock list()

This command lists all tickers for custom stocks

##### Portfolio

This command lists the users current stock portfolio and their current prices

<p align="center">
  <img width="248" alt="image" src="https://github.com/Ai0796/RoboNene/assets/36570430/d3010b51-37ac-4b67-ae6d-5123e92ca06e">

</p>

## Installation
Rename `config.sample.json` to `config.json`

Fill `token: ""` with your own discord bot token, obtainable from [Discord Developer Portal](https://discord.com/developers/applications/)

*Make sure that you have enabled applications.commands as a scope when generating an invite URL*

`npm init` to install all of the required dependencies

`npm run load` to load all the slash commands

`node index.js` to run the bot

## Note
Due to the sensitive nature of the game API, the script to pull data from the game is not included in this code.  

## Contact
If you have any issues with the bot or would like to contribute, please contact Ai0 on Discord.

## Credits
**Code**
* Potor10#3237
* Ai0
* Ult#0001
* Redside#1337
* Yuu#6883
* Maid

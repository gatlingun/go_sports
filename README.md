# go_sports!!!!

## Background
A simple web program with learning intent to track sports
The idea as of now is to track all 32 NFL teams for the upcoming 2026-27 NFL season where we can quickly pull down team stats, schedule, news, etc.

Intended architecture is:

Frontend:
HTML + CSS + Typescript/Javascript

Backend:
GO

Where backend fetches all relevant information and frontend serves the data.

### API data provider
[BALLDONTLIE NFL](https://nfl.balldontlie.io/) is used for NFL teams and games. Its free tier permits five requests per minute and includes current and scheduled games.

Create an account, then add the key to a top-level `.env` file:

```text
BDL_API_KEY=your_api_key
```


### Revision history

gatlingun 08/2026 Project start \
gatlingun 08/2026 api-sports.io integrated as data source \
gatlingun 08/2026 api-sports.io replaced with BALLDONTLIE NFL
gatlingun 08/2026 First working draft with 2026 NFL games provided

### AI Disclaimer
AI coding assistants were used in the creation of this project
